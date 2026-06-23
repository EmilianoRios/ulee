'use client'

import { useState, useCallback } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { minutesToTime } from '@canchero/backend'
import { UnifiedReservationTable, type UnifiedRow } from '@/components/organisms/unified-reservation-table'
import { ModuleLayout } from '@/components/templates/module-layout'
import { ReservationSlideOver } from '@/components/organisms/reservation-slide-over'
import type { ReservationBackendStatus, ReservationUpdateFields, SeriesUpdateFields } from '@/components/organisms/reservation-slide-over'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { NewEntrySlideOver } from '@/components/organisms/new-entry-slide-over'
import { useActiveVenue } from '@/context/active-venue'
import { statusToCalendarState, applyEffectiveStatus } from '@/lib/convex/status-map'
import { resolveDateFilter, type DateFilter } from '@/lib/dates'
import type { ReservationRow } from '@canchero/backend'
import type { Doc } from '@canchero/backend'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusTab = 'todas' | 'pendientes' | 'señadas' | 'jugadas' | 'pagadas'

const TAB_FILTER: Record<StatusTab, Doc<'reservations'>['status'][]> = {
  todas:      [],
  pendientes: ['pending'],
  señadas:    ['deposit_paid'],
  jugadas:    ['played'],
  pagadas:    ['paid'],
}

const TAB_LABELS: Record<StatusTab, string> = {
  todas:      'Todas',
  pendientes: 'Pendientes',
  señadas:    'Señadas',
  jugadas:    'Jugadas',
  pagadas:    'Pagadas',
}

const STATUS_TABS: StatusTab[] = ['todas', 'pendientes', 'señadas', 'jugadas', 'pagadas']

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  hoy:    'Hoy',
  manana: 'Mañana',
  semana: 'Esta semana',
}

const DATE_FILTERS: DateFilter[] = ['hoy', 'manana', 'semana']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toUnifiedRow(row: ReservationRow, now: Date): UnifiedRow {
  const dayLabel = new Date(row.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' })
  return {
    id:          row._id,
    cliente:     row.clientName,
    cancha:      row.courtName,
    diayhorario: `${dayLabel} ${row.startTime} – ${row.endTime}`,
    estado:      applyEffectiveStatus(row.status, row.date, row.startTime, row.endTime, now),
    total:       row.totalAmount,
  }
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}


function toCalendarReservation(row: ReservationRow, now: Date): CalendarReservation {
  const effectiveStatus = applyEffectiveStatus(row.status, row.date, row.startTime, row.endTime, now)
  return {
    id:            row._id,
    courtId:       row.courtId as string,
    clientName:    row.clientName,
    phone:         undefined,
    startTime:     timeToMins(row.startTime),
    endTime:       timeToMins(row.endTime),
    date:          row.date,
    state:         statusToCalendarState(effectiveStatus),
    amount:        row.totalAmount,
    depositAmount: row.depositAmount,
    wasFullyPaid:  effectiveStatus === 'paid',
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
  const canQuery = isAuthenticated && activeVenueId !== null

  const [cancha,        setCancha]        = useState('todas')
  const [activeTab,     setActiveTab]     = useState<StatusTab>('todas')
  const [selectedRow,   setSelectedRow]   = useState<ReservationRow | null>(null)
  const [paymentError,  setPaymentError]  = useState<string | null>(null)
  const [dateFilter,    setDateFilter]    = useState<DateFilter>('hoy')
  const [newEntryOpen,  setNewEntryOpen]  = useState(false)

  // ── Mutations ────────────────────────────────────────────────────────────────
  const updateStatus      = useMutation(api.functions.reservations.mutations.updateStatus)
  const updateReservation = useMutation(api.functions.reservations.mutations.updateReservation)
  const deleteReservation = useMutation(api.functions.reservations.mutations.deleteReservation)
  const cancelSeries      = useMutation(api.functions.reservations.series.cancelSeries)
  const modifySeries      = useMutation(api.functions.reservations.series.modifySeries)

  // ── Derived date range ────────────────────────────────────────────────────
  const { dateFrom, dateTo, filterStartDate } = resolveDateFilter(dateFilter)

  // ── Queries ───────────────────────────────────────────────────────────────
  const allRows = useQuery(
    api.functions.reservations.queries.listByVenueAndPeriod,
    canQuery ? { venueId: activeVenueId, dateFrom, dateTo } : 'skip'
  )

  const courtsRaw = useQuery(
    api.functions.courts.queries.listByVenue,
    canQuery ? { venueId: activeVenueId } : 'skip'
  )

  const venueRaw = useQuery(
    api.functions.venues.queries.getById,
    canQuery ? { venueId: activeVenueId } : 'skip'
  )

  const stats = useQuery(
    api.functions.reservations.queries.statsByVenueAndPeriod,
    canQuery ? { venueId: activeVenueId, startDate: dateFrom, endDate: dateTo } : 'skip'
  )

  const isLoading = activeVenueId !== null && allRows === undefined
  const now = new Date()

  // ── Venue pricing ─────────────────────────────────────────────────────────
  const venuePricePerHour      = venueRaw?.pricingConfig?.pricePerHour
  const venueNightRate         = venueRaw?.pricingConfig?.nightRatePrice
  const venueNightRateStart    = venueRaw?.pricingConfig?.nightRateStart !== undefined
    ? minutesToTime(venueRaw.pricingConfig.nightRateStart)
    : undefined
  const venueDepositPercentage = venueRaw?.pricingConfig?.depositPercentage ?? 50

  // ── Client-side filters ───────────────────────────────────────────────────
  const canchaFiltered = (allRows ?? []).filter(
    (r) => cancha === 'todas' || r.courtName === cancha
  )

  const filtered = canchaFiltered.filter((r) => {
    if (activeTab === 'todas') return true
    if (activeTab === 'jugadas') {
      return applyEffectiveStatus(r.status, r.date, r.startTime, r.endTime, now) === 'played'
    }
    return TAB_FILTER[activeTab].includes(r.status)
  })

  const canchaOptionsSet = new Set((allRows ?? []).map((r) => r.courtName).filter(Boolean))
  if (cancha !== 'todas') canchaOptionsSet.add(cancha)
  const canchaOptions = [...canchaOptionsSet].sort()

  const allMappedRows = filtered.map((r) => toUnifiedRow(r, now))

  const courts: Court[] = courtsRaw?.map((c) => ({
    id:   c._id as string,
    name: c.name,
  })) ?? []

  // ── Stats strip ───────────────────────────────────────────────────────────
  const statsStrip: { value: string; label: string; delta?: string; positive?: boolean; color?: string }[] = [
    {
      value: stats !== undefined ? String(stats.count) : '...',
      label: 'reservas',
    },
    {
      value: stats !== undefined
        ? `$${stats.totalRevenue.toLocaleString('es-AR')}`
        : '...',
      label: 'facturado',
      color: stats !== undefined ? t.verdeCanchaProfundo.val : undefined,
    },
    {
      value: stats !== undefined
        ? `$${stats.pendingAmount.toLocaleString('es-AR')}`
        : '...',
      label: stats !== undefined && stats.pendingCount > 0
        ? `por cobrar · ${stats.pendingCount} pendiente${stats.pendingCount !== 1 ? 's' : ''}`
        : 'por cobrar',
      color: stats !== undefined && stats.pendingAmount > 0 ? t.acentoTerraza.val : undefined,
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
    const row = (allRows ?? []).find((r) => r._id === id)
    if (row) setSelectedRow(row)
  }, [allRows])

  const handleCloseSlideOver = useCallback(() => {
    setSelectedRow(null)
    setPaymentError(null)
  }, [])

  const handleUpdateStatus = useCallback(async (
    reservationId: string,
    status: ReservationBackendStatus,
    cashAmount?: number,
    onlineAmount?: number,
    amountOverride?: number,
  ): Promise<void> => {
    try {
      setPaymentError(null)
      await updateStatus({
        reservationId: reservationId as Id<'reservations'>,
        status,
        ...(cashAmount !== undefined || onlineAmount !== undefined
          ? { cashAmount, onlineAmount }
          : {}),
        ...(amountOverride !== undefined ? { totalAmountOverride: amountOverride } : {}),
      })
    } catch (err) {
      const msg = err instanceof Error && err.message.includes('invalid_split_amounts')
        ? 'Los montos ingresados no coinciden con el saldo pendiente.'
        : 'No se pudo registrar el cobro. Intentá de nuevo.'
      setPaymentError(msg)
      throw err
    }
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
  }, [])

  // ─────────────────────────────────────────────────────────────────────────

  const strip = (
    <>
      {/* Dark header: module identity + cancha filter + date filter + primary action */}
      <div style={{
        display:         'flex',
        flexDirection:   'column',
        backgroundColor: t.cabeceraOscura.val,
      }}>
        {/* Row 1: title + cancha dropdown + nueva reserva button */}
        <div style={{
          height:         56,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 32px',
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
                onChange={(e) => { setCancha(e.target.value) }}
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

          {/* Right: date filter buttons + Nueva reserva button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Date filter group */}
            <div style={{
              display:         'flex',
              backgroundColor: D.toggleBg,
              borderRadius:    7,
              padding:         3,
              gap:             2,
              border:          `1px solid ${D.border}`,
            }}>
              {DATE_FILTERS.map((df) => {
                const isActive = dateFilter === df
                return (
                  <button
                    key={df}
                    onClick={() => { setDateFilter(df) }}
                    style={{
                      padding:         '5px 12px',
                      borderRadius:    5,
                      border:          'none',
                      cursor:          'pointer',
                      fontSize:        12,
                      fontWeight:      isActive ? 600 : 400,
                      backgroundColor: isActive ? D.toggleOn : 'transparent',
                      color:           isActive ? D.text : D.toggleOff,
                      transition:      'all 100ms ease-out',
                      userSelect:      'none',
                      lineHeight:      1,
                      fontFamily:      'inherit',
                    }}
                  >
                    {DATE_FILTER_LABELS[df]}
                  </button>
                )
              })}
            </div>

            {/* Nueva reserva */}
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
              onClick={() => setNewEntryOpen(true)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
            >
              <Plus size={13} strokeWidth={2.5} />
              Nueva reserva
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="strip-scroll" style={{
        display:         'flex',
        alignItems:      'center',
        padding:         '28px 40px',
        borderBottom:    `1px solid ${t.divisor.val}`,
        backgroundColor: t.superficieContenido.val,
        overflowX:       'auto',
        gap:             0,
      }}>
        {statsStrip.map((stat, i) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {i > 0 && (
              <div style={{ width: 1, height: 56, backgroundColor: t.divisor.val, margin: '0 44px', flexShrink: 0 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, userSelect: 'none' }}>
              <span style={{
                fontSize:           38,
                fontWeight:         700,
                color:              stat.color ?? t.textoPrimario.val,
                lineHeight:         1,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing:      '-0.025em',
              }}>
                {stat.value}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, lineHeight: 1 }}>
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
          padding:       '14px 32px',
          boxSizing:     'border-box',
          display:       'flex',
          flexDirection: 'column',
          gap:           14,
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
              rows={allMappedRows}
              onRowClick={handleRowClick}
              totalColumnLabel="Importe"
              noun="reserva"
              showStatusFilter={false}
            />
          )}
        </div>
      </ModuleLayout>

      <ReservationSlideOver
        reservation={selectedRow ? toCalendarReservation(selectedRow, now) : null}
        courts={courts}
        onClose={handleCloseSlideOver}
        onUpdateStatus={handleUpdateStatus}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onCancelSeries={handleCancelSeries}
        onModifySeries={handleModifySeries}
      />

      <NewEntrySlideOver
        open={newEntryOpen}
        courts={courts}
        initialDate={new Date(filterStartDate + 'T12:00:00')}
        venueId={activeVenueId}
        venuePricePerHour={venuePricePerHour}
        venueNightRate={venueNightRate}
        venueNightRateStart={venueNightRateStart}
        venueDepositPercentage={venueDepositPercentage}
        onClose={() => setNewEntryOpen(false)}
      />
    </>
  )
}
