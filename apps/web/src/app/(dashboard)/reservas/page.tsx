'use client'

import { useState, useCallback } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { UnifiedReservationTable, type UnifiedRow } from '@/components/organisms/unified-reservation-table'
import { ModuleLayout } from '@/components/templates/module-layout'
import { ReservationSlideOver } from '@/components/organisms/reservation-slide-over'
import type { ReservationBackendStatus, ReservationUpdateFields, SeriesUpdateFields } from '@/components/organisms/reservation-slide-over'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { useActiveVenue } from '@/context/active-venue'
import { statusToCalendarState } from '@/lib/convex/status-map'
import type { Doc } from '@canchero/backend'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Today's date as "YYYY-MM-DD" (client-side UTC-3 approximation). */
function todayDate(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

const TODAY = todayDate()
const PAGE_SIZE = 8

// ─── Types ────────────────────────────────────────────────────────────────────

type FinanceRowShape = {
  _id:          Id<'reservations'>
  clientName:   string
  courtId:      Id<'courts'>
  courtName:    string
  clientPhone:  string
  date:         string
  startTime:    string
  endTime:      string
  online:       number
  cash:         number
  total:        number
  totalAmount:  number
  depositTotal: number
  paymentType:  'deposit' | 'balance' | 'full' | 'mixed' | 'none'
  status:       Doc<'reservations'>['status']
}

type StatusTab = 'todas' | 'pendientes' | 'señadas' | 'pagadas'

const TAB_FILTER: Record<StatusTab, Doc<'reservations'>['status'][]> = {
  todas:      [],
  pendientes: ['pending'],
  señadas:    ['deposit_paid'],
  pagadas:    ['paid', 'played'],
}

const TAB_LABELS: Record<StatusTab, string> = {
  todas:      'Todas',
  pendientes: 'Pendientes',
  señadas:    'Señadas',
  pagadas:    'Pagadas',
}

const STATUS_TABS: StatusTab[] = ['todas', 'pendientes', 'señadas', 'pagadas']

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

function toCalendarReservation(row: FinanceRowShape): CalendarReservation {
  return {
    id:            row._id,
    courtId:       row.courtId as string,
    clientName:    row.clientName,
    phone:         row.clientPhone || undefined,
    startTime:     timeToMins(row.startTime),
    endTime:       timeToMins(row.endTime),
    date:          row.date,
    state:         statusToCalendarState(row.status),
    amount:        row.totalAmount,
    depositAmount: row.depositTotal > 0 ? row.depositTotal : undefined,
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

  const [cancha,      setCancha]      = useState('todas')
  const [page,        setPage]        = useState(1)
  const [activeTab,   setActiveTab]   = useState<StatusTab>('todas')
  const [selectedRow, setSelectedRow] = useState<FinanceRowShape | null>(null)

  // ── Mutations (mirroring calendario/page.tsx) ─────────────────────────────
  const updateStatus      = useMutation(api.functions.reservations.mutations.updateStatus)
  const updateReservation = useMutation(api.functions.reservations.mutations.updateReservation)
  const deleteReservation = useMutation(api.functions.reservations.mutations.deleteReservation)
  const cancelSeries      = useMutation(api.functions.reservations.series.cancelSeries)
  const modifySeries      = useMutation(api.functions.reservations.series.modifySeries)

  // Finance rows for today
  const allRows = useQuery(
    api.functions.finances.queries.listByVenueAndPeriod,
    canQuery ? { venueId: activeVenueId, dateFrom: TODAY, dateTo: TODAY } : 'skip'
  )

  // Courts — needed by ReservationSlideOver
  const courtsRaw = useQuery(
    api.functions.courts.queries.listByVenue,
    canQuery ? { venueId: activeVenueId } : 'skip'
  )

  const isLoading = activeVenueId !== null && allRows === undefined

  // Stats strip
  const stats = useQuery(
    api.functions.reservations.queries.statsByVenueAndDate,
    canQuery ? { venueId: activeVenueId, date: TODAY } : 'skip'
  )

  // Client-side cancha filter
  const canchaFiltered = (allRows ?? []).filter(
    (r) => cancha === 'todas' || r.courtName === cancha
  )

  // Client-side tab filter applied after cancha filter
  const filtered = canchaFiltered.filter(
    (r) => activeTab === 'todas' || TAB_FILTER[activeTab].includes(r.status)
  )

  const canchaOptionsSet = new Set((allRows ?? []).map((r) => r.courtName).filter(Boolean))
  if (cancha !== 'todas') canchaOptionsSet.add(cancha)
  const canchaOptions = [...canchaOptionsSet].sort()

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toUnifiedRow)

  const courts: Court[] = courtsRaw?.map((c) => ({
    id:            c._id as string,
    name:          c.name,
    priceOverride: c.priceOverride ?? undefined,
  })) ?? []

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

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleRowClick = useCallback((id: string) => {
    const row = (allRows ?? []).find((r) => r._id === id) as FinanceRowShape | undefined
    if (row) setSelectedRow(row)
  }, [allRows])

  const handleCloseSlideOver = useCallback(() => setSelectedRow(null), [])

  const handleUpdateStatus = useCallback((
    reservationId: string,
    status: ReservationBackendStatus,
    cashAmount?: number,
    onlineAmount?: number,
    amountOverride?: number,
  ) => {
    void updateStatus({
      reservationId: reservationId as Id<'reservations'>,
      status,
      ...(cashAmount !== undefined || onlineAmount !== undefined
        ? { cashAmount, onlineAmount }
        : {}),
      ...(amountOverride !== undefined ? { totalAmountOverride: amountOverride } : {}),
    })
  }, [updateStatus])

  const handleUpdate = useCallback((reservationId: string, fields: ReservationUpdateFields) => {
    void updateReservation({
      reservationId: reservationId as Id<'reservations'>,
      ...(fields.startTime   !== undefined ? { startTime:   fields.startTime   } : {}),
      ...(fields.endTime     !== undefined ? { endTime:     fields.endTime     } : {}),
      ...(fields.clientName  !== undefined ? { clientName:  fields.clientName  } : {}),
      ...(fields.clientPhone !== undefined ? { clientPhone: fields.clientPhone } : {}),
      ...(fields.totalAmount !== undefined ? { totalAmount: fields.totalAmount } : {}),
      ...(fields.notes       !== undefined ? { notes:       fields.notes       } : {}),
    }).catch((err) => console.error('updateReservation failed:', err))
  }, [updateReservation])

  const handleDelete = useCallback((reservationId: string) => {
    void deleteReservation({
      reservationId: reservationId as Id<'reservations'>,
    }).catch((err) => console.error('deleteReservation failed:', err))
  }, [deleteReservation])

  const handleCancelSeries = useCallback(async (seriesId: string) => {
    await cancelSeries({ seriesId: seriesId as Id<'recurrenceSeries'> })
  }, [cancelSeries])

  const handleModifySeries = useCallback(async (seriesId: string, fields: SeriesUpdateFields) => {
    await modifySeries({ seriesId: seriesId as Id<'recurrenceSeries'>, ...fields })
  }, [modifySeries])

  const handleTabChange = useCallback((tab: StatusTab) => {
    setActiveTab(tab)
    setPage(1)
  }, [])

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
    <>
      <ModuleLayout strip={strip}>
        <div style={{
          height:        '100%',
          padding:       '12px 32px',
          boxSizing:     'border-box',
          display:       'flex',
          flexDirection: 'column',
          gap:           12,
        }}>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  style={{
                    padding:         '6px 16px',
                    borderRadius:    7,
                    border:          isActive
                      ? `1px solid ${t.verdeCancha.val}`
                      : `1px solid ${t.bordeNeutral.val}`,
                    backgroundColor: isActive ? t.verdeCanchaFondo.val : 'transparent',
                    color:           isActive ? t.verdeCanchaProfundo.val : t.textoMuted.val,
                    fontSize:        12,
                    fontWeight:      isActive ? 600 : 400,
                    cursor:          'pointer',
                    lineHeight:      1,
                    fontFamily:      'inherit',
                    transition:      'all 100ms ease-out',
                  }}
                >
                  {TAB_LABELS[tab]}
                </button>
              )
            })}
          </div>

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
              onRowClick={handleRowClick}
            />
          )}
        </div>
      </ModuleLayout>

      <ReservationSlideOver
        reservation={selectedRow ? toCalendarReservation(selectedRow) : null}
        courts={courts}
        onClose={handleCloseSlideOver}
        onUpdateStatus={handleUpdateStatus}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onCancelSeries={handleCancelSeries}
        onModifySeries={handleModifySeries}
      />
    </>
  )
}
