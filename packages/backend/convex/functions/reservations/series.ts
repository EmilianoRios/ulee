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
    notes:        v.optional(v.string()),
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
    // RULE-CAP3: always pass maxOccurrences=52 as safety ceiling
    const dates = expandSeries(
      args.startDate,
      args.diasSemana,
      args.weekInterval,
      args.indefinite ? undefined : args.endDate,
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
        status:          'recurring',
        notes:           args.notes,
        seriesId,
        createdByUserId: user._id,
      })
      reservationIds.push(reservationId)
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
      // Use UTC date string — consistent with how reservation dates are stored
      const today = new Date().toISOString().slice(0, 10)

      const future = await ctx.db
        .query('reservations')
        .withIndex('by_seriesId', (q) => q.eq('seriesId', args.seriesId))
        .filter((q) => q.gte(q.field('date'), today))
        .collect()

      await Promise.all(future.map((r) => ctx.db.patch(r._id, { status: 'absent' })))
      cancelledCount = future.length
    }

    return { cancelledCount }
  },
})
