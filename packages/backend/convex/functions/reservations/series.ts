import { mutation } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { assertVenueAccess } from '../../lib/venueAccess'
import { expandSeries } from '../../lib/recurrence'
import { hasConflict, buildConflictWindow } from '../../lib/conflicts'
import type { Id } from '../../_generated/dataModel'

// ---------------------------------------------------------------------------
// createSeries
// ---------------------------------------------------------------------------
// Atomically creates a recurrenceSeries document and one reservation per
// expanded occurrence date (status = 'recurring'). All-or-nothing: if any
// occurrence conflicts or falls on a holiday, nothing is written.
// ---------------------------------------------------------------------------

export const createSeries = mutation({
  args: {
    venueId:      v.id('venues'),
    courtId:      v.id('courts'),
    clientName:   v.string(),
    clientPhone:  v.string(),
    totalAmount:  v.number(),
    startDate:    v.string(),            // "YYYY-MM-DD"
    endDate:      v.optional(v.string()), // "YYYY-MM-DD" — omit when indefinite=true
    indefinite:   v.boolean(),
    diasSemana:   v.array(v.number()),   // ISO 8601: 1=Mon…7=Sun
    weekInterval: v.union(v.literal(1), v.literal(2)),
    startTime:    v.number(),            // minutes since midnight (0–1439)
    endTime:      v.number(),            // minutes since midnight (0–2879; > 1440 = overnight)
    notes:               v.optional(v.string()),
    initialStatus:       v.optional(v.union(v.literal('pending'), v.literal('deposit_paid'), v.literal('paid'))),
    paymentMethod:       v.optional(v.union(v.literal('cash'), v.literal('online'))),
    customDepositAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await assertVenueAccess(ctx, args.venueId)

    // ── Invariant validation ────────────────────────────────────────────────
    if (args.startTime < 0 || args.startTime > 1439)
      throw new ConvexError('invalid_start')
    if (args.endTime > 2879)
      throw new ConvexError('invalid_end')
    if (args.endTime <= args.startTime)
      throw new ConvexError('end_before_start')
    if (args.diasSemana.length === 0 || args.diasSemana.some((d) => d < 1 || d > 7))
      throw new ConvexError('invalid_dias_semana')
    if (!args.indefinite && args.endDate && args.endDate < args.startDate)
      throw new ConvexError('end_before_start')

    // ── Verify court belongs to venue ──────────────────────────────────────
    const court = await ctx.db.get(args.courtId)
    if (!court || court.venueId !== args.venueId) throw new ConvexError('court_not_in_venue')

    // ── Fetch venue (holidays + pricing) ───────────────────────────────────
    const venue    = await ctx.db.get(args.venueId)
    const holidays = venue?.holidays ?? []

    // ── Expand series into concrete dates ──────────────────────────────────
    // RULE-CAP3: indefinite series are capped at 1 year from startDate;
    // explicit endDate series still get the 52-occurrence safety ceiling.
    const indefiniteEndDate = (() => {
      const d = new Date(`${args.startDate}T12:00:00Z`)
      d.setUTCFullYear(d.getUTCFullYear() + 1)
      return d.toISOString().slice(0, 10)
    })()

    const dates = expandSeries(
      args.startDate,
      args.diasSemana,
      args.weekInterval,
      args.indefinite ? indefiniteEndDate : args.endDate,
      52,
    )

    if (dates.length === 0) throw new ConvexError('no_occurrences_in_range')

    // ── Holiday check — fail fast on first hit (RULE-H1 through RULE-H4) ──
    for (const date of dates) {
      if (holidays.some((h) => h.date === date)) {
        throw new ConvexError(JSON.stringify({ code: 'holiday_conflict', date }))
      }
    }

    // ── Conflict detection — all-or-nothing (RULE-C1 through RULE-C4) ─────
    // Fetch all reservations for this court once; reuse for all occurrence checks
    const existing = await ctx.db
      .query('reservations')
      .withIndex('by_courtId', (q) => q.eq('courtId', args.courtId))
      .collect()

    for (const date of dates) {
      const window = buildConflictWindow(existing, date)
      if (hasConflict(window, args.startTime, args.endTime)) {
        throw new ConvexError(JSON.stringify({ code: 'time_conflict', date }))
      }
    }

    // ── Validate customDepositAmount ───────────────────────────────────────
    if (args.customDepositAmount !== undefined && (args.customDepositAmount < 0 || args.customDepositAmount > args.totalAmount)) {
      throw new ConvexError('invalid_deposit_amount')
    }

    // ── Compute depositAmount once (same for all instances) ────────────────
    const initialStatus = args.initialStatus ?? 'pending'
    let depositAmount: number | undefined
    if (initialStatus === 'paid') {
      depositAmount = args.totalAmount
    } else if (initialStatus === 'deposit_paid') {
      const pct = venue?.pricingConfig?.depositPercentage ?? 50
      depositAmount = args.customDepositAmount ?? Math.round(args.totalAmount * pct / 100)
    }

    // ── All-or-nothing insert ───────────────────────────────────────────────
    const sortedDias = [...args.diasSemana].sort((a, b) => a - b)

    const seriesId = await ctx.db.insert('recurrenceSeries', {
      courtId:         args.courtId,
      venueId:         args.venueId,
      diasSemana:      sortedDias,
      dayOfWeek:       sortedDias[0],    // backward compat: first day of the series
      weekInterval:    args.weekInterval,
      startTime:       args.startTime,
      endTime:         args.endTime,
      startDate:       args.startDate,
      endDate:         args.indefinite ? undefined : args.endDate,
      clientName:      args.clientName,
      clientPhone:     args.clientPhone,
      totalAmount:     args.totalAmount,
      notes:           args.notes,
      status:          'active',
      createdByUserId: user._id,
    })

    const reservationIds: Id<'reservations'>[] = []
    for (const date of dates) {
      const reservationId = await ctx.db.insert('reservations', {
        venueId:         args.venueId,
        courtId:         args.courtId,
        date,
        startTime:       args.startTime,
        endTime:         args.endTime,
        clientName:      args.clientName,
        clientPhone:     args.clientPhone,
        totalAmount:     args.totalAmount,
        depositAmount,
        status:          'recurring',
        notes:           args.notes,
        seriesId,
        createdByUserId: user._id,
      })
      reservationIds.push(reservationId)

      if (initialStatus !== 'pending' && depositAmount !== undefined && args.paymentMethod !== undefined) {
        await ctx.db.insert('payments', {
          reservationId,
          type:      initialStatus === 'paid' ? 'full' : 'deposit',
          amount:    depositAmount,
          method:    args.paymentMethod,
          status:    'completed',
          timestamp: Date.now(),
        })
      }
    }

    return { seriesId, reservationIds, count: reservationIds.length }
  },
})

// ---------------------------------------------------------------------------
// cancelSeries
// ---------------------------------------------------------------------------
// Marks the series as 'cancelled' and (by default) sets all future recurring
// reservations (date >= today) to 'absent'. Past instances are preserved.
// ---------------------------------------------------------------------------

export const cancelSeries = mutation({
  args: {
    seriesId:     v.id('recurrenceSeries'),
    cancelFuture: v.optional(v.boolean()), // default: true
  },
  handler: async (ctx, args) => {
    const series = await ctx.db.get(args.seriesId)
    if (!series) throw new ConvexError('not_found')

    await assertVenueAccess(ctx, series.venueId)

    await ctx.db.patch(args.seriesId, { status: 'cancelled' })

    let cancelledCount = 0
    if (args.cancelFuture !== false) {
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

      const future = await ctx.db
        .query('reservations')
        .withIndex('by_seriesId', (q) => q.eq('seriesId', args.seriesId))
        .filter((q) => q.gte(q.field('date'), today))
        .collect()

      await Promise.all(
        future.map(async (r) => {
          const payments = await ctx.db
            .query('payments')
            .withIndex('by_reservationId', (q) => q.eq('reservationId', r._id))
            .collect()
          await Promise.all(payments.map((p) => ctx.db.delete(p._id)))
          await ctx.db.delete(r._id)
        }),
      )
      cancelledCount = future.length
    }

    return { cancelledCount }
  },
})

// ---------------------------------------------------------------------------
// modifySeries
// ---------------------------------------------------------------------------
// Patches an active recurrenceSeries and all future reservation instances.
// If startTime/endTime changes, validates no conflicts (excluding own instances).
// If endDate is extended, generates and inserts new reservation instances.
// All writes are atomic within one Convex transaction.
// ---------------------------------------------------------------------------

export const modifySeries = mutation({
  args: {
    seriesId:    v.id('recurrenceSeries'),
    clientName:  v.optional(v.string()),
    clientPhone: v.optional(v.string()),
    totalAmount: v.optional(v.number()),
    notes:       v.optional(v.string()),
    startTime:   v.optional(v.number()),
    endTime:     v.optional(v.number()),
    endDate:     v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ── Eligibility guard ──────────────────────────────────────────────────
    const series = await ctx.db.get(args.seriesId)
    if (!series) throw new ConvexError('not_found')

    await assertVenueAccess(ctx, series.venueId)

    if (series.status !== 'active') throw new ConvexError('series_not_active')

    // ── Build typed patch objects ──────────────────────────────────────────
    const seriesPatch: {
      clientName?: string; clientPhone?: string; totalAmount?: number
      notes?: string; startTime?: number; endTime?: number; endDate?: string
    } = {}
    if (args.clientName  !== undefined) seriesPatch.clientName  = args.clientName
    if (args.clientPhone !== undefined) seriesPatch.clientPhone = args.clientPhone
    if (args.totalAmount !== undefined) seriesPatch.totalAmount = args.totalAmount
    if (args.notes       !== undefined) seriesPatch.notes       = args.notes
    if (args.startTime   !== undefined) seriesPatch.startTime   = args.startTime
    if (args.endTime     !== undefined) seriesPatch.endTime     = args.endTime
    if (args.endDate     !== undefined) seriesPatch.endDate     = args.endDate

    if (Object.keys(seriesPatch).length === 0) throw new ConvexError('empty_patch')

    // ── endDate validation ─────────────────────────────────────────────────
    if (args.endDate !== undefined) {
      if (!series.endDate) throw new ConvexError('series_is_indefinite')
      if (args.endDate <= series.endDate) throw new ConvexError('end_date_not_extended')
    }

    // ── Time bounds validation ─────────────────────────────────────────────
    if (args.startTime !== undefined || args.endTime !== undefined) {
      const newStart = args.startTime ?? series.startTime
      const newEnd   = args.endTime   ?? series.endTime
      if (newStart < 0 || newStart > 1439) throw new ConvexError('invalid_start')
      if (newEnd > 2879)                   throw new ConvexError('invalid_end')
      if (newEnd <= newStart)              throw new ConvexError('end_before_start')
    }

    // ── Fetch future instances + other-series court reservations ──────────
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

    const futureInstances = await ctx.db
      .query('reservations')
      .withIndex('by_seriesId', (q) => q.eq('seriesId', args.seriesId))
      .filter((q) => q.gte(q.field('date'), today))
      .collect()

    const needsConflictCheck = args.startTime !== undefined || args.endTime !== undefined || args.endDate !== undefined
    const otherSeries = needsConflictCheck
      ? (await ctx.db
          .query('reservations')
          .withIndex('by_courtId', (q) => q.eq('courtId', series.courtId))
          .collect()
        ).filter((r) => r.seriesId !== args.seriesId)
      : []

    // ── T3: Time-change conflict detection ─────────────────────────────────
    if (args.startTime !== undefined || args.endTime !== undefined) {
      const newStart = args.startTime ?? series.startTime
      const newEnd   = args.endTime   ?? series.endTime
      for (const instance of futureInstances) {
        const window = buildConflictWindow(otherSeries, instance.date)
        if (hasConflict(window, newStart, newEnd)) {
          throw new ConvexError(JSON.stringify({ code: 'time_conflict', date: instance.date }))
        }
      }
    }

    // ── T4: endDate extension — generate new dates ─────────────────────────
    let newDates: string[] = []
    if (args.endDate !== undefined && series.endDate) {
      const d = new Date(`${series.endDate}T12:00:00Z`)
      d.setUTCDate(d.getUTCDate() + 1)
      const dayAfterOld = d.toISOString().slice(0, 10)

      newDates = expandSeries(dayAfterOld, series.diasSemana, series.weekInterval, args.endDate, 52)

      const venue    = await ctx.db.get(series.venueId)
      const holidays = venue?.holidays ?? []
      const newStart = args.startTime ?? series.startTime
      const newEnd   = args.endTime   ?? series.endTime

      for (const date of newDates) {
        if (holidays.some((h) => h.date === date)) {
          throw new ConvexError(JSON.stringify({ code: 'holiday_conflict', date }))
        }
        const window = buildConflictWindow(otherSeries, date)
        if (hasConflict(window, newStart, newEnd)) {
          throw new ConvexError(JSON.stringify({ code: 'time_conflict', date }))
        }
      }
    }

    // ── T5: Atomic write phase ─────────────────────────────────────────────
    await ctx.db.patch(args.seriesId, seriesPatch)

    const instancePatch: {
      clientName?: string; clientPhone?: string; totalAmount?: number
      notes?: string; startTime?: number; endTime?: number
    } = {}
    if (args.clientName  !== undefined) instancePatch.clientName  = args.clientName
    if (args.clientPhone !== undefined) instancePatch.clientPhone = args.clientPhone
    if (args.totalAmount !== undefined) instancePatch.totalAmount = args.totalAmount
    if (args.notes       !== undefined) instancePatch.notes       = args.notes
    if (args.startTime   !== undefined) instancePatch.startTime   = args.startTime
    if (args.endTime     !== undefined) instancePatch.endTime     = args.endTime

    if (Object.keys(instancePatch).length > 0) {
      await Promise.all(futureInstances.map((r) => ctx.db.patch(r._id, instancePatch)))
    }

    if (newDates.length > 0) {
      const finalStart = args.startTime ?? series.startTime
      const finalEnd   = args.endTime   ?? series.endTime
      for (const date of newDates) {
        await ctx.db.insert('reservations', {
          venueId:     series.venueId,
          courtId:     series.courtId,
          date,
          startTime:   finalStart,
          endTime:     finalEnd,
          clientName:  args.clientName  ?? series.clientName,
          clientPhone: args.clientPhone ?? series.clientPhone,
          totalAmount: args.totalAmount ?? series.totalAmount,
          status:      'recurring',
          notes:       args.notes ?? series.notes,
          seriesId:    args.seriesId,
        })
      }
    }

    return { patchedCount: futureInstances.length, newInstanceCount: newDates.length }
  },
})
