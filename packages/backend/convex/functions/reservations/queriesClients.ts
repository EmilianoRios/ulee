import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'

export const getClientsByVenue = query({
  args: { venueId: v.id('venues') },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx)
    // NOTE: use pagination or aggregation when venue reservation count grows large
    const rows = await ctx.db
      .query('reservations')
      .withIndex('by_venueId', (q) => q.eq('venueId', args.venueId))
      .collect()

    const map = new Map<string, { clientName: string; clientPhone: string; count: number; lastDate: string }>()
    for (const r of rows) {
      const key = r.clientPhone
      const existing = map.get(key)
      if (!existing) {
        map.set(key, { clientName: r.clientName, clientPhone: r.clientPhone, count: 1, lastDate: r.date })
      } else {
        existing.count++
        if (r.date > existing.lastDate) {
          existing.lastDate = r.date
          existing.clientName = r.clientName
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  },
})
