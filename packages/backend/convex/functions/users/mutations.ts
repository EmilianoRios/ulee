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
// claimInvite
// Called client-side with the user's email (from Clerk useUser hook).
// Finds the pending stub by email, transfers venueAccess to the current user,
// and deletes the stub. Bypasses JWT email claim entirely.
// ---------------------------------------------------------------------------

export const claimInvite = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)

    // Get current user (might have empty email if JWT lacked the claim)
    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!currentUser) throw new ConvexError('user_not_found')

    // Already has venueAccess — nothing to claim
    const existingAccess = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId', (q) => q.eq('userId', currentUser._id))
      .collect()
    if (existingAccess.length > 0) return { claimed: false, reason: 'already_has_access' as const }

    // Find the pending stub for this email
    const stub = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email.toLowerCase()))
      .unique()

    if (!stub || !stub.clerkId.startsWith('pending_')) {
      return { claimed: false, reason: 'no_invite_found' as const }
    }

    // Transfer all venueAccess records from stub → current user
    const stubAccess = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId', (q) => q.eq('userId', stub._id))
      .collect()

    await Promise.all(
      stubAccess.map((a) => ctx.db.patch(a._id, { userId: currentUser._id, status: 'active' }))
    )

    // Patch email if missing (JWT lacked claim) — never change global role
    if (!currentUser.email) {
      await ctx.db.patch(currentUser._id, { email: args.email.toLowerCase() })
    }

    // Delete the stub — it's been fully absorbed
    await ctx.db.delete(stub._id)

    return { claimed: true, reason: 'success' as const }
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

    const normalizedEmail = args.email.toLowerCase()

    // Find existing user by email
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', normalizedEmail))
      .unique()

    const decision = resolveInviteTarget(existingUser)

    let targetUserId: Id<'users'>

    if (decision === 'grant_access' && existingUser) {
      targetUserId = existingUser._id
    } else {
      // Create a pending stub — sync.ts will claim it on first login
      targetUserId = await ctx.db.insert('users', {
        clerkId: `pending_${normalizedEmail}`,
        name:    normalizedEmail.split('@')[0],
        email:   normalizedEmail,
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
