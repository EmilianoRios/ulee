import { mutation } from '../../_generated/server'
import { getCurrentUser } from '../../lib/auth'

export const sync = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getCurrentUser(ctx)

    const clerkId = identity.subject
    const name = identity.name ?? ''
    const email = identity.email ?? ''
    // Clerk injects publicMetadata into the JWT at the root level when the
    // Convex JWT template is configured to do so. Cast to access custom claim.
    const role = (identity as unknown as { role?: string }).role ?? 'owner'

    // Primary lookup: by clerkId
    const existing = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
      .unique()

    if (existing) {
      const needsPatch = existing.name !== name || existing.email !== email
      if (needsPatch) {
        await ctx.db.patch(existing._id, { name, email })
      }
      return { userId: existing._id, isNew: false }
    }

    // Secondary lookup: by email (links pending stubs created via inviteEmployee)
    const pendingByEmail = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique()

    if (pendingByEmail && pendingByEmail.clerkId.startsWith('pending_')) {
      // Claim the stub: replace placeholder clerkId with real one
      await ctx.db.patch(pendingByEmail._id, { clerkId, name })
      return { userId: pendingByEmail._id, isNew: false }
    }

    // New user: insert with role from Clerk JWT
    const userId = await ctx.db.insert('users', {
      clerkId,
      name,
      email,
      role: role as 'admin' | 'owner' | 'employee' | 'customer',
    })

    return { userId, isNew: true }
  },
})
