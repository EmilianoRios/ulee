import { mutation } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { assertVenueAccess } from '../../lib/venueAccess'
import { hasConflict, buildConflictWindow } from '../../lib/conflicts'

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------
// Books specific courts simultaneously for a single event at the same venue,
// date, and time slot. Uses best-effort semantics: books all conflict-free
// courts from the provided courtIds list. Only throws NO_COURTS_AVAILABLE
// when zero courts are available.
// ---------------------------------------------------------------------------

export const createEvent = mutation({
  args: {
    venueId:     v.id('venues'),
    date:        v.string(),
    startTime:   v.number(),
    endTime:     v.number(),
    clientName:  v.string(),
    clientPhone: v.string(),
    totalAmount: v.number(),
    courtIds:    v.array(v.id('courts')),
    notes:       v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Step 1 — auth
    const user = await assertVenueAccess(ctx, args.venueId)

    // Step 2 — venue exists
    const venue = await ctx.db.get(args.venueId)
    if (!venue) throw new ConvexError('VENUE_NOT_FOUND')

    // Step 3 — time bounds
    if (args.startTime < 0 || args.startTime > 1439) throw new ConvexError('INVALID_TIME_RANGE')
    if (args.endTime > 2879)                          throw new ConvexError('INVALID_TIME_RANGE')
    if (args.endTime <= args.startTime)               throw new ConvexError('INVALID_TIME_RANGE')

    // Step 4 — load all active courts at the venue and build a lookup map
    const allCourts = await ctx.db
      .query('courts')
      .withIndex('by_venueId', (q) => q.eq('venueId', args.venueId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect()

    const activeCourtsById = new Map(allCourts.map((c) => [c._id, c]))

    // Step 5 — validate that every requested courtId belongs to this venue
    const invalidIds = args.courtIds.filter((id) => !activeCourtsById.has(id))
    if (invalidIds.length > 0) throw new ConvexError('INVALID_COURT_IDS')

    // Step 6 — conflict-check each requested court; split into toBook / toSkip
    const toBook: typeof allCourts = []
    const skippedCourtNames: string[] = []

    for (const courtId of args.courtIds) {
      const court = activeCourtsById.get(courtId)!
      const existing = await ctx.db
        .query('reservations')
        .withIndex('by_courtId', (q) => q.eq('courtId', courtId))
        .collect()

      const window = buildConflictWindow(existing, args.date)

      if (hasConflict(window, args.startTime, args.endTime)) {
        skippedCourtNames.push(court.name)
      } else {
        toBook.push(court)
      }
    }

    // Step 7 — if every court conflicted, hard error
    if (toBook.length === 0) throw new ConvexError('NO_COURTS_AVAILABLE')

    // Step 8 — atomic insert; all reservations share the same eventId
    const eventId = crypto.randomUUID()
    const bookedReservationIds: string[] = []
    const bookedCourtNames: string[] = []

    for (const court of toBook) {
      const id = await ctx.db.insert('reservations', {
        venueId:         args.venueId,
        courtId:         court._id,
        date:            args.date,
        startTime:       args.startTime,
        endTime:         args.endTime,
        clientName:      args.clientName,
        clientPhone:     args.clientPhone,
        totalAmount:     args.totalAmount,
        status:          'event',
        notes:           args.notes,
        eventId,
        createdByUserId: user._id,
      })
      bookedReservationIds.push(id)
      bookedCourtNames.push(court.name)
    }

    return {
      bookedReservationIds,
      bookedCourtNames,
      skippedCourtNames,
      eventId,
    }
  },
})

// ---------------------------------------------------------------------------
// chargeEvent
// ---------------------------------------------------------------------------
// Marks all reservations belonging to an event as paid and inserts payment
// records. Guards against re-charging already-paid reservations.
// ---------------------------------------------------------------------------

export const chargeEvent = mutation({
  args: {
    eventId:       v.string(),
    paymentMethod: v.union(v.literal('cash'), v.literal('online')),
  },
  handler: async (ctx, args) => {
    // Step 1 — load all reservations for this event
    const reservations = await ctx.db
      .query('reservations')
      .withIndex('by_eventId', (q) => q.eq('eventId', args.eventId))
      .collect()

    if (reservations.length === 0) throw new ConvexError('EVENT_NOT_FOUND')

    // Step 2 — auth gate on the venue of the first reservation
    await assertVenueAccess(ctx, reservations[0].venueId)

    // Step 3 — filter out already-paid reservations (re-charge guard, R-3)
    const unpaidReservations = reservations.filter((r) => r.status !== 'paid')

    // Step 4 — patch each unpaid reservation and insert payment record
    for (const r of unpaidReservations) {
      await ctx.db.patch(r._id, {
        status:        'paid',
        depositAmount: r.totalAmount,
      })
      await ctx.db.insert('payments', {
        reservationId: r._id,
        type:          'full',
        amount:        r.totalAmount,
        method:        args.paymentMethod,
        status:        'completed',
        timestamp:     Date.now(),
      })
    }

    return { chargedCount: unpaidReservations.length }
  },
})
