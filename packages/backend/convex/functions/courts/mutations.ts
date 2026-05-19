import { mutation } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import type { MutationCtx } from '../../_generated/server'
import type { Id } from '../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Validators reused from schema shapes (cannot import schema validators directly)
// ---------------------------------------------------------------------------

const dayScheduleValidator = v.object({
  dayOfWeek: v.number(),
  active:    v.boolean(),
  openTime:  v.string(),
  closeTime: v.string(),
})

// ---------------------------------------------------------------------------
// Internal access helper
// ---------------------------------------------------------------------------

async function assertVenueAccess(
  ctx: MutationCtx,
  venueId: Id<'venues'>,
  clerkId: string,
): Promise<void> {
  const venue = await ctx.db.get(venueId)
  if (!venue) throw new ConvexError('venue_not_found')

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .unique()

  if (!user) throw new ConvexError('unauthenticated')

  if (venue.ownerId !== user._id) {
    const access = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId_venueId', (q) =>
        q.eq('userId', user._id).eq('venueId', venueId)
      )
      .unique()
    if (!access) throw new ConvexError('forbidden')
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    venueId:          v.id('venues'),
    name:             v.string(),
    sport:            v.string(),
    surface:          v.optional(v.string()),
    covered:          v.optional(v.boolean()),
    priceOverride:    v.optional(v.number()),
    scheduleOverride: v.optional(v.array(dayScheduleValidator)),
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)
    await assertVenueAccess(ctx, args.venueId, identity.subject)

    return await ctx.db.insert('courts', {
      venueId:          args.venueId,
      name:             args.name,
      sport:            args.sport,
      surface:          args.surface,
      covered:          args.covered,
      status:           'active',
      priceOverride:    args.priceOverride,
      scheduleOverride: args.scheduleOverride,
    })
  },
})

export const update = mutation({
  args: {
    courtId:          v.id('courts'),
    name:             v.optional(v.string()),
    sport:            v.optional(v.string()),
    surface:          v.optional(v.string()),
    covered:          v.optional(v.boolean()),
    status:           v.optional(v.union(
      v.literal('active'),
      v.literal('maintenance'),
      v.literal('inactive'),
    )),
    priceOverride:    v.optional(v.number()),
    scheduleOverride: v.optional(v.array(dayScheduleValidator)),
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)

    const court = await ctx.db.get(args.courtId)
    if (!court) throw new ConvexError('court_not_found')

    await assertVenueAccess(ctx, court.venueId, identity.subject)

    const { courtId, ...fields } = args
    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        patch[key] = value
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(courtId, patch)
    }
  },
})
