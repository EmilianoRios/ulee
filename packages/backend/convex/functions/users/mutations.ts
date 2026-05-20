import { mutation } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import type { Id } from '../../_generated/dataModel'
import { getCurrentUser } from '../../lib/auth'
import { resolveInviteTarget } from '../../lib/users'

// ---------------------------------------------------------------------------
// completeOnboarding
// Idempotent — safe to call multiple times. Sets onboardingCompleted: true.
// ---------------------------------------------------------------------------

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await getCurrentUser(ctx)

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) throw new ConvexError('user_not_found')

    // Idempotent — only write if not already completed
    if (!user.onboardingCompleted) {
      await ctx.db.patch(user._id, { onboardingCompleted: true })
    }
  },
})

// ---------------------------------------------------------------------------
// inviteEmployee
// Orchestrates: find or create user by email, then grant venueAccess.
// The caller must be the owner of the venue.
// ---------------------------------------------------------------------------

export const inviteEmployee = mutation({
  args: {
    email:   v.string(),
    venueId: v.id('venues'),
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)

    // Verify the caller is the owner of the venue
    const caller = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!caller) throw new ConvexError('user_not_found')

    const venue = await ctx.db.get(args.venueId)
    if (!venue) throw new ConvexError('venue_not_found')
    if (venue.ownerId !== caller._id) throw new ConvexError('forbidden')

    // Find existing user by email
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique()

    const decision = resolveInviteTarget(existingUser)

    let targetUserId: Id<'users'>

    if (decision === 'grant_access' && existingUser) {
      targetUserId = existingUser._id
    } else {
      // Create a pending stub — sync.ts will claim it on first login
      targetUserId = await ctx.db.insert('users', {
        clerkId: `pending_${args.email}`,
        name:    args.email.split('@')[0],
        email:   args.email,
        role:    'employee',
        onboardingCompleted: false,
      })
    }

    // Check for duplicate venueAccess
    const duplicate = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId_venueId', (q) =>
        q.eq('userId', targetUserId).eq('venueId', args.venueId)
      )
      .unique()

    if (duplicate) throw new ConvexError('already_invited')

    // Insert venueAccess with appropriate status
    await ctx.db.insert('venueAccess', {
      userId:  targetUserId,
      venueId: args.venueId,
      role:    'employee',
      status:  decision === 'grant_access' ? 'active' : 'pending',
    })

    return {
      status:  decision === 'grant_access' ? 'access_granted' : 'pending_created',
      userId:  targetUserId,
    }
  },
})
