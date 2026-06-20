import { mutation } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { assertVenueAccess } from '../../lib/venueAccess'
import { hasConflict, isWithinScheduleOrOvernight, buildConflictWindow } from '../../lib/conflicts'
import { isoWeekday } from '../../lib/dates'
import { resolvePaymentType } from '../../lib/payments'
import { resolveScheduleForDate, addDays } from '../../lib/schedule'
import { addMinutes } from '../../lib/time'
import type { Id } from '../../_generated/dataModel'

// Statuses that require schedule bounds validation on create
const SCHEDULE_CHECKED_STATUSES = new Set(['pending', 'deposit_paid', 'paid', 'absent', 'on_court'])

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    venueId:     v.id('venues'),
    courtId:     v.id('courts'),
    date:        v.string(),   // "YYYY-MM-DD"
    startTime:   v.number(),   // minutes since midnight (0–2879)
    endTime:     v.number(),   // minutes since midnight (0–2879)
    clientName:  v.string(),
    clientPhone: v.string(),
    totalAmount: v.number(),
    status:      v.optional(v.union(
      v.literal('pending'),
      v.literal('deposit_paid'),
      v.literal('on_court'),
      v.literal('absent'),
      v.literal('paid'),
      v.literal('maintenance'),
      v.literal('recurring'),
      v.literal('played'),
      v.literal('event'),
    )),
    notes:               v.optional(v.string()),
    paymentMethod:       v.optional(v.union(v.literal('cash'), v.literal('online'))),
    customDepositAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await assertVenueAccess(ctx, args.venueId)

    // INV-1/2/8: validate time bounds
    if (args.startTime < 0 || args.startTime > 1439)      throw new ConvexError('invalid_start')
    if (args.endTime > 2879)                               throw new ConvexError('invalid_end')
    if (args.endTime <= args.startTime)                    throw new ConvexError('end_before_start')

    // Verify court belongs to the declared venue
    const court = await ctx.db.get(args.courtId)
    if (!court || court.venueId !== args.venueId) {
      throw new ConvexError('court_not_in_venue')
    }

    // Fetch venue once — used for holiday enforcement, schedule validation, and depositAmount calculation
    const venue = await ctx.db.get(args.venueId)

    const status = args.status ?? 'deposit_paid'

    // Holiday enforcement — skip for maintenance blocks (owner explicitly closing a slot)
    if (status !== 'maintenance') {
      const isHoliday = (venue?.holidays ?? []).some((h) => h.date === args.date)
      if (isHoliday) {
        throw new ConvexError('La cancha no está disponible en esta fecha (feriado)')
      }
    }

    // Conflict detection — cross-day window [date-1, date, date+1]
    const existing = await ctx.db
      .query('reservations')
      .withIndex('by_courtId', (q) => q.eq('courtId', args.courtId))
      .collect()

    const conflictWindow = buildConflictWindow(existing, args.date)

    if (hasConflict(conflictWindow, args.startTime, args.endTime)) {
      throw new ConvexError('time_conflict')
    }

    // Schedule validation — only for bookable statuses (not maintenance/event/recurring)
    if (SCHEDULE_CHECKED_STATUSES.has(status)) {
      const prevDate     = addDays(args.date, -1)
      const scheduleForDate = court.scheduleOverride
        ?? resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], args.date)
      const prevSchedule = court.scheduleOverride
        ?? resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], prevDate)

      if (!isWithinScheduleOrOvernight(
        scheduleForDate, isoWeekday(args.date),
        args.startTime, args.endTime,
        prevSchedule, isoWeekday(prevDate),
      )) {
        throw new ConvexError('La cancha no está disponible en ese horario')
      }
    }

    // Validate customDepositAmount if provided
    if (args.customDepositAmount !== undefined) {
      if (args.customDepositAmount < 0 || args.customDepositAmount > args.totalAmount)
        throw new ConvexError('invalid_deposit_amount')
    }

    // Compute and freeze depositAmount when the reservation starts as paid or señado
    let depositAmount: number | undefined
    if (status === 'deposit_paid' || status === 'paid') {
      const pct = venue?.pricingConfig?.depositPercentage ?? 50
      depositAmount = status === 'paid'
        ? args.totalAmount
        : (args.customDepositAmount ?? Math.round(args.totalAmount * pct / 100))
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

export const updateStatus = mutation({
  args: {
    reservationId:  v.id('reservations'),
    status: v.union(
      v.literal('pending'),
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
    cashAmount:           v.optional(v.number()),
    onlineAmount:         v.optional(v.number()),
    totalAmountOverride:  v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Read reservation BEFORE patching so we have the current status for type resolution
    const reservation = await ctx.db.get(args.reservationId)
    if (!reservation) throw new ConvexError('not_found')

    await assertVenueAccess(ctx, reservation.venueId)

    // Apply totalAmountOverride before computing pendingBalance
    if (args.totalAmountOverride !== undefined) {
      if (args.totalAmountOverride < 0) throw new ConvexError('invalid_amount_override')
      if (args.totalAmountOverride > 0) {
        await ctx.db.patch(args.reservationId, { totalAmount: args.totalAmountOverride })
      }
    }

    const effectiveTotalAmount = (args.totalAmountOverride != null && args.totalAmountOverride > 0)
      ? args.totalAmountOverride
      : reservation.totalAmount

    // When marking as paid, freeze depositAmount = full settled amount so the frontend
    // can compute pendingBalance = 0 and hide the payment UI. After any future extension,
    // totalAmount will exceed depositAmount, surfacing the extra charge automatically.
    const statusPatch: Record<string, unknown> = { status: args.status }
    if (args.status === 'paid') statusPatch.depositAmount = effectiveTotalAmount
    await ctx.db.patch(args.reservationId, statusPatch)

    // No payment inserted on absent transitions — existing deposit payment serves as retention evidence
    if (args.status === 'absent') return

    const cash   = args.cashAmount   ?? 0
    const online = args.onlineAmount ?? 0

    // Transitioning to 'paid' on a non-zero reservation requires payment info.
    // Without it the status becomes 'paid' but no payment row is created, making
    // the finance total appear as $0.
    if (args.status === 'paid' && effectiveTotalAmount > 0) {
      if (cash === 0 && online === 0 && args.paymentMethod === undefined) {
        throw new ConvexError('payment_info_required')
      }
    }

    if (cash > 0 || online > 0) {
      if (cash < 0 || online < 0) throw new ConvexError('negative_payment_amount')

      const hasDeposit     = reservation.depositAmount != null && reservation.depositAmount > 0
      const paymentType    = hasDeposit ? 'balance' : resolvePaymentType(reservation.status)
      const pendingBalance = hasDeposit
        ? Math.max(0, effectiveTotalAmount - reservation.depositAmount!)
        : effectiveTotalAmount

      if (cash + online !== pendingBalance) throw new ConvexError('invalid_split_amounts')

      const ts = Date.now()
      if (cash   > 0) await ctx.db.insert('payments', { reservationId: args.reservationId, type: paymentType, amount: cash,   method: 'cash',   status: 'completed', timestamp: ts })
      if (online > 0) await ctx.db.insert('payments', { reservationId: args.reservationId, type: paymentType, amount: online, method: 'online', status: 'completed', timestamp: ts })
      return
    }

    // INVARIANT: always use effectiveTotalAmount (not reservation.totalAmount) for payment amounts.
    // reservation.totalAmount is the pre-patch value; totalAmountOverride may have changed it.
    // depositAmount is frozen at the value written by create() or the updateStatus('paid') path.
    // extendReservation intentionally does NOT touch depositAmount — extension delta surfaces
    // as (totalAmount - depositAmount) in the frontend. Do not break this invariant.

    // Legacy path — paymentMethod only
    if (args.paymentMethod !== undefined) {
      const hasDeposit    = reservation.depositAmount != null && reservation.depositAmount > 0
      const paymentType   = hasDeposit ? 'balance' : resolvePaymentType(reservation.status)
      const pendingBalance = hasDeposit
        ? Math.max(0, effectiveTotalAmount - reservation.depositAmount!)
        : effectiveTotalAmount
      const amount        = paymentType === 'balance' ? pendingBalance : effectiveTotalAmount

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
    paymentMethod:     v.optional(v.union(v.literal('cash'), v.literal('online'))),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId)
    if (!reservation) throw new ConvexError('Reserva no encontrada')

    await assertVenueAccess(ctx, reservation.venueId)

    if (
      reservation.status !== 'on_court' &&
      reservation.status !== 'paid'      &&
      reservation.status !== 'deposit_paid' &&
      reservation.status !== 'pending'
    ) {
      throw new ConvexError('Solo se puede extender una reserva en curso')
    }

    const newEndTime = addMinutes(reservation.endTime, args.additionalMinutes)

    const court = await ctx.db.get(reservation.courtId)
    const venue = await ctx.db.get(reservation.venueId)
    const dow   = isoWeekday(reservation.date)

    // Resolve date-aware schedule (with court override taking priority)
    const prevDate        = addDays(reservation.date, -1)
    const scheduleForDate = court?.scheduleOverride
      ?? resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], reservation.date)
    const prevSchedule    = court?.scheduleOverride
      ?? resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], prevDate)

    // Schedule bounds check — skipped only when overrideSchedule is explicitly true
    if (!args.overrideSchedule) {
      if (!isWithinScheduleOrOvernight(
        scheduleForDate, dow,
        reservation.startTime, newEndTime,
        prevSchedule, isoWeekday(prevDate),
      )) {
        throw new ConvexError({
          code:    'outside_schedule_override_required',
          message: 'La extensión supera el horario de cierre de la sede.',
        })
      }
    }

    // Conflict check always runs regardless of overrideSchedule — cross-day window
    const existing = await ctx.db
      .query('reservations')
      .withIndex('by_courtId', (q) => q.eq('courtId', reservation.courtId))
      .collect()
    const conflictWindow = buildConflictWindow(existing, reservation.date)

    if (hasConflict(conflictWindow, reservation.startTime, newEndTime, args.reservationId)) {
      throw new ConvexError('La cancha ya tiene una reserva en ese horario')
    }

    // Extra charge based on the extension window (current endTime → newEndTime)
    const pricePerHour   = court?.priceOverride ?? venue?.pricingConfig?.pricePerHour ?? 0
    const nightRatePrice = venue?.pricingConfig?.nightRatePrice
    const nightRateStart = venue?.pricingConfig?.nightRateStart

    const extStartMin = reservation.endTime
    const extEndMin   = extStartMin + args.additionalMinutes

    let extraCharge: number
    if (nightRatePrice && nightRateStart) {
      const dayPart   = Math.max(0, Math.min(extEndMin, nightRateStart) - extStartMin)
      const nightPart = Math.max(0, extEndMin - Math.max(extStartMin, nightRateStart))
      extraCharge = Math.round(pricePerHour * dayPart / 60 + nightRatePrice * nightPart / 60)
    } else {
      extraCharge = Math.round(pricePerHour * args.additionalMinutes / 60)
    }

    // Do NOT patch depositAmount here. The frontend derives pendingBalance as
    // (totalAmount - depositAmount). Leaving depositAmount unchanged causes the
    // extension charge to surface automatically as the new pendingBalance delta.
    await ctx.db.patch(args.reservationId, {
      endTime:     newEndTime,
      totalAmount: reservation.totalAmount + extraCharge,
    })

    if (args.paymentMethod && extraCharge > 0) {
      await ctx.db.insert('payments', {
        reservationId: args.reservationId,
        type:          'balance',
        amount:        extraCharge,
        method:        args.paymentMethod,
        status:        'completed',
        timestamp:     Date.now(),
      })
    }
  },
})

// ---------------------------------------------------------------------------
// updateReservation
// ---------------------------------------------------------------------------

export const updateReservation = mutation({
  args: {
    reservationId: v.id('reservations'),
    startTime:     v.optional(v.number()),
    endTime:       v.optional(v.number()),
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

    if (reservation.status !== 'pending' && reservation.status !== 'deposit_paid' && reservation.status !== 'absent') {
      throw new ConvexError('No se puede editar una reserva en este estado')
    }

    const hasAnyField = Object.values(fields).some((v) => v !== undefined)
    if (!hasAnyField) {
      throw new ConvexError('Debe modificar al menos un campo')
    }

    if (fields.startTime !== undefined || fields.endTime !== undefined) {
      const newStart = fields.startTime ?? reservation.startTime
      const newEnd   = fields.endTime   ?? reservation.endTime

      // INV-1/2/8: validate updated time bounds
      if (newStart < 0 || newStart > 1439) throw new ConvexError('invalid_start')
      if (newEnd > 2879)                   throw new ConvexError('invalid_end')
      if (newEnd <= newStart)              throw new ConvexError('end_before_start')

      const court = await ctx.db.get(reservation.courtId)
      const venue = await ctx.db.get(reservation.venueId)
      const prevDate        = addDays(reservation.date, -1)
      const scheduleForDate = court?.scheduleOverride
        ?? resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], reservation.date)
      const prevSchedule    = court?.scheduleOverride
        ?? resolveScheduleForDate(venue?.scheduleHistory, venue?.schedule ?? [], prevDate)

      if (!isWithinScheduleOrOvernight(
        scheduleForDate, isoWeekday(reservation.date),
        newStart, newEnd,
        prevSchedule, isoWeekday(prevDate),
      )) {
        throw new ConvexError('La cancha no está disponible en ese horario')
      }

      const existing = await ctx.db
        .query('reservations')
        .withIndex('by_courtId', (q) => q.eq('courtId', reservation.courtId))
        .collect()
      const conflictWindow = buildConflictWindow(existing, reservation.date)

      if (hasConflict(conflictWindow, newStart, newEnd, reservationId)) {
        throw new ConvexError('La cancha ya tiene una reserva en ese horario')
      }
    }

    const patch: Partial<{
      startTime:   number
      endTime:     number
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

    if (reservation.status !== 'absent' && reservation.status !== 'maintenance') {
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
