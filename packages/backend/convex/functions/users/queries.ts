import { query } from '../../_generated/server'

export const getCurrentUserStatus = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) return null

    return {
      role: user.role,
      onboardingCompleted: user.onboardingCompleted ?? false,
    }
  },
})

export const getMyVenueAccess = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) return []

    return ctx.db
      .query('venueAccess')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
  },
})
