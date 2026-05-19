import { query } from '../../_generated/server'
import { ConvexError, v } from 'convex/values'
import { getCurrentUser } from '../../lib/auth'
import type { Id } from '../../_generated/dataModel'
import type { QueryCtx } from '../../_generated/server'

// ─── Return types ──────────────────────────────────────────────────────────────

export interface FinanceRow {
  _id:         Id<'reservations'>
  clientName:  string
  courtName:   string
  date:        string        // "YYYY-MM-DD"
  startTime:   string        // "HH:MM"
  endTime:     string        // "HH:MM"
  mercadoPago: number        // sum(payments where method='mercadopago' AND status='completed')
  senia:       number        // sum(payments where type='deposit' AND status='completed')
  efectivo:    number        // totalAmount - mercadoPago - senia (>= 0 clamped)
  total:       number        // reservation.totalAmount
}

export interface FinanceStats {
  totalMP:       number
  totalSeña:     number
  totalEfectivo: number
  totalGeneral:  number
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
    .filter((q) => q.neq(q.field('status'), 'maintenance'))
    .collect()

  // Batch court lookup
  const courtIds = [...new Set(reservations.map((r) => r.courtId))]
  const courts = await Promise.all(courtIds.map((id) => ctx.db.get(id)))
  const courtMap = new Map(courts.filter(Boolean).map((c) => [c!._id, c!.name]))

  // Batch payment lookup — one query per reservation, all in parallel
  const paymentSets = await Promise.all(
    reservations.map((r) =>
      ctx.db
        .query('payments')
        .withIndex('by_reservationId', (q) => q.eq('reservationId', r._id))
        .filter((q) => q.eq(q.field('status'), 'completed'))
        .collect()
    )
  )

  return reservations.map((r, i) => {
    const pmts     = paymentSets[i]
    const sumMP    = pmts.filter((p) => p.method === 'mercadopago').reduce((s, p) => s + p.amount, 0)
    const sumSenia = pmts.filter((p) => p.type === 'deposit').reduce((s, p) => s + p.amount, 0)
    const efectivo = Math.max(0, r.totalAmount - sumMP - sumSenia)

    return {
      _id:         r._id,
      clientName:  r.clientName,
      courtName:   courtMap.get(r.courtId) ?? '',
      date:        r.date,
      startTime:   r.startTime,
      endTime:     r.endTime,
      mercadoPago: sumMP,
      senia:       sumSenia,
      efectivo,
      total:       r.totalAmount,
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
      totalMP:       rows.reduce((s, r) => s + r.mercadoPago, 0),
      totalSeña:     rows.reduce((s, r) => s + r.senia,       0),
      totalEfectivo: rows.reduce((s, r) => s + r.efectivo,    0),
      totalGeneral:  rows.reduce((s, r) => s + r.total,       0),
    }
  },
})
