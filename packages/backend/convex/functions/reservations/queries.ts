import { query } from '../../_generated/server'
import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { getCurrentUser } from '../../lib/auth'
import { addDays } from '../../lib/schedule'
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

export interface CalReservation {
  _id:          Id<'reservations'>
  courtId:      Id<'courts'>
  courtName:    string
  clientName:   string
  clientPhone:  string
  startTime:    number   // absolute minutes from midnight of `date` (INV-2)
  endTime:      number   // may be > 1440 for overnight reservations (INV-3)
  date:         string
  status:       Doc<'reservations'>['status']
  totalAmount:  number
  depositAmount?: number
  notes?:       string
  seriesId?:    Id<'recurrenceSeries'>
}

export interface CalListResult {
  reservations: CalReservation[]   // start on `date`
  spillovers:   CalReservation[]   // started on date-1, end projected to [0, endTime-1440]
}

export interface CalDateRangeResult {
  byDate:     Record<string, CalReservation[]>   // "YYYY-MM-DD" → reservations for that date
  spillovers: CalReservation[]                    // prev-day overflows into startDate
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
      .order('desc')
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
  handler: async (ctx, args): Promise<CalListResult> => {
    await getCurrentUser(ctx)

    const prevDate = addDays(args.date, -1)

    // Fetch current day and previous day in parallel
    const [ownDay, prevDay] = await Promise.all([
      ctx.db
        .query('reservations')
        .withIndex('by_venueId_date', (q) =>
          q.eq('venueId', args.venueId).eq('date', args.date)
        )
        .collect(),
      ctx.db
        .query('reservations')
        .withIndex('by_venueId_date', (q) =>
          q.eq('venueId', args.venueId).eq('date', prevDate)
        )
        .collect(),
    ])

    // Batch court lookup across both sets
    const allRows = [...ownDay, ...prevDay]
    const courtIds = [...new Set(allRows.map((r) => r.courtId))]
    const courts = await Promise.all(courtIds.map((id) => ctx.db.get(id)))
    const courtMap = new Map(
      courts.filter(Boolean).map((c) => [c!._id, c!.name])
    )

    const toCalReservation = (r: typeof ownDay[number]): CalReservation => ({
      _id:          r._id,
      courtId:      r.courtId,
      courtName:    courtMap.get(r.courtId) ?? '',
      clientName:   r.clientName,
      clientPhone:  r.clientPhone,
      startTime:    r.startTime,
      endTime:      r.endTime,
      date:         r.date,
      status:       r.status,
      totalAmount:  r.totalAmount,
      depositAmount: r.depositAmount,
      notes:        r.notes,
      seriesId:     r.seriesId,
    })

    const reservations = ownDay.map(toCalReservation)

    // Spillovers: prev-day reservations that cross midnight into today
    const spillovers = prevDay
      .filter((r) => r.endTime > 1440)
      .map((r) => ({
        ...toCalReservation(r),
        startTime: 0,               // begins at 00:00 in today's view
        endTime:   r.endTime - 1440, // projected to today's axis
      }))

    return { reservations, spillovers }
  },
})

export const countActiveByVenueAndDate = query({
  args: {
    venueId: v.id('venues'),
    date:    v.string(),   // "YYYY-MM-DD"
  },
  handler: async (ctx, args): Promise<number> => {
    await getCurrentUser(ctx)

    const rows = await ctx.db
      .query('reservations')
      .withIndex('by_venueId_date', (q) =>
        q.eq('venueId', args.venueId).eq('date', args.date)
      )
      .collect()

    return rows.filter(
      (r) => r.status !== 'maintenance' && r.status !== 'absent'
    ).length
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

export const listByVenueAndDateRange = query({
  args: {
    venueId:   v.id('venues'),
    startDate: v.string(),   // "YYYY-MM-DD" inclusive
    endDate:   v.string(),   // "YYYY-MM-DD" inclusive
  },
  handler: async (ctx, args): Promise<CalDateRangeResult> => {
    await getCurrentUser(ctx)

    const prevDate = addDays(args.startDate, -1)

    // Fetch date range and spillover day in parallel
    const [rangeRows, prevDayRows] = await Promise.all([
      ctx.db
        .query('reservations')
        .withIndex('by_venueId_date', (q) =>
          q.eq('venueId', args.venueId)
           .gte('date', args.startDate)
           .lte('date', args.endDate)
        )
        .collect(),
      ctx.db
        .query('reservations')
        .withIndex('by_venueId_date', (q) =>
          q.eq('venueId', args.venueId).eq('date', prevDate)
        )
        .collect(),
    ])

    // Batch court lookup across all rows
    const allRows = [...rangeRows, ...prevDayRows]
    const courtIds = [...new Set(allRows.map((r) => r.courtId))]
    const courts = await Promise.all(courtIds.map((id) => ctx.db.get(id)))
    const courtMap = new Map(
      courts.filter(Boolean).map((c) => [c!._id, c!.name])
    )

    const toCalReservation = (r: typeof rangeRows[number]): CalReservation => ({
      _id:           r._id,
      courtId:       r.courtId,
      courtName:     courtMap.get(r.courtId) ?? '',
      clientName:    r.clientName,
      clientPhone:   r.clientPhone,
      startTime:     r.startTime,
      endTime:       r.endTime,
      date:          r.date,
      status:        r.status,
      totalAmount:   r.totalAmount,
      depositAmount: r.depositAmount,
      notes:         r.notes,
      seriesId:      r.seriesId,
    })

    // Group range rows by date
    const byDate: Record<string, CalReservation[]> = {}
    for (const r of rangeRows) {
      const entry = toCalReservation(r)
      if (byDate[r.date] === undefined) byDate[r.date] = []
      byDate[r.date]!.push(entry)
    }

    // Spillovers: prev-day reservations that cross midnight into startDate
    const spillovers = prevDayRows
      .filter((r) => r.endTime > 1440)
      .map((r) => ({
        ...toCalReservation(r),
        startTime: 0,                // begins at 00:00 in startDate's view
        endTime:   r.endTime - 1440, // projected to startDate's axis
      }))

    return { byDate, spillovers }
  },
})
