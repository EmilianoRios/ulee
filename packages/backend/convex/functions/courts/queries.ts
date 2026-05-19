import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import { todayInAR } from '../../lib/time'
import type { Doc, Id } from '../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface CourtWithStats {
  _id:           Id<'courts'>
  _creationTime: number
  venueId:       Id<'venues'>
  name:          string
  sport:         string
  surface?:      string
  covered?:      boolean
  status:        Doc<'courts'>['status']
  pricePerHour:  number   // resolved: priceOverride ?? venue.pricingConfig.pricePerHour
  images?:       string[]
  todayTurnos:   number
  todayRevenue:  number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listByVenue = query({
  args: { venueId: v.id('venues') },
  handler: async (ctx, args): Promise<CourtWithStats[]> => {
    await getCurrentUser(ctx) // throws if unauthenticated

    const venue = await ctx.db.get(args.venueId)
    if (!venue) return []

    const courts = await ctx.db
      .query('courts')
      .withIndex('by_venueId', (q) => q.eq('venueId', args.venueId))
      .collect()

    // Fetch today's reservations for the venue in one query
    const today = todayInAR()
    const todayReservations = await ctx.db
      .query('reservations')
      .withIndex('by_venueId_date', (q) =>
        q.eq('venueId', args.venueId).eq('date', today)
      )
      .collect()

    // Aggregate per courtId
    const statsMap = new Map<string, { turnos: number; revenue: number }>()
    for (const r of todayReservations) {
      const key = r.courtId
      const cur = statsMap.get(key) ?? { turnos: 0, revenue: 0 }
      statsMap.set(key, { turnos: cur.turnos + 1, revenue: cur.revenue + r.totalAmount })
    }

    return courts.map((court) => {
      const stats = statsMap.get(court._id) ?? { turnos: 0, revenue: 0 }
      return {
        _id:           court._id,
        _creationTime: court._creationTime,
        venueId:       court.venueId,
        name:          court.name,
        sport:         court.sport,
        surface:       court.surface,
        covered:       court.covered,
        status:        court.status,
        pricePerHour:  court.priceOverride ?? venue.pricingConfig.pricePerHour,
        images:        court.images,
        todayTurnos:   stats.turnos,
        todayRevenue:  stats.revenue,
      }
    })
  },
})
