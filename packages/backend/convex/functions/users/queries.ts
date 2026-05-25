import { query } from '../../_generated/server'
import type { Id } from '../../_generated/dataModel'

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

    const accessRecords = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    const hasOwnerAccess    = accessRecords.some((a) => a.role === 'owner')
    const hasEmployeeAccess = accessRecords.some((a) => a.role === 'employee' && a.status === 'active')

    return {
      role:               user.role,
      onboardingCompleted: user.onboardingCompleted ?? false,
      hasOwnerAccess,
      hasEmployeeAccess,
    }
  },
})

export interface VenueEmployee {
  venueAccessId: Id<'venueAccess'>
  venueId:       Id<'venues'>
  venueName:     string
  inviteeEmail:  string
  inviteeName:   string
  status:        'pending' | 'active'
  createdAt:     number
}

export const getVenueEmployeesByOwner = query({
  args: {},
  handler: async (ctx): Promise<VenueEmployee[]> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const caller = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!caller) return []

    // All venues owned by caller
    const venues = await ctx.db
      .query('venues')
      .withIndex('by_ownerId', (q) => q.eq('ownerId', caller._id))
      .collect()

    if (venues.length === 0) return []

    // Fetch venueAccess for each venue in parallel
    const accessPerVenue = await Promise.all(
      venues.map((venue) =>
        ctx.db
          .query('venueAccess')
          .withIndex('by_venueId', (q) => q.eq('venueId', venue._id))
          .collect()
          .then((rows) => ({ venue, rows }))
      )
    )

    // All employee rows (active + pending), excluding owner records
    const employeeRows = accessPerVenue.flatMap(({ venue, rows }) =>
      rows
        .filter((r) => r.role === 'employee')
        .map((r) => ({ ...r, venueName: venue.name }))
    )

    if (employeeRows.length === 0) return []

    const users = await Promise.all(
      employeeRows.map((r) => ctx.db.get(r.userId))
    )

    return employeeRows.map((r, i) => ({
      venueAccessId: r._id,
      venueId:       r.venueId,
      venueName:     r.venueName,
      inviteeEmail:  users[i]?.email ?? '',
      inviteeName:   users[i]?.name ?? '',
      status:        (r.status ?? 'active') as 'pending' | 'active',
      createdAt:     r._creationTime,
    }))
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
