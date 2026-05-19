import { mutation, MutationCtx } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import { hasConflict } from '../../lib/conflicts'
import type { Id } from '../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Private helper
// ---------------------------------------------------------------------------

async function assertVenueAccess(
  ctx: MutationCtx,
  venueId: Id<'venues'>
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

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    venueId:     v.id('venues'),
    courtId:     v.id('courts'),
    date:        v.string(),   // "YYYY-MM-DD"
    startTime:   v.string(),   // "HH:MM"
    endTime:     v.string(),   // "HH:MM"
    clientName:  v.string(),
    clientPhone: v.string(),
    totalAmount: v.number(),
    status:      v.optional(v.union(
      v.literal('deposit_paid'),
      v.literal('on_court'),
      v.literal('absent'),
      v.literal('paid'),
      v.literal('maintenance'),
      v.literal('recurring'),
      v.literal('played'),
      v.literal('event'),
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await assertVenueAccess(ctx, args.venueId)

    // Verify court belongs to the declared venue
    const court = await ctx.db.get(args.courtId)
    if (!court || court.venueId !== args.venueId) {
      throw new ConvexError('court_not_in_venue')
    }

    // Conflict detection — fetch existing reservations for this court + date
    const existing = await ctx.db
      .query('reservations')
      .withIndex('by_courtId', (q) => q.eq('courtId', args.courtId))
      .collect()

    const sameDay = existing.filter((r) => r.date === args.date)

    if (hasConflict(sameDay, args.startTime, args.endTime)) {
      throw new ConvexError('time_conflict')
    }

    return await ctx.db.insert('reservations', {
      venueId:         args.venueId,
      courtId:         args.courtId,
      date:            args.date,
      startTime:       args.startTime,
      endTime:         args.endTime,
      clientName:      args.clientName,
      clientPhone:     args.clientPhone,
      totalAmount:     args.totalAmount,
      status:          args.status ?? 'deposit_paid',
      notes:           args.notes,
      createdByUserId: user._id,
    })
  },
})

export const updateStatus = mutation({
  args: {
    reservationId: v.id('reservations'),
    status: v.union(
      v.literal('deposit_paid'),
      v.literal('on_court'),
      v.literal('absent'),
      v.literal('paid'),
      v.literal('maintenance'),
      v.literal('recurring'),
      v.literal('played'),
      v.literal('event'),
    ),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.reservationId)
    if (!reservation) throw new ConvexError('not_found')

    await assertVenueAccess(ctx, reservation.venueId)

    await ctx.db.patch(args.reservationId, { status: args.status })
  },
})
