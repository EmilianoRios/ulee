import type { MutationCtx } from '../_generated/server'
import { ConvexError } from 'convex/values'
import { getCurrentUser } from './auth'
import type { Id } from '../_generated/dataModel'

/**
 * Asserts that the authenticated caller has access to the given venue
 * — either as the venue owner or via the venueAccess table.
 *
 * Returns the caller's user document on success.
 * Throws ConvexError('user_not_found') or ConvexError('unauthorized') on failure.
 *
 * Extracted from functions/reservations/mutations.ts so that series.ts
 * can reuse the same logic without duplicating it.
 */
export async function assertVenueAccess(
  ctx:     MutationCtx,
  venueId: Id<'venues'>,
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
