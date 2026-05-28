import { query } from '../../_generated/server'
import { ConvexError, v } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import { minutesToTime } from '../../lib/time'
import { aggregatePayments } from '../../lib/payments'
import type { PaymentSummary } from '../../lib/payments'
import type { Doc, Id } from '../../_generated/dataModel'
import type { QueryCtx } from '../../_generated/server'

// ─── Return types ──────────────────────────────────────────────────────────────

export interface FinanceRow {
  _id:          Id<'reservations'>
  clientName:   string
  courtName:    string
  date:         string        // "YYYY-MM-DD"
  startTime:    string        // "HH:MM"
  endTime:      string        // "HH:MM"
  online:       number        // sum of completed payments where normalizeMethod === 'online'
  cash:         number        // sum of completed payments where normalizeMethod === 'cash'
  total:        number        // online + cash (NOT reservation.totalAmount)
  depositTotal: number        // sum of completed payments where type === 'deposit'
  paymentType:  PaymentSummary['paymentType']
  status:       Doc<'reservations'>['status']
}

export interface FinanceStats {
  totalOnline:   number    // sum of row.online
  totalCash:     number    // sum of row.cash
  totalDeposits: number    // sum of row.total where paymentType === 'deposit'
  totalGeneral:  number    // sum of row.total
}

// ─── Shared args ───────────────────────────────────────────────────────────────

const financeArgs = {
  venueId:  v.id('venues'),
  dateFrom: v.string(),
  dateTo:   v.string(),
}

// ─── Private helper ────────────────────────────────────────────────────────────

async function fetchRows(
  ctx: QueryCtx,
  venueId: Id<'venues'>,
  dateFrom: string,
  dateTo: string,
): Promise<FinanceRow[]> {
  if (dateFrom > dateTo) {
    throw new ConvexError('INVALID_DATE_RANGE')
  }

  const reservations = await ctx.db
    .query('reservations')
    .withIndex('by_venueId_date', (q) =>
      q.eq('venueId', venueId).gte('date', dateFrom).lte('date', dateTo)
    )
    .order('desc')
    .filter((q) => q.neq(q.field('status'), 'maintenance'))
    .collect()

  // Batch court lookup
  const courtIds = [...new Set(reservations.map((r) => r.courtId))]
  const courts = await Promise.all(courtIds.map((id) => ctx.db.get(id)))
  const courtMap = new Map(courts.filter(Boolean).map((c) => [c!._id, c!.name]))

  // Batch payment lookup — all payments per reservation (not pre-filtered by status)
  // aggregatePayments handles status filtering internally
  const paymentSets = await Promise.all(
    reservations.map((r) =>
      ctx.db
        .query('payments')
        .withIndex('by_reservationId', (q) => q.eq('reservationId', r._id))
        .collect()
    )
  )

  return reservations.map((r, i) => {
    const summary = aggregatePayments(paymentSets[i])
    return {
      _id:         r._id,
      clientName:  r.clientName,
      courtName:   courtMap.get(r.courtId) ?? '',
      date:        r.date,
      startTime:   minutesToTime(r.startTime),
      endTime:     minutesToTime(r.endTime),
      online:       summary.online,
      cash:         summary.cash,
      total:        summary.total,
      depositTotal: summary.depositTotal,
      paymentType:  summary.paymentType,
      status:       r.status,
    }
  })
}

// ─── Queries ───────────────────────────────────────────────────────────────────

export const listByVenueAndPeriod = query({
  args: financeArgs,
  handler: async (ctx, args): Promise<FinanceRow[]> => {
    await getCurrentUser(ctx)
    return fetchRows(ctx, args.venueId, args.dateFrom, args.dateTo)
  },
})

// Expuesto para consumidores no-UI (reportes, integraciones).
// El dashboard deriva los KPIs client-side desde listByVenueAndPeriod para evitar
// una segunda suscripción que duplicaría las lecturas de DB.
export const statsByVenueAndPeriod = query({
  args: financeArgs,
  handler: async (ctx, args): Promise<FinanceStats> => {
    await getCurrentUser(ctx)
    const rows = await fetchRows(ctx, args.venueId, args.dateFrom, args.dateTo)
    return {
      totalOnline:   rows.reduce((s, r) => s + r.online, 0),
      totalCash:     rows.reduce((s, r) => s + r.cash,   0),
      totalDeposits: rows.filter((r) => r.paymentType === 'deposit').reduce((s, r) => s + r.total, 0),
      totalGeneral:  rows.reduce((s, r) => s + r.total,  0),
    }
  },
})
