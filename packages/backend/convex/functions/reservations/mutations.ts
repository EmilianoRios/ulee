import { mutation, MutationCtx } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import { hasConflict, isWithinSchedule } from '../../lib/conflicts'
import { isoWeekday } from '../../lib/dates'
import { resolvePaymentType } from '../../lib/payments'
import { resolveScheduleForDate } from '../../lib/schedule'
import type { Id } from '../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

async function assertVenueAccess(
  ctx: MutationCtx,
  venueId: Id<'venues'>
) {
  const identity = await getCurrentUser(ctx)
  const clerkId  = identity.subject

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .first()
  if (!user) throw new ConvexError('user_not_found')

  const access = await ctx.db
    .query('venueAccess')
    .withIndex('by_userId_venueId', (q) =>
      q.eq('userId', user._id).eq('venueId', venueId)
    )
    .first()

  const venue = await ctx.db.get(venueId)

  if (!access && venue?.ownerId !== user._id) {
    throw new ConvexError('unauthorized')
  }

  return user
}

// Statuses that require schedule bounds validation on create
const SCHEDULE_CHECKED_STATUSES = new Set(['deposit_paid', 'paid', 'absent', 'on_court'])

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    venueId:     v.id('venues'),
    courtId:     v.id('courts'),
    date:        v.string(),   // "YYYY-MM-DD"
    startTime:   v.string(),   // "HH:MM"
    endTime:     v.string(),   // "HH:MM"
    clientName:  v.string(),
    clientPhone: v.string(),
    totalAmount: v.number(),
    status:      v.optional(v.union(
      v.literal('deposit_paid'),
      v.literal('on_court'),
      v.literal('absent'),
      v.literal('paid'),
      v.literal('maintenance'),
      v.literal('recurring'),
      v.literal('played'),
      v.literal('event'),
    )),
    notes:         v.optional(v.string()),
    paymentMethod: v.optional(v.union(v.literal('cash'), v.literal('online'))),
  },
  handler: async (ctx, args) => {
    const user = await assertVenueAccess(ctx, args.venueId)

    // Verify court belongs to the declared venue
    const court = await ctx.db.get(args.courtId)
    if (!court || court.venueId !== args.venueId) {
      throw new ConvexError('court_not_in_venue')
    }

    // Conflict detection — fetch existing reservations for this court + date
    const existing = await ctx.db
      .query('reservations')
      .withIndex('by_courtId', (q) => q.eq('courtId', args.courtId))
      .collect()

    const sameDay = existing.filter((r) => r.date === args.date)

    if (hasConflict(sameDay, args.startTime, args.endTime)) {
      throw new ConvexError('time_conflict')
    }

    const status = args.status ?? 'deposit_paid'

    // Fetch venue once — used by both schedule validation and depositAmount calculation
    const venue = await ctx.db.get(args.venueId)

    // Schedule validation — only for bookable statuses (not maintenance/event/recurring)
    if (SCHEDULE_CHECKED_STATUSES.has(status)) {
      const scheduleForDate = court.scheduleOverride
        ? court.scheduleOverride
        : resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], args.date)
      const dow = isoWeekday(args.date)
      if (!isWithinSchedule(scheduleForDate, dow, args.startTime, args.endTime)) {
        throw new ConvexError('La cancha no está disponible en ese horario')
      }
    }

    // Compute and freeze depositAmount when the reservation starts as paid or señado
    let depositAmount: number | undefined
    if (status === 'deposit_paid' || status === 'paid') {
      const pct = venue?.pricingConfig?.depositPercentage ?? 50
      depositAmount = status === 'paid'
        ? args.totalAmount
        : Math.round(args.totalAmount * pct / 100)
    }

    const reservationId = await ctx.db.insert('reservations', {
      venueId:         args.venueId,
      courtId:         args.courtId,
      date:            args.date,
      startTime:       args.startTime,
      endTime:         args.endTime,
      clientName:      args.clientName,
      clientPhone:     args.clientPhone,
      totalAmount:     args.totalAmount,
      depositAmount,
      status,
      notes:           args.notes,
      createdByUserId: user._id,
    })

    // Insert payment record when a payment method is provided
    if (args.paymentMethod !== undefined && depositAmount !== undefined) {
      if (status === 'deposit_paid') {
        await ctx.db.insert('payments', {
          reservationId,
          type:      'deposit',
          amount:    depositAmount,
          method:    args.paymentMethod,
          status:    'completed',
          timestamp: Date.now(),
        })
      } else if (status === 'paid') {
        await ctx.db.insert('payments', {
          reservationId,
          type:      'full',
          amount:    args.totalAmount,
          method:    args.paymentMethod,
          status:    'completed',
          timestamp: Date.now(),
        })
      }
    }

    return reservationId
  },
})

// ---------------------------------------------------------------------------
// Private time helper
// ---------------------------------------------------------------------------

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const updateStatus = mutation({
  args: {
    reservationId:  v.id('reservations'),
    status: v.union(
      v.literal('deposit_paid'),
      v.literal('on_court'),
      v.literal('absent'),
      v.literal('paid'),
      v.literal('maintenance'),
      v.literal('recurring'),
      v.literal('played'),
      v.literal('event'),
    ),
    paymentMethod: v.optional(v.union(v.literal('cash'), v.literal('online'))),
    // deprecated — backend recalculates from depositAmount; kept for API compatibility
    paymentAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Read reservation BEFORE patching so we have the current status for type resolution
    const reservation = await ctx.db.get(args.reservationId)
    if (!reservation) throw new ConvexError('not_found')

    await assertVenueAccess(ctx, reservation.venueId)

    await ctx.db.patch(args.reservationId, { status: args.status })

    // No payment inserted on absent transitions — existing deposit payment serves as retention evidence
    if (args.status === 'absent') return

    if (args.paymentMethod !== undefined) {
      const paymentType   = resolvePaymentType(reservation.status)
      const pendingBalance = reservation.depositAmount != null
        ? reservation.totalAmount - reservation.depositAmount
        : reservation.totalAmount
      const amount = paymentType === 'balance' ? pendingBalance : reservation.totalAmount

      await ctx.db.insert('payments', {
        reservationId: args.reservationId,
        type:          paymentType,
        amount,
        method:        args.paymentMethod,
        status:        'completed',
        timestamp:     Date.now(),
      })
    }
  },
})

// ---------------------------------------------------------------------------
// extendReservation
// ---------------------------------------------------------------------------

export const extendReservation = mutation({
  args: {
    reservationId:     v.id('reservations'),
    additionalMinutes: v.union(v.literal(30), v.literal(60)),
    overrideSchedule:  v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId)
    if (!reservation) throw new ConvexError('Reserva no encontrada')

    await assertVenueAccess(ctx, reservation.venueId)

    if (reservation.status !== 'on_court') {
      throw new ConvexError('Solo se puede extender una reserva en curso')
    }

    const newEndTime = addMinutesToTime(reservation.endTime, args.additionalMinutes)

    const court = await ctx.db.get(reservation.courtId)
    const venue = await ctx.db.get(reservation.venueId)
    const dow   = isoWeekday(reservation.date)

    // Resolve date-aware schedule (with court override taking priority)
    const scheduleForDate = court?.scheduleOverride
      ? court.scheduleOverride
      : resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], reservation.date)

    // Schedule bounds check — skipped only when overrideSchedule is explicitly true
    if (!args.overrideSchedule) {
      if (!isWithinSchedule(scheduleForDate, dow, reservation.startTime, newEndTime)) {
        throw new ConvexError({
          code:    'outside_schedule_override_required',
          message: 'La extensión supera el horario de cierre de la sede.',
        })
      }
    }

    // Conflict check always runs regardless of overrideSchedule
    const existing = await ctx.db
      .query('reservations')
      .withIndex('by_courtId', (q) => q.eq('courtId', reservation.courtId))
      .collect()
    const sameDay = existing.filter((r) => r.date === reservation.date)

    if (hasConflict(sameDay, reservation.startTime, newEndTime, args.reservationId)) {
      throw new ConvexError('La cancha ya tiene una reserva en ese horario')
    }

    await ctx.db.patch(args.reservationId, { endTime: newEndTime })
  },
})

// ---------------------------------------------------------------------------
// updateReservation
// ---------------------------------------------------------------------------

export const updateReservation = mutation({
  args: {
    reservationId: v.id('reservations'),
    startTime:     v.optional(v.string()),
    endTime:       v.optional(v.string()),
    clientName:    v.optional(v.string()),
    clientPhone:   v.optional(v.string()),
    totalAmount:   v.optional(v.number()),
    notes:         v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { reservationId, ...fields } = args

    const reservation = await ctx.db.get(reservationId)
    if (!reservation) throw new ConvexError('Reserva no encontrada')

    await assertVenueAccess(ctx, reservation.venueId)

    if (reservation.status !== 'deposit_paid' && reservation.status !== 'absent') {
      throw new ConvexError('No se puede editar una reserva en este estado')
    }

    const hasAnyField = Object.values(fields).some((v) => v !== undefined)
    if (!hasAnyField) {
      throw new ConvexError('Debe modificar al menos un campo')
    }

    if (fields.startTime !== undefined || fields.endTime !== undefined) {
      const newStart = fields.startTime ?? reservation.startTime
      const newEnd   = fields.endTime   ?? reservation.endTime

      const court = await ctx.db.get(reservation.courtId)
      const venue = await ctx.db.get(reservation.venueId)
      const scheduleForDate = court?.scheduleOverride
        ? court.scheduleOverride
        : resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], reservation.date)
      const dow = isoWeekday(reservation.date)

      if (!isWithinSchedule(scheduleForDate, dow, newStart, newEnd)) {
        throw new ConvexError('La cancha no está disponible en ese horario')
      }

      const existing = await ctx.db
        .query('reservations')
        .withIndex('by_courtId', (q) => q.eq('courtId', reservation.courtId))
        .collect()
      const sameDay = existing.filter((r) => r.date === reservation.date)

      if (hasConflict(sameDay, newStart, newEnd, reservationId)) {
        throw new ConvexError('La cancha ya tiene una reserva en ese horario')
      }
    }

    const patch: Partial<{
      startTime:   string
      endTime:     string
      clientName:  string
      clientPhone: string
      totalAmount: number
      notes:       string
    }> = {}

    if (fields.startTime   !== undefined) patch.startTime   = fields.startTime
    if (fields.endTime     !== undefined) patch.endTime     = fields.endTime
    if (fields.clientName  !== undefined) patch.clientName  = fields.clientName
    if (fields.clientPhone !== undefined) patch.clientPhone = fields.clientPhone
    if (fields.totalAmount !== undefined) patch.totalAmount = fields.totalAmount
    if (fields.notes       !== undefined) patch.notes       = fields.notes

    await ctx.db.patch(reservationId, patch)
  },
})

// ---------------------------------------------------------------------------
// deleteReservation
// ---------------------------------------------------------------------------

export const deleteReservation = mutation({
  args: {
    reservationId: v.id('reservations'),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId)
    if (!reservation) throw new ConvexError('Reserva no encontrada')

    await assertVenueAccess(ctx, reservation.venueId)

    if (reservation.status !== 'absent') {
      throw new ConvexError('No se puede eliminar una reserva con pago registrado. Primero revertí el estado.')
    }

    const payments = await ctx.db
      .query('payments')
      .withIndex('by_reservationId', (q) => q.eq('reservationId', args.reservationId))
      .collect()

    await Promise.all(payments.map((p) => ctx.db.delete(p._id)))

    await ctx.db.delete(args.reservationId)
  },
})
