import { mutation } from '../../_generated/server'
import { v, ConvexError } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import { addDays, normalizeDaySchedule } from '../../lib/schedule'
import type { ScheduleVersion } from '../../lib/schedule'
import type { MutationCtx } from '../../_generated/server'
import type { Id } from '../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Internal access helper
// ---------------------------------------------------------------------------

async function assertVenueAccess(
  ctx: MutationCtx,
  venueId: Id<'venues'>,
  clerkId: string,
): Promise<void> {
  const venue = await ctx.db.get(venueId)
  if (!venue) throw new ConvexError('venue_not_found')

  const user = await ctx.db
    .query('users')
    .withIndex('by_clerkId', (q) => q.eq('clerkId', clerkId))
    .unique()

  if (!user) throw new ConvexError('unauthenticated')

  if (venue.ownerId !== user._id) {
    const access = await ctx.db
      .query('venueAccess')
      .withIndex('by_userId_venueId', (q) =>
        q.eq('userId', user._id).eq('venueId', venueId)
      )
      .unique()
    if (!access) throw new ConvexError('forbidden')
  }
}

// ---------------------------------------------------------------------------
// Validators reused from schema shapes
// ---------------------------------------------------------------------------

const dayScheduleValidator = v.object({
  dayOfWeek: v.number(),
  active: v.boolean(),
  openTime: v.number(),
  closeTime: v.number(),
})

const pricingConfigValidator = v.object({
  pricePerHour: v.number(),
  currency: v.literal('ARS'),
  depositPercentage: v.optional(v.number()),
  nightRatePrice: v.optional(v.number()),
  nightRateStart: v.optional(v.number()),
  chargePolicy: v.optional(v.union(
    v.literal('on_arrival'),
    v.literal('on_booking_deposit'),
    v.literal('on_booking_full'),
  )),
  bookingWindowDays: v.optional(v.number()),
  balanceDeadlineDays: v.optional(v.number()),
  allowedDurations: v.optional(v.array(v.number())),
})

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const create = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    phone: v.string(),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    schedule: v.array(dayScheduleValidator),
    pricingConfig: pricingConfigValidator,
    initialSchedule: v.optional(v.array(dayScheduleValidator)),
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()

    if (!user) throw new ConvexError('unauthenticated')

    const normalizedSchedule = (args.initialSchedule ?? args.schedule).map(normalizeDaySchedule)
    const today = new Date().toISOString().slice(0, 10)

    const venueId = await ctx.db.insert('venues', {
      ownerId: user._id,
      name: args.name,
      address: args.address,
      phone: args.phone,
      description: args.description,
      email: args.email,
      schedule: normalizedSchedule,
      pricingConfig: args.pricingConfig,
      ...(args.initialSchedule !== undefined && {
        scheduleHistory: [{ validFrom: today, schedule: normalizedSchedule }],
      }),
    })

    await ctx.db.insert('venueAccess', {
      userId: user._id,
      venueId,
      role: 'owner',
    })

    return venueId
  },
})

export const update = mutation({
  args: {
    venueId: v.id('venues'),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)
    await assertVenueAccess(ctx, args.venueId, identity.subject)

    const { venueId, ...fields } = args

    // Only patch fields that were actually provided
    const patch: Partial<typeof fields> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        (patch as Record<string, unknown>)[key] = value
      }
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(venueId, patch)
    }
  },
})

export const updateSchedule = mutation({
  args: {
    venueId:  v.id('venues'),
    schedule: v.array(dayScheduleValidator),
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)
    await assertVenueAccess(ctx, args.venueId, identity.subject)

    const venue = await ctx.db.get(args.venueId)
    if (!venue) throw new ConvexError('venue_not_found')

    const today    = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
    const tomorrow = addDays(today, 1)

    const existing: ScheduleVersion[] = venue.scheduleHistory ?? []

    const normalizedSchedule = args.schedule.map(normalizeDaySchedule)

    // Upsert: if the last entry already starts tomorrow, update it in place.
    // This handles same-day re-saves without creating zero-width orphan entries.
    const last = existing.at(-1)
    const isUpsert = last?.validFrom === tomorrow

    const updated: ScheduleVersion[] = isUpsert
      ? [...existing.slice(0, -1), { ...last!, schedule: normalizedSchedule }]
      : existing.map((entry) =>
          entry.validTo === undefined ? { ...entry, validTo: tomorrow } : entry
        )

    if (!isUpsert) {
      updated.push({ validFrom: tomorrow, schedule: normalizedSchedule })
    }

    await ctx.db.patch(args.venueId, {
      schedule:        normalizedSchedule,
      scheduleHistory: updated,
    })
  },
})

export const updatePricing = mutation({
  args: {
    venueId: v.id('venues'),
    pricingConfig: pricingConfigValidator,
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)
    await assertVenueAccess(ctx, args.venueId, identity.subject)
    await ctx.db.patch(args.venueId, { pricingConfig: args.pricingConfig })
  },
})

export const revokeVenueAccess = mutation({
  args: { venueAccessId: v.id('venueAccess') },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)

    const access = await ctx.db.get(args.venueAccessId)
    if (!access) throw new ConvexError('not_found')
    if (access.role === 'owner') throw new ConvexError('cannot_revoke_owner')

    // Only the venue owner can revoke access
    const venue = await ctx.db.get(access.venueId)
    if (!venue) throw new ConvexError('venue_not_found')

    const caller = await ctx.db
      .query('users')
      .withIndex('by_clerkId', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!caller || venue.ownerId !== caller._id) throw new ConvexError('forbidden')

    await ctx.db.delete(args.venueAccessId)
  },
})

export const updateHolidays = mutation({
  args: {
    venueId: v.id('venues'),
    holidays: v.array(
      v.object({
        date: v.string(),
        reason: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await getCurrentUser(ctx)
    await assertVenueAccess(ctx, args.venueId, identity.subject)
    await ctx.db.patch(args.venueId, { holidays: args.holidays })
  },
})
