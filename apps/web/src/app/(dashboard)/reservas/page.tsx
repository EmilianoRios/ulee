'use client'

import { Plus } from 'lucide-react'
import { useTheme } from 'tamagui'
import { usePaginatedQuery, useQuery, useConvexAuth } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api, minutesToTime } from '@canchero/backend'
import { ReservationsTable, type Reservation } from '@/components/organisms/reservations-table'
import { ModuleLayout } from '@/components/templates/module-layout'
import { useActiveVenue } from '@/context/active-venue'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Today's date as "YYYY-MM-DD" (client-side UTC-3 approximation). */
function todayDate(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

const TODAY = todayDate()
const PAGE_SIZE = 8

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservasPage() {
  const t                = useTheme()
  const { activeVenueId } = useActiveVenue()
  const { isAuthenticated } = useConvexAuth()
  const router   = useRouter()
  const canQuery = isAuthenticated && activeVenueId !== null

  // Paginated reservation list — skip when no venue selected or unauthenticated
  const { results, status, loadMore } = usePaginatedQuery(
    api.functions.reservations.queries.listByVenueAndDate,
    canQuery ? { venueId: activeVenueId, date: TODAY } : 'skip',
    { initialNumItems: PAGE_SIZE }
  )

  // Stats strip — skip when no venue selected or unauthenticated
  const stats = useQuery(
    api.functions.reservations.queries.statsByVenueAndDate,
    canQuery ? { venueId: activeVenueId, date: TODAY } : 'skip'
  )

  // ── Adapt ReservationRow → Reservation (presentational shape) ──────────────
  const rows: Reservation[] = (results ?? []).map((r) => ({
    id:      r._id,
    cliente: r.clientName,
    cancha:  r.courtName,
    horario: `${minutesToTime(r.startTime)} – ${minutesToTime(r.endTime)}`,
    estado:  r.status,
    total:   r.totalAmount,
  }))

  // ── Pagination adaptation ──────────────────────────────────────────────────
  // usePaginatedQuery is cursor-based; ReservationsTable expects offset pagination.
  // Strategy: treat current results as page 1. When more data is available
  // (status === 'CanLoadMore'), expose page 2 so the "next" button fires loadMore.
  const canLoadMore  = status === 'CanLoadMore'
  const page         = 1
  const totalPages   = canLoadMore ? 2 : 1

  function handlePageChange(next: number) {
    if (next > 1 && canLoadMore) loadMore(PAGE_SIZE)
  }

  // ── Stats values (with loading fallback) ──────────────────────────────────
  const statsStrip: { value: string; label: string; delta?: string; positive?: boolean }[] = [
    {
      value:    stats !== undefined ? String(stats.count)     : '...',
      label:    'reservas hoy',
      delta:    undefined,
    },
    {
      value:    stats !== undefined
        ? `$${stats.totalRevenue.toLocaleString('es-AR')}`
        : '...',
      label:    'esta semana',
      delta:    undefined,
    },
    {
      value:    stats !== undefined ? String(stats.pendingCount) : '...',
      label:    'pagos pendientes',
    },
    {
      value:    stats !== undefined
        ? `${stats.activeCourts} de ${stats.totalCourts}`
        : '...',
      label:    'canchas activas',
    },
  ]

  // ─────────────────────────────────────────────────────────────────────────

  const strip = (
    <>
      {/* Dark header: module identity + primary action */}
      <div style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 32px',
        backgroundColor: t.cabeceraOscura.val,
      }}>
        <span style={{
          fontSize:      15,
          fontWeight:    600,
          color:         'oklch(97% 0.006 220)',
          letterSpacing: '-0.01em',
          lineHeight:    1,
          userSelect:    'none',
        }}>
          Reservas
        </span>

        <button
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             6,
            padding:         '6px 14px',
            borderRadius:    7,
            border:          'none',
            backgroundColor: t.verdeCancha.val,
            color:           'oklch(98% 0.004 155)',
            fontSize:        12,
            fontWeight:      500,
            cursor:          'pointer',
            lineHeight:      1,
            fontFamily:      'inherit',
          }}
          onClick={() => router.push('/calendario')}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
        >
          <Plus size={13} strokeWidth={2.5} />
          Nueva reserva
        </button>
      </div>

      {/* Info strip: stat row on light background */}
      <div className="strip-scroll" style={{
        height:       52,
        display:      'flex',
        alignItems:   'center',
        padding:      '0 32px',
        borderBottom: `1px solid ${t.divisor.val}`,
        overflowX:    'auto',
      }}>
        {statsStrip.map((stat, i) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {i > 0 && (
              <div style={{ width: 1, height: 32, backgroundColor: t.divisor.val, margin: '0 28px', flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, userSelect: 'none' }}>
              <span style={{
                fontSize:           20,
                fontWeight:         700,
                color:              t.textoPrimario.val,
                lineHeight:         1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing:      '-0.01em',
              }}>
                {stat.value}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1 }}>
                  {stat.label}
                </span>
                {stat.delta && (
                  <span style={{
                    fontSize:   11,
                    fontWeight: 500,
                    lineHeight: 1,
                    color:      stat.positive ? t.verdeCancha.val : 'oklch(55% 0.20 25)',
                  }}>
                    {stat.delta}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )

  return (
    <ModuleLayout strip={strip}>
      <div style={{
        height:        '100%',
        padding:       '12px 32px',
        boxSizing:     'border-box',
        display:       'flex',
        flexDirection: 'column',
      }}>
        {activeVenueId === null ? (
          <div style={{
            flex:          1,
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
          }}>
            <span style={{ fontSize: 14, color: t.textoMuted.val }}>
              Seleccioná una sede para ver las reservas
            </span>
          </div>
        ) : (
          <ReservationsTable
            rows={rows}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </ModuleLayout>
  )
}
