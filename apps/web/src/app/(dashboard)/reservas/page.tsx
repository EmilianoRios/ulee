'use client'

import { useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useConvexAuth } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@canchero/backend'
import { UnifiedReservationTable, type UnifiedRow } from '@/components/organisms/unified-reservation-table'
import { ModuleLayout } from '@/components/templates/module-layout'
import { useActiveVenue } from '@/context/active-venue'
import type { Id } from '@canchero/backend'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Today's date as "YYYY-MM-DD" (client-side UTC-3 approximation). */
function todayDate(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

const TODAY = todayDate()
const PAGE_SIZE = 8

// ─── Types ────────────────────────────────────────────────────────────────────

type FinanceRowShape = {
  _id:          Id<'reservations'>
  clientName:   string
  courtName:    string
  date:         string
  startTime:    string
  endTime:      string
  online:       number
  cash:         number
  total:        number
  depositTotal: number
  paymentType:  'deposit' | 'balance' | 'full' | 'mixed' | 'none'
  status:       'paid' | 'deposit_paid' | 'pending' | 'maintenance' | 'cancelled'
}

function toUnifiedRow(row: FinanceRowShape): UnifiedRow {
  const dayLabel = new Date(row.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short' })
  return {
    id:          row._id,
    cliente:     row.clientName,
    cancha:      row.courtName,
    diayhorario: `${dayLabel} ${row.startTime} – ${row.endTime}`,
    estado:      row.status,
    online:      row.online,
    cash:        row.cash,
    paymentType: row.paymentType,
    total:       row.total,
  }
}

// ─── Dark header tokens ───────────────────────────────────────────────────────

const D = {
  text:      'oklch(97% 0.006 220)',
  textMuted: 'oklch(50% 0.012 228)',
  border:    'oklch(35% 0.018 228)',
  hover:     'oklch(30% 0.020 228)',
  toggleBg:  'oklch(16% 0.020 228)',
  toggleOn:  'oklch(32% 0.022 228)',
  toggleOff: 'oklch(40% 0.012 228)',
} as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReservasPage() {
  const t                = useTheme()
  const { activeVenueId } = useActiveVenue()
  const { isAuthenticated } = useConvexAuth()
  const router   = useRouter()
  const canQuery = isAuthenticated && activeVenueId !== null

  const [cancha, setCancha] = useState('todas')
  const [page,   setPage]   = useState(1)

  // Finance rows for today — replaces usePaginatedQuery on listByVenueAndDate
  const allRows = useQuery(
    api.functions.finances.queries.listByVenueAndPeriod,
    canQuery ? { venueId: activeVenueId, dateFrom: TODAY, dateTo: TODAY } : 'skip'
  )

  const isLoading = activeVenueId !== null && allRows === undefined

  // Stats strip — unchanged
  const stats = useQuery(
    api.functions.reservations.queries.statsByVenueAndDate,
    canQuery ? { venueId: activeVenueId, date: TODAY } : 'skip'
  )

  // Client-side cancha filter
  const filtered = (allRows ?? []).filter(
    (r) => cancha === 'todas' || r.courtName === cancha
  )

  const canchaOptionsSet = new Set((allRows ?? []).map((r) => r.courtName).filter(Boolean))
  if (cancha !== 'todas') canchaOptionsSet.add(cancha)
  const canchaOptions = [...canchaOptionsSet].sort()

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toUnifiedRow)

  // ── Stats values (with loading fallback) ──────────────────────────────────
  const statsStrip: { value: string; label: string; delta?: string; positive?: boolean }[] = [
    {
      value: stats !== undefined ? String(stats.count) : '...',
      label: 'reservas hoy',
    },
    {
      value: stats !== undefined
        ? `$${stats.totalRevenue.toLocaleString('es-AR')}`
        : '...',
      label: 'esta semana',
    },
    {
      value: stats !== undefined ? String(stats.pendingCount) : '...',
      label: 'pagos pendientes',
    },
    {
      value: stats !== undefined
        ? `${stats.activeCourts} de ${stats.totalCourts}`
        : '...',
      label: 'canchas activas',
    },
  ]

  // ─────────────────────────────────────────────────────────────────────────

  const strip = (
    <>
      {/* Dark header: module identity + cancha filter + primary action */}
      <div style={{
        height:          56,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0 32px',
        backgroundColor: t.cabeceraOscura.val,
      }}>
        {/* Left: title + cancha filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize:      15,
            fontWeight:    600,
            color:         D.text,
            letterSpacing: '-0.01em',
            lineHeight:    1,
            userSelect:    'none',
          }}>
            Reservas
          </span>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={cancha}
              onChange={(e) => { setCancha(e.target.value); setPage(1) }}
              style={{
                appearance:       'none',
                WebkitAppearance: 'none',
                backgroundColor:  'transparent',
                border:           `1px solid ${D.border}`,
                borderRadius:     6,
                color:            D.text,
                fontSize:         12,
                fontWeight:       500,
                padding:          '5px 28px 5px 10px',
                cursor:           'pointer',
                outline:          'none',
                fontFamily:       'inherit',
                lineHeight:       1,
              }}
            >
              <option style={{ background: 'oklch(22% 0.024 228)' }} value="todas">Todas las canchas</option>
              {canchaOptions.map((c) => (
                <option key={c} style={{ background: 'oklch(22% 0.024 228)' }} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              strokeWidth={2.5}
              style={{
                position:      'absolute',
                right:         8,
                top:           '50%',
                transform:     'translateY(-50%)',
                color:         D.textMuted,
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Right: Nueva reserva button */}
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
            flex:           1,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, color: t.textoMuted.val }}>
              Seleccioná una sede para ver las reservas
            </span>
          </div>
        ) : isLoading ? (
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            height:         '100%',
            color:          t.textoMuted.val,
            fontSize:       14,
          }}>
            Cargando...
          </div>
        ) : (
          <UnifiedReservationTable
            rows={pageRows}
            page={page}
            totalPages={totalPages}
            totalRows={filtered.length}
            onPageChange={setPage}
          />
        )}
      </div>
    </ModuleLayout>
  )
}
