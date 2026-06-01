'use client'

import { useState, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { api } from '@canchero/backend'
import type { Doc, Id } from '@canchero/backend'
import type { ScheduleVersion } from '@canchero/backend'

import { CalendarMiniPicker }      from '@/components/molecules/calendar-mini-picker'
import { CalendarDayView }         from '@/components/organisms/calendar-day-view'
import { CalendarWeekView }        from '@/components/organisms/calendar-week-view'
import { CalendarMonthView }       from '@/components/organisms/calendar-month-view'
import { ScheduleWarningBanner }   from '@/components/molecules/schedule-warning-banner'
import { ModuleLayout }            from '@/components/templates/module-layout'
import { NewEntrySlideOver }       from '@/components/organisms/new-entry-slide-over'
import type { EntryType }          from '@/components/organisms/new-entry-slide-over'
import type { ReservationUpdateFields, SeriesUpdateFields } from '@/components/organisms/reservation-slide-over'
import type { CalendarViewMode }   from '@/components/molecules/calendar-header'
import type { Court, CalendarReservation, CalendarReservationState } from '@/components/atoms/reservation-card'
import { useActiveVenue }          from '@/context/active-venue'
import type { DaySchedule }        from '@canchero/backend'
import { minutesToTime }           from '@canchero/backend'
import { COURT_PALETTES }          from '@/lib/calendar-utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateToStr(d: Date): string {
  return new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function getMondayOfWeek(d: Date): Date {
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - (dow - 1))
  return mon
}

function deriveWindow(
  viewMode: CalendarViewMode,
  currentDate: Date,
): { startDate: string; endDate: string } {
  if (viewMode === 'dia') {
    const s = dateToStr(currentDate)
    return { startDate: s, endDate: s }
  }
  if (viewMode === 'semana') {
    const mon = getMondayOfWeek(currentDate)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    return { startDate: dateToStr(mon), endDate: dateToStr(sun) }
  }
  // mes
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const last  = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  return { startDate: dateToStr(first), endDate: dateToStr(last) }
}

function isHoyVisible(viewMode: CalendarViewMode, currentDate: Date): boolean {
  const today = new Date()
  if (viewMode === 'dia') {
    return today.toDateString() !== currentDate.toDateString()
  }
  if (viewMode === 'semana') {
    const mon = getMondayOfWeek(currentDate)
    const sun = new Date(mon)
    sun.setDate(mon.getDate() + 6)
    const todayStr = dateToStr(today)
    const { startDate, endDate } = deriveWindow('semana', currentDate)
    return todayStr < startDate || todayStr > endDate
  }
  return today.getFullYear() !== currentDate.getFullYear() ||
         today.getMonth()    !== currentDate.getMonth()
}

const MONTH_NAMES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MONTH_ABBREVS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function formatHeaderDate(date: Date, viewMode: CalendarViewMode): string {
  if (viewMode === 'dia') {
    const raw = date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric',
    })
    return raw.charAt(0).toUpperCase() + raw.slice(1)
  }
  if (viewMode === 'mes') {
    const month = MONTH_NAMES_CAP[date.getMonth()]!
    return `${month} ${date.getFullYear()}`
  }
  // semana
  const mon = getMondayOfWeek(date)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const monDay  = mon.getDate()
  const sunDay  = sun.getDate()
  const monMon  = mon.getMonth()
  const sunMon  = sun.getMonth()
  const monYear = mon.getFullYear()
  const sunYear = sun.getFullYear()
  if (monMon === sunMon && monYear === sunYear) {
    return `${monDay} – ${sunDay} ${MONTH_ABBREVS[monMon]!} ${monYear}`
  }
  if (monYear === sunYear) {
    return `${monDay} ${MONTH_ABBREVS[monMon]!} – ${sunDay} ${MONTH_ABBREVS[sunMon]!} ${sunYear}`
  }
  return `${monDay} ${MONTH_ABBREVS[monMon]!} ${monYear} – ${sunDay} ${MONTH_ABBREVS[sunMon]!} ${sunYear}`
}

function prevLabel(viewMode: CalendarViewMode): string {
  if (viewMode === 'semana') return 'Semana anterior'
  if (viewMode === 'mes')    return 'Mes anterior'
  return 'Día anterior'
}

function nextLabel(viewMode: CalendarViewMode): string {
  if (viewMode === 'semana') return 'Semana siguiente'
  if (viewMode === 'mes')    return 'Mes siguiente'
  return 'Día siguiente'
}

// ─── Status mappings ──────────────────────────────────────────────────────────

const STATUS_TO_STATE: Record<Doc<'reservations'>['status'], CalendarReservationState> = {
  pending:       'pendiente',
  deposit_paid:  'señado',
  on_court:      'en-cancha',
  absent:        'ausente',
  paid:          'pagado',
  maintenance:   'mantenimiento',
  recurring:     'recurrente',
  played:        'jugado',
  event:         'evento',
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEGEND: { label: string; color: string; description: string }[] = [
  { label: 'En cancha',     color: 'oklch(68% 0.13 155)',  description: 'El cliente está jugando ahora mismo' },
  { label: 'Señado',        color: 'oklch(78% 0.09 42)',   description: 'Pagó una seña, abona el saldo al llegar' },
  { label: 'Pendiente',     color: 'oklch(80% 0.10 55)',   description: 'Reserva confirmada sin pago previo, cobra al llegar' },
  { label: 'Pagado',        color: 'oklch(90% 0.008 220)', description: 'Cobrada en su totalidad' },
  { label: 'Jugado',        color: 'oklch(76% 0.018 222)', description: 'Terminó de jugar, cobro pendiente' },
  { label: 'Ausente',       color: 'oklch(60% 0.010 224)', description: 'El cliente no se presentó' },
  { label: 'Recurrente',    color: 'oklch(70% 0.09 275)',  description: 'Turno fijo semanal o quincenal' },
  { label: 'Mantenimiento', color: 'oklch(76% 0.13 88)',   description: 'Cancha fuera de servicio' },
  { label: 'Evento',        color: 'oklch(68% 0.10 200)',  description: 'Evento especial o torneo' },
]

const VIEW_OPTIONS: { id: CalendarViewMode; label: string }[] = [
  { id: 'dia',    label: 'Día'    },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes'    },
]

// ─── Dark header tokens ───────────────────────────────────────────────────────

const D = {
  text:       'oklch(97% 0.006 220)',
  textMuted:  'oklch(50% 0.012 228)',
  border:     'oklch(35% 0.018 228)',
  hover:      'oklch(30% 0.020 228)',
  toggleBg:   'oklch(16% 0.020 228)',
  toggleOn:   'oklch(32% 0.022 228)',
  toggleOff:  'oklch(40% 0.012 228)',
} as const

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const t = useTheme()
  const { activeVenueId } = useActiveVenue()
  const { isAuthenticated } = useConvexAuth()

  const updateStatus      = useMutation(api.functions.reservations.mutations.updateStatus)
  const extendReservation = useMutation(api.functions.reservations.mutations.extendReservation)
  const updateReservation = useMutation(api.functions.reservations.mutations.updateReservation)
  const deleteReservation = useMutation(api.functions.reservations.mutations.deleteReservation)
  const cancelSeries      = useMutation(api.functions.reservations.series.cancelSeries)
  const modifySeries      = useMutation(api.functions.reservations.series.modifySeries)

  const [currentDate,              setCurrentDate]              = useState(() => new Date())
  const [viewMode,                 setViewMode]                 = useState<CalendarViewMode>('dia')
  const [slideOverOpen,            setSlideOverOpen]            = useState(false)
  const [defaultType,              setDefaultType]              = useState<EntryType>('reserva')
  const [initialSlotTime,          setInitialSlotTime]          = useState<string | undefined>(undefined)
  const [initialSlotCourt,         setInitialSlotCourt]         = useState<string | undefined>(undefined)
  const [scheduleBannerDismissed,  setScheduleBannerDismissed]  = useState(false)
  const [legendTooltip,            setLegendTooltip]            = useState<{ text: string; x: number; y: number } | null>(null)

  const currentDateStr = dateToStr(currentDate)
  const canQuery       = isAuthenticated && activeVenueId !== null

  // ── Day query — active only in 'dia' mode ─────────────────────────────────
  const reservationsRaw = useQuery(
    api.functions.reservations.queries.listAllByVenueAndDate,
    canQuery && viewMode === 'dia'
      ? { venueId: activeVenueId, date: currentDateStr }
      : 'skip'
  )

  // ── Range query — active only in 'semana' | 'mes' modes ──────────────────
  const { startDate: rangeStart, endDate: rangeEnd } = useMemo(
    () => deriveWindow(viewMode, currentDate),
    [viewMode, currentDate]
  )

  const rangeRaw = useQuery(
    api.functions.reservations.queries.listByVenueAndDateRange,
    canQuery && (viewMode === 'semana' || viewMode === 'mes')
      ? { venueId: activeVenueId, startDate: rangeStart, endDate: rangeEnd }
      : 'skip'
  )

  // ── Common queries — always active when venue selected ───────────────────
  const courtsRaw = useQuery(
    api.functions.courts.queries.listByVenue,
    canQuery ? { venueId: activeVenueId } : 'skip'
  )

  const venueRaw = useQuery(
    api.functions.venues.queries.getById,
    canQuery ? { venueId: activeVenueId } : 'skip'
  )

  const stats = useQuery(
    api.functions.reservations.queries.statsByVenueAndDate,
    canQuery && viewMode === 'dia' ? { venueId: activeVenueId, date: currentDateStr } : 'skip'
  )

  // ── Loading state ─────────────────────────────────────────────────────────
  const isLoadingDay   = viewMode === 'dia'   && activeVenueId !== null && (reservationsRaw === undefined || courtsRaw === undefined)
  const isLoadingRange = (viewMode === 'semana' || viewMode === 'mes') && activeVenueId !== null && (rangeRaw === undefined || courtsRaw === undefined)
  const isLoading      = isLoadingDay || isLoadingRange

  // ── Shape adaptation ───────────────────────────────────────────────────────
  const courts: Court[] = courtsRaw?.map((c) => ({
    id:                     c._id as string,
    name:                   c.name,
    priceOverride:          c.priceOverride          ?? undefined,
    nightRatePriceOverride: c.nightRatePriceOverride ?? undefined,
  })) ?? []

  const venuePricePerHour     = venueRaw?.pricingConfig?.pricePerHour
  const venueNightRate         = venueRaw?.pricingConfig?.nightRatePrice
  const venueNightRateStart    = venueRaw?.pricingConfig?.nightRateStart !== undefined
    ? minutesToTime(venueRaw.pricingConfig.nightRateStart)
    : undefined
  const venueDepositPercentage = venueRaw?.pricingConfig?.depositPercentage ?? 50
  const venueSchedule: DaySchedule[]          = venueRaw?.schedule        ?? []
  const venueScheduleHistory: ScheduleVersion[] = venueRaw?.scheduleHistory ?? []
  const venueHolidays                          = venueRaw?.holidays         ?? []

  const showScheduleWarning =
    venueRaw !== undefined &&
    activeVenueId !== null &&
    venueScheduleHistory.length === 0

  // ── Day view reservation mapping ──────────────────────────────────────────
  const rawReservations = reservationsRaw?.reservations ?? []
  const rawSpillovers   = reservationsRaw?.spillovers   ?? []

  const mapReservation = useCallback((r: typeof rawReservations[number]): CalendarReservation => ({
    id:            r._id,
    clientName:    r.clientName,
    phone:         r.clientPhone || undefined,
    startTime:     r.startTime,
    endTime:       r.endTime,
    state:         STATUS_TO_STATE[r.status],
    amount:        r.totalAmount,
    depositAmount: r.depositAmount,
    wasFullyPaid:  r.status === 'paid' || r.depositAmount === r.totalAmount,
    courtId:       r.courtId as string,
    date:          r.date,
    notes:         r.notes,
    seriesId:      r.seriesId,
  }), [])

  const dayReservations: CalendarReservation[] = rawReservations.map(mapReservation)
  const daySpillovers:   CalendarReservation[] = rawSpillovers.map((r) => ({
    ...mapReservation(r),
    startTime: 0,
    endTime:   r.endTime - 1440,
  }))

  // ── Range view reservation mapping ────────────────────────────────────────
  const rangeByDate = useMemo((): Record<string, CalendarReservation[]> => {
    if (!rangeRaw) return {}
    const result: Record<string, CalendarReservation[]> = {}
    for (const [dateStr, resArr] of Object.entries(rangeRaw.byDate)) {
      result[dateStr] = resArr.map((r) => ({
        id:            r._id,
        clientName:    r.clientName,
        phone:         r.clientPhone || undefined,
        startTime:     r.startTime,
        endTime:       r.endTime,
        state:         STATUS_TO_STATE[r.status],
        amount:        r.totalAmount,
        depositAmount: r.depositAmount,
        wasFullyPaid:  r.status === 'paid' || r.depositAmount === r.totalAmount,
        courtId:       r.courtId as string,
        date:          r.date,
        notes:         r.notes,
        seriesId:      r.seriesId,
      }))
    }
    return result
  }, [rangeRaw])

  const rangeSpillovers: CalendarReservation[] = useMemo(() => {
    if (!rangeRaw) return []
    return rangeRaw.spillovers.map((r) => ({
      id:            r._id,
      clientName:    r.clientName,
      phone:         r.clientPhone || undefined,
      startTime:     0,
      endTime:       r.endTime,
      state:         STATUS_TO_STATE[r.status],
      amount:        r.totalAmount,
      depositAmount: r.depositAmount,
      wasFullyPaid:  r.status === 'paid' || r.depositAmount === r.totalAmount,
      courtId:       r.courtId as string,
      date:          r.date,
      notes:         r.notes,
      seriesId:      r.seriesId,
    }))
  }, [rangeRaw])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const navigate = useCallback((delta: number) => {
    setCurrentDate((d) => {
      const n = new Date(d)
      if (viewMode === 'dia') {
        n.setDate(n.getDate() + delta)
      } else if (viewMode === 'semana') {
        n.setDate(n.getDate() + delta * 7)
      } else {
        n.setMonth(n.getMonth() + delta)
        // clamp to last day of resulting month
        const lastDay = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate()
        if (n.getDate() > lastDay) n.setDate(lastDay)
      }
      return n
    })
  }, [viewMode])

  const goToday = useCallback(() => setCurrentDate(new Date()), [])

  const showHoy = isHoyVisible(viewMode, currentDate)

  const handleCancelSeries = useCallback(async (seriesId: string) => {
    await cancelSeries({ seriesId: seriesId as Id<'recurrenceSeries'> })
  }, [cancelSeries])

  const handleModifySeries = useCallback(async (seriesId: string, fields: SeriesUpdateFields) => {
    await modifySeries({ seriesId: seriesId as Id<'recurrenceSeries'>, ...fields })
  }, [modifySeries])

  // ── Week start for CalendarWeekView ────────────────────────────────────────
  const weekStart = useMemo(() => getMondayOfWeek(currentDate), [currentDate])

  const navBtn: React.CSSProperties = {
    width:           30,
    height:          30,
    borderRadius:    6,
    border:          `1px solid ${D.border}`,
    backgroundColor: 'transparent',
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    color:           D.textMuted,
    flexShrink:      0,
  }

  const strip = (
    <>
    <div className="strip-scroll" style={{
      height:          56,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 32px',
      backgroundColor: t.cabeceraOscura.val,
      overflowX:       'auto',
      gap:             12,
    }}>

      {/* Left: title + date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize:      15,
          fontWeight:    600,
          color:         D.text,
          letterSpacing: '-0.01em',
          lineHeight:    1,
          userSelect:    'none',
          marginRight:   12,
        }}>
          Calendario
        </span>

        <div style={{ width: 1, height: 14, backgroundColor: 'oklch(38% 0.016 228)', flexShrink: 0, marginRight: 4 }} />

        <button
          onClick={() => navigate(-1)}
          aria-label={prevLabel(viewMode)}
          style={navBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <ChevronLeft size={15} strokeWidth={2} />
        </button>

        <span style={{
          fontSize:      15,
          fontWeight:    600,
          color:         D.text,
          letterSpacing: '-0.01em',
          lineHeight:    1.2,
          userSelect:    'none',
          minWidth:      0,
          textAlign:     'center',
        }}>
          {formatHeaderDate(currentDate, viewMode)}
        </span>

        <button
          onClick={() => navigate(1)}
          aria-label={nextLabel(viewMode)}
          style={navBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <ChevronRight size={15} strokeWidth={2} />
        </button>

        {showHoy && (
          <button
            onClick={goToday}
            style={{
              padding:         '5px 12px',
              borderRadius:    6,
              border:          `1px solid ${D.border}`,
              backgroundColor: 'transparent',
              cursor:          'pointer',
              fontSize:        12,
              fontWeight:      500,
              color:           D.textMuted,
              lineHeight:      1,
              fontFamily:      'inherit',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            Hoy
          </button>
        )}
      </div>

      {/* Right: action + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => {
            setDefaultType('reserva')
            setInitialSlotTime(undefined)
            setInitialSlotCourt(undefined)
            setSlideOverOpen(true)
          }}
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
            transition:      'background-color 120ms ease-out',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
        >
          <Plus size={13} strokeWidth={2.5} />
          Nueva reserva
        </button>

        {/* View toggle */}
        <div style={{
          display:         'flex',
          backgroundColor: D.toggleBg,
          borderRadius:    8,
          padding:         3,
          gap:             2,
          border:          `1px solid ${D.border}`,
        }}>
          {VIEW_OPTIONS.map(({ id, label }) => {
            const isActive = viewMode === id
            return (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                style={{
                  padding:         '5px 14px',
                  borderRadius:    6,
                  border:          'none',
                  cursor:          'pointer',
                  fontSize:        12,
                  fontWeight:      isActive ? 600 : 400,
                  backgroundColor: isActive ? D.toggleOn : 'transparent',
                  color:           isActive ? D.text : D.toggleOff,
                  transition:      'background-color 120ms ease-out',
                  userSelect:      'none',
                  lineHeight:      1,
                  fontFamily:      'inherit',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>

    {/* Info strip: leyenda contextual según vista + cobros pendientes */}
    {viewMode !== 'mes' && (
      <div className="strip-scroll" style={{
        height:         36,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 32px',
        borderBottom:   `1px solid ${t.divisor.val}`,
        overflowX:      'auto',
        gap:            20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {viewMode === 'dia'
            ? LEGEND.map(({ label, color, description }) => (
                <span
                  key={label}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none', flexShrink: 0, cursor: 'default' }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setLegendTooltip({ text: description, x: rect.left + rect.width / 2, y: rect.bottom + 6 })
                  }}
                  onMouseLeave={() => setLegendTooltip(null)}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>{label}</span>
                </span>
              ))
            : courts.map((court, idx) => {
                const palette = COURT_PALETTES[idx % COURT_PALETTES.length]!
                return (
                  <span
                    key={court.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none', flexShrink: 0 }}
                  >
                    <span style={{
                      width:           10,
                      height:          10,
                      borderRadius:    3,
                      backgroundColor: palette.bg,
                      border:          `1.5px solid ${palette.border}`,
                      flexShrink:      0,
                    }} />
                    <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>{court.name}</span>
                  </span>
                )
              })
          }
        </div>
        {viewMode === 'dia' && stats !== undefined && stats.pendingCount > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{
              fontSize:        11,
              fontWeight:      500,
              color:           'oklch(55% 0.15 42)',
              backgroundColor: 'oklch(95% 0.04 42)',
              borderRadius:    5,
              padding:         '2px 8px',
              lineHeight:      1.4,
            }}>
              {stats.pendingCount} cobro{stats.pendingCount !== 1 ? 's' : ''} pendiente{stats.pendingCount !== 1 ? 's' : ''}
            </span>
          </span>
        )}
      </div>
    )}
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
        }}>
          {showScheduleWarning && !scheduleBannerDismissed && (
            <ScheduleWarningBanner onDismiss={() => setScheduleBannerDismissed(true)} />
          )}

          {activeVenueId === null ? (
            <div style={{
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 14, color: t.textoMuted.val }}>
                Seleccioná una sede para ver el calendario
              </span>
            </div>
          ) : (
            <div style={{
              flex:         1,
              minHeight:    0,
              borderRadius: 7,
              border:       `1px solid ${t.bordeNeutral.val}`,
              overflow:     'hidden',
              display:      'flex',
            }}>
              <CalendarMiniPicker
                selectedDate={currentDate}
                onSelectDate={setCurrentDate}
              />

              {isLoading ? (
                <div style={{
                  flex:           1,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 14, color: t.textoMuted.val }}>Cargando...</span>
                </div>
              ) : viewMode === 'dia' ? (
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <CalendarDayView
                    courts={courts}
                    reservations={dayReservations}
                    spillovers={daySpillovers}
                    schedule={venueSchedule}
                    scheduleHistory={venueScheduleHistory}
                    holidays={venueHolidays}
                    selectedDate={currentDate}
                    venuePricePerHour={venuePricePerHour}
                    venueNightRatePrice={venueNightRate}
                    venueNightRateStart={venueRaw?.pricingConfig?.nightRateStart}
                    onSlotClick={(courtId, time) => {
                      setDefaultType('reserva')
                      setInitialSlotTime(time)
                      setInitialSlotCourt(courtId)
                      setSlideOverOpen(true)
                    }}
                    onUpdateStatus={(reservationId, status, cashAmount, onlineAmount, amountOverride) => {
                      void updateStatus({
                        reservationId: reservationId as Id<'reservations'>,
                        status,
                        ...(cashAmount !== undefined || onlineAmount !== undefined
                          ? { cashAmount, onlineAmount }
                          : {}),
                        ...(amountOverride !== undefined ? { totalAmountOverride: amountOverride } : {}),
                      })
                    }}
                    onExtend={(reservationId, minutes, overrideSchedule) =>
                      extendReservation({
                        reservationId:     reservationId as Id<'reservations'>,
                        additionalMinutes: minutes,
                        overrideSchedule,
                      })
                    }
                    onUpdate={(reservationId, fields: ReservationUpdateFields) => {
                      void updateReservation({
                        reservationId: reservationId as Id<'reservations'>,
                        ...(fields.startTime   !== undefined ? { startTime:   fields.startTime   } : {}),
                        ...(fields.endTime     !== undefined ? { endTime:     fields.endTime     } : {}),
                        ...(fields.clientName  !== undefined ? { clientName:  fields.clientName  } : {}),
                        ...(fields.clientPhone !== undefined ? { clientPhone: fields.clientPhone } : {}),
                        ...(fields.totalAmount !== undefined ? { totalAmount: fields.totalAmount } : {}),
                        ...(fields.notes       !== undefined ? { notes:       fields.notes       } : {}),
                      }).catch((err) => console.error('updateReservation failed:', err))
                    }}
                    onDelete={(reservationId) => {
                      void deleteReservation({
                        reservationId: reservationId as Id<'reservations'>,
                      }).catch((err) => console.error('deleteReservation failed:', err))
                    }}
                    onCancelSeries={handleCancelSeries}
                    onModifySeries={handleModifySeries}
                  />
                </div>
              ) : viewMode === 'semana' ? (
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <CalendarWeekView
                    courts={courts}
                    byDate={rangeByDate}
                    spillovers={rangeSpillovers}
                    weekStart={weekStart}
                    schedule={venueSchedule}
                    scheduleHistory={venueScheduleHistory}
                    holidays={venueHolidays}
                    onReservationClick={() => {}}
                  />
                </div>
              ) : (
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <CalendarMonthView
                    byDate={rangeByDate}
                    viewYear={currentDate.getFullYear()}
                    viewMonth={currentDate.getMonth()}
                    schedule={venueSchedule}
                    scheduleHistory={venueScheduleHistory}
                    holidays={venueHolidays}
                    onDayClick={(date) => {
                      setCurrentDate(date)
                      setViewMode('dia')
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </ModuleLayout>

      <NewEntrySlideOver
        open={slideOverOpen}
        defaultType={defaultType}
        initialTime={initialSlotTime}
        initialCourtId={initialSlotCourt}
        courts={courts}
        initialDate={currentDate}
        venueId={activeVenueId}
        venuePricePerHour={venuePricePerHour}
        venueNightRate={venueNightRate}
        venueNightRateStart={venueNightRateStart}
        venueDepositPercentage={venueDepositPercentage}
        onClose={() => setSlideOverOpen(false)}
      />
      {legendTooltip && createPortal(
        <div style={{
          position:        'fixed',
          left:            legendTooltip.x,
          top:             legendTooltip.y,
          transform:       'translateX(-50%)',
          backgroundColor: 'oklch(15% 0.01 222)',
          color:           'oklch(96% 0.003 222)',
          fontSize:        11,
          padding:         '5px 10px',
          borderRadius:    5,
          pointerEvents:   'none',
          zIndex:          9999,
          whiteSpace:      'nowrap',
          boxShadow:       '0 2px 8px oklch(0% 0 0 / 0.15)',
          lineHeight:      1.4,
        }}>
          {legendTooltip.text}
        </div>,
        document.body,
      )}
    </>
  )
}
