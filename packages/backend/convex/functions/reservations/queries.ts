import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { getCurrentUser } from '../../lib/auth'
import type { Doc, Id } from '../../_generated/dataModel'

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface ReservationRow {
  _id:         Id<'reservations'>
  clientName:  string
  courtName:   string   // denormalized — resolved via court lookup
  startTime:   string
  endTime:     string
  date:        string
  status:      Doc<'reservations'>['status']
  totalAmount: number
}

export interface ReservationCalRow {
  _id:         Id<'reservations'>
  courtId:     Id<'courts'>
  courtName:   string   // denormalized — resolved via court lookup
  clientName:  string
  clientPhone: string
  startTime:   string
  endTime:     string
  date:        string
  status:      Doc<'reservations'>['status']
  totalAmount: number
  notes?:      string
}

export interface ReservationStats {
  count:        number
  totalRevenue: number
  pendingCount: number
  activeCourts: number
  totalCourts:  number
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listByVenueAndDate = query({
  args: {
    venueId:        v.id('venues'),
    date:           v.string(),   // "YYYY-MM-DD"
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx)

    const paginationResult = await ctx.db
      .query('reservations')
      .withIndex('by_venueId_date', (q) =>
        q.eq('venueId', args.venueId).eq('date', args.date)
      )
      .paginate(args.paginationOpts)

    // Denormalize courtName — batch lookup courts
    const courtIds = [...new Set(paginationResult.page.map((r) => r.courtId))]
    const courts = await Promise.all(courtIds.map((id) => ctx.db.get(id)))
    const courtMap = new Map(
      courts.filter(Boolean).map((c) => [c!._id, c!.name])
    )

    const page: ReservationRow[] = paginationResult.page.map((r) => ({
      _id:         r._id,
      clientName:  r.clientName,
      courtName:   courtMap.get(r.courtId) ?? '',
      startTime:   r.startTime,
      endTime:     r.endTime,
      date:        r.date,
      status:      r.status,
      totalAmount: r.totalAmount,
    }))

    return { ...paginationResult, page }
  },
})

export const listAllByVenueAndDate = query({
  args: {
    venueId: v.id('venues'),
    date:    v.string(),   // "YYYY-MM-DD"
  },
  handler: async (ctx, args): Promise<ReservationCalRow[]> => {
    await getCurrentUser(ctx)

    const reservations = await ctx.db
      .query('reservations')
      .withIndex('by_venueId_date', (q) =>
        q.eq('venueId', args.venueId).eq('date', args.date)
      )
      .collect()

    // Denormalize courtName — batch lookup courts
    const courtIds = [...new Set(reservations.map((r) => r.courtId))]
    const courts = await Promise.all(courtIds.map((id) => ctx.db.get(id)))
    const courtMap = new Map(
      courts.filter(Boolean).map((c) => [c!._id, c!.name])
    )

    return reservations.map((r) => ({
      _id:         r._id,
      courtId:     r.courtId,
      courtName:   courtMap.get(r.courtId) ?? '',
      clientName:  r.clientName,
      clientPhone: r.clientPhone,
      startTime:   r.startTime,
      endTime:     r.endTime,
      date:        r.date,
      status:      r.status,
      totalAmount: r.totalAmount,
      notes:       r.notes,
    }))
  },
})

export const statsByVenueAndDate = query({
  args: {
    venueId: v.id('venues'),
    date:    v.string(),
  },
  handler: async (ctx, args): Promise<ReservationStats> => {
    await getCurrentUser(ctx)

    const reservations = await ctx.db
      .query('reservations')
      .withIndex('by_venueId_date', (q) =>
        q.eq('venueId', args.venueId).eq('date', args.date)
      )
      .collect()

    const totalRevenue = reservations.reduce((s, r) => s + r.totalAmount, 0)
    const pendingCount = reservations.filter(
      (r) => r.status === 'deposit_paid' || r.status === 'on_court'
    ).length

    const courts = await ctx.db
      .query('courts')
      .withIndex('by_venueId', (q) => q.eq('venueId', args.venueId))
      .collect()

    const activeCourts = courts.filter((c) => c.status === 'active').length
    const totalCourts  = courts.length

    return {
      count:        reservations.length,
      totalRevenue,
      pendingCount,
      activeCourts,
      totalCourts,
    }
  },
})
