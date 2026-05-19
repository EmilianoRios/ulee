import { QueryCtx, MutationCtx } from '../_generated/server'
import { ConvexError } from 'convex/values'

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError('unauthenticated')
  return identity
}
