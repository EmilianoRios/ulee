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
      // Only overwrite name/email if the JWT actually has a non-empty value.
      // Empty JWT claims (missing template config) must never wipe data
      // that was set by claimInvite or other flows.
      const patch: { name?: string; email?: string } = {}
      if (name && existing.name !== name) patch.name = name
      if (email && existing.email !== email) patch.email = email
      if (Object.keys(patch).length > 0) await ctx.db.patch(existing._id, patch)
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

      // Activate all pending venueAccess records for this user
      const pendingAccess = await ctx.db
        .query('venueAccess')
        .withIndex('by_userId', (q) => q.eq('userId', pendingByEmail._id))
        .collect()
      await Promise.all(
        pendingAccess
          .filter((a) => a.status === 'pending')
          .map((a) => ctx.db.patch(a._id, { status: 'active' }))
      )

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
