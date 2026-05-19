import { mutation } from '../../_generated/server'
import { ConvexError } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'

export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getCurrentUser(ctx)

    const clerkId = identity.subject
    const name = identity.name ?? ''
    const email = identity.email ?? ''

    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()

    if (existing) {
      const needsPatch = existing.name !== name || existing.email !== email
      if (needsPatch) {
        await ctx.db.patch(existing._id, { name, email })
      }
      return existing._id
    }

    const userId = await ctx.db.insert('users', {
      clerkId,
      name,
      email,
      role: 'owner',
    })

    return userId
  },
})
