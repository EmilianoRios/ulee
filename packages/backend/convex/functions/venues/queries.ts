import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { ConvexError } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import type { Doc, Id } from '../../_generated/dataModel'

export const listByOwner = query({
  args: {},
  handler: async (ctx): Promise<Doc<'venues'>[]> => {
    const identity = await getCurrentUser(ctx)

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) return []

    // Gather venue IDs from venueAccess records
    const accessRecords = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    const accessVenueIds = new Set(accessRecords.map((r) => r.venueId))

    // Also include venues where ownerId matches directly (belt-and-suspenders)
    const ownedVenues = await ctx.db
      .query('venues')
      .withIndex('by_ownerId', (q) => q.eq('ownerId', user._id))
      .collect()

    for (const v of ownedVenues) {
      accessVenueIds.add(v._id)
    }

    // Fetch all unique venues
    const venuePromises = Array.from(accessVenueIds).map((id) => ctx.db.get(id))
    const results = await Promise.all(venuePromises)

    return results.filter((v): v is Doc<'venues'> => v !== null)
  },
})

export const getById = query({
  args: {
    venueId: v.id('venues'),
  },
  handler: async (ctx, args): Promise<Doc<'venues'> | null> => {
    const identity = await getCurrentUser(ctx)

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) return null

    const venue = await ctx.db.get(args.venueId)
    if (!venue) return null

    // Check ownership or access
    if (venue.ownerId === user._id) return venue

    const access = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId_venueId', (q) =>
        q.eq('userId', user._id).eq('venueId', args.venueId)
      )
      .unique()

    if (!access) return null

    return venue
  },
})
