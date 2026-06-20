import { mutation } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { assertVenueAccess } from '../../lib/venueAccess'
import { hasConflict, buildConflictWindow } from '../../lib/conflicts'

// ---------------------------------------------------------------------------
// createEvent
// ---------------------------------------------------------------------------
// Books multiple courts simultaneously for a single event at the same venue,
// date, and time slot. Uses best-effort semantics: books all conflict-free
// courts up to courtCount. Only throws NO_COURTS_AVAILABLE when zero courts
// are available.
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
    courtCount:  v.number(),
    notes:       v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Step 1 — auth
    const user = await assertVenueAccess(ctx, args.venueId)

    // Step 2 — time bounds
    if (args.startTime < 0 || args.startTime > 1439) throw new ConvexError('INVALID_TIME_RANGE')
    if (args.endTime > 2879)                          throw new ConvexError('INVALID_TIME_RANGE')
    if (args.endTime <= args.startTime)               throw new ConvexError('INVALID_TIME_RANGE')

    // Step 3 — venue exists
    const venue = await ctx.db.get(args.venueId)
    if (!venue) throw new ConvexError('VENUE_NOT_FOUND')

    // Step 4 — load active courts at the venue
    const allCourts = await ctx.db
      .query('courts')
      .withIndex('by_venueId', (q) => q.eq('venueId', args.venueId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect()

    // Step 5 — validate courtCount
    if (args.courtCount < 1 || args.courtCount > allCourts.length) {
      throw new ConvexError('INVALID_COURT_COUNT')
    }

    // Step 6 — find first N conflict-free courts (sequential, early exit)
    const available: typeof allCourts = []
    const skippedNames: string[] = []

    for (const court of allCourts) {
      const existing = await ctx.db
        .query('reservations')
        .withIndex('by_courtId', (q) => q.eq('courtId', court._id))
        .collect()

      const window = buildConflictWindow(existing, args.date)

      if (hasConflict(window, args.startTime, args.endTime)) {
        skippedNames.push(court.name)
      } else {
        available.push(court)
        if (available.length === args.courtCount) break
      }
    }

    // Step 7 — full conflict = hard error
    if (available.length === 0) throw new ConvexError('NO_COURTS_AVAILABLE')

    // Step 8 — atomic insert; all reservations share the same eventId
    const eventId = crypto.randomUUID()
    const bookedIds: string[] = []
    const bookedNames: string[] = []

    for (const court of available) {
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
      bookedIds.push(id)
      bookedNames.push(court.name)
    }

    return {
      bookedReservationIds: bookedIds,
      bookedCourtNames:     bookedNames,
      skippedCourtNames:    skippedNames,
      eventId,
    }
  },
})
