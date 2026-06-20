'use client'

import { useRef, useEffect, useState, useMemo, Fragment } from 'react'
import { useTheme } from 'tamagui'
import { Plus } from 'lucide-react'

import { ReservationCard }      from '@/components/atoms/reservation-card'
import { ReservationSlideOver } from '@/components/organisms/reservation-slide-over'
import type { ReservationBackendStatus, ReservationUpdateFields, SeriesUpdateFields } from '@/components/organisms/reservation-slide-over'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { resolveScheduleForDate } from '@canchero/backend'
import type { DaySchedule, ScheduleVersion } from '@canchero/backend'

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_MINUTES        = 30
const SLOT_HEIGHT         = 40    // px per 30-min slot
const COURT_HEADER_HEIGHT = 44    // px
const TIME_AXIS_WIDTH     = 64    // px

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function timeToRowStart(min: number, dayStartMin: number): number {
  return 2 + Math.floor((min - dayStartMin) / SLOT_MINUTES)
}

function generateTimeLabels(dayStartMin: number, dayEndMin: number): string[] {
  const labels: string[] = []
  for (let min = dayStartMin; min < dayEndMin; min += SLOT_MINUTES) {
    labels.push(minutesToTime(min))
  }
  return labels
}

function getArgentinaTime(date: Date): { hours: number; minutes: number } {
  const str = date.toLocaleString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour12:   false,
    hour:     '2-digit',
    minute:   '2-digit',
  })
  const [h, m] = str.split(':').map(Number)
  return { hours: h, minutes: m }
}

function getArgentinaDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarDayViewProps {
  courts:                    Court[]
  reservations:              CalendarReservation[]
  spillovers?:               CalendarReservation[]
  schedule:                  DaySchedule[]
  scheduleHistory:           ScheduleVersion[]
  holidays?:                 { date: string; reason: string }[]
  selectedDate:              Date
  venuePricePerHour?:        number
  venueNightRatePrice?:      number
  venueNightRateStart?:      number   // minutes since midnight
  onSlotClick?:              (courtId: string, time: string) => void
  onUpdateStatus?:           (reservationId: string, status: ReservationBackendStatus, cashAmount?: number, onlineAmount?: number, amountOverride?: number) => Promise<void>
  onExtend?:                 (reservationId: string, minutes: 30 | 60, overrideSchedule?: boolean) => Promise<void>
  onUpdate?:                 (reservationId: string, fields: ReservationUpdateFields) => void
  onDelete?:                 (reservationId: string) => void
  onCancelSeries?:           (seriesId: string) => void
  onModifySeries?:           (seriesId: string, fields: SeriesUpdateFields) => void
  onChargeEvent?:            (eventId: string, paymentMethod: 'cash' | 'online') => Promise<void>
  mockNow?:                  Date
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarDayView({ courts, reservations, spillovers = [], schedule, scheduleHistory, holidays = [], selectedDate, venuePricePerHour, venueNightRatePrice, venueNightRateStart, onSlotClick, onUpdateStatus, onExtend, onUpdate, onDelete, onCancelSeries, onModifySeries, onChargeEvent, mockNow }: CalendarDayViewProps) {
  const t = useTheme()

  const scrollRef = useRef<HTMLDivElement>(null)

  const [realNow,     setRealNow]     = useState(() => new Date())
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)

  // If mockNow is provided, use it directly on every render — no stale state
  const now = useMemo(() => mockNow ?? realNow, [mockNow, realNow])

  // Tick every minute — skip when using a fixed mock time
  useEffect(() => {
    if (mockNow) return
    const id = setInterval(() => setRealNow(new Date()), 60_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Day of week + dynamic schedule bounds ───────────────────────────────────
  const dayOfWeek = useMemo(() => {
    const js = selectedDate.getDay() // 0=Sun … 6=Sat
    return js === 0 ? 7 : js         // ISO 8601
  }, [selectedDate])

  // Resolve the schedule active on the selected date (uses history if available)
  const dateStr = useMemo(() => getArgentinaDateString(selectedDate), [selectedDate])
  const scheduleForDate = useMemo(
    () => resolveScheduleForDate(scheduleHistory, schedule, dateStr),
    [scheduleHistory, schedule, dateStr],
  )

  const { DAY_START_MIN, DAY_END_MIN } = useMemo(() => {
    const entry = scheduleForDate.find((s) => s.dayOfWeek === dayOfWeek && s.active)

    let startMin: number
    let endMin: number

    if (entry) {
      // openTime and closeTime are already in absolute minutes (from schema)
      startMin = entry.openTime
      endMin   = entry.closeTime <= entry.openTime ? entry.closeTime + 1440 : entry.closeTime
    } else {
      startMin = 9 * 60
      endMin   = 24 * 60
    }

    // Extend bounds to cover reservations outside the configured schedule
    for (const r of reservations) {
      startMin = Math.min(startMin, r.startTime)
      endMin   = Math.max(endMin,   r.endTime)
    }
    for (const r of spillovers) {
      endMin = Math.max(endMin, r.endTime)
    }

    return { DAY_START_MIN: startMin, DAY_END_MIN: endMin }
  }, [scheduleForDate, dayOfWeek, reservations, spillovers])

  const isInactiveDay = useMemo(() => {
    const entry = scheduleForDate.find((s) => s.dayOfWeek === dayOfWeek)
    return entry !== undefined && !entry.active
  }, [scheduleForDate, dayOfWeek])

  const holidayReason = useMemo(() => {
    const match = holidays.find((h) => h.date === dateStr)
    return match?.reason ?? null
  }, [holidays, dateStr])

  const TOTAL_SLOTS = Math.ceil((DAY_END_MIN - DAY_START_MIN) / SLOT_MINUTES)

  const TIME_LABELS = useMemo(
    () => generateTimeLabels(DAY_START_MIN, DAY_END_MIN),
    [DAY_START_MIN, DAY_END_MIN],
  )

  // ── Argentina timezone helpers ──────────────────────────────────────────────
  const { hours: nowH, minutes: nowM } = useMemo(() => getArgentinaTime(now), [now])

  // Auto-scroll to current time on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const { hours: scrollH, minutes: scrollM } = getArgentinaTime(now)
    const nowTotalMin      = scrollH * 60 + scrollM
    const minutesFromStart = nowTotalMin - DAY_START_MIN
    if (minutesFromStart < 0) return
    const pixelFromSlotStart = (minutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT
    const visibleSlotHeight  = el.clientHeight - COURT_HEADER_HEIGHT
    el.scrollTop = Math.max(0, pixelFromSlotStart - visibleSlotHeight * 0.25)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Today check — only show time pointer when viewing today ────────────────
  const isToday = useMemo(
    () => getArgentinaDateString(now) === getArgentinaDateString(selectedDate),
    [now, selectedDate],
  )

  // ── Effective reservations (auto-transition señado/en-cancha → jugado when past end) ──
  const nowTotalMins = nowH * 60 + nowM
  const isPastDay = useMemo(
    () => getArgentinaDateString(selectedDate) < getArgentinaDateString(now),
    [selectedDate, now],
  )
  // Derive selected from effectiveReservations so the SlideOver auto-updates when Convex mutates
  // (selectedId is the stable key; the object is recomputed from fresh data on every render)
  const effectiveReservations = reservations.map((r) => {
    if (isPastDay) {
      if (r.state === 'señado' || r.state === 'en-cancha' || r.state === 'pendiente') return { ...r, state: 'jugado' as const }
      return r
    }
    if (!isToday) return r
    if (nowTotalMins > r.endTime && (r.state === 'señado' || r.state === 'en-cancha' || r.state === 'pendiente')) {
      return { ...r, state: 'jugado' as const }
    }
    if (nowTotalMins >= r.startTime && nowTotalMins < r.endTime && (r.state === 'señado' || r.state === 'pendiente' || r.state === 'pagado')) {
      return { ...r, state: 'en-cancha' as const }
    }
    return r
  })

  const selected = selectedId ? (effectiveReservations.find((r) => r.id === selectedId) ?? null) : null

  // ── Current time line ───────────────────────────────────────────────────────
  const withinDay   = nowTotalMins >= DAY_START_MIN && nowTotalMins < DAY_END_MIN
  const nowSlotIdx  = withinDay ? Math.floor((nowTotalMins - DAY_START_MIN) / SLOT_MINUTES) : -1
  const nowFraction = withinDay ? (nowTotalMins - DAY_START_MIN) % SLOT_MINUTES / SLOT_MINUTES : 0
  const nowGridRow  = withinDay ? 2 + nowSlotIdx : -1
  const nowMarginTop = nowFraction * SLOT_HEIGHT

  // ── Grid template strings ───────────────────────────────────────────────────
  const gridCols = `${TIME_AXIS_WIDTH}px repeat(${courts.length}, minmax(180px, 1fr))`
  const gridRows = `${COURT_HEADER_HEIGHT}px repeat(${TOTAL_SLOTS}, ${SLOT_HEIGHT}px)`

  // ── Token shortcuts ─────────────────────────────────────────────────────────
  const C = {
    bg:         t.superficieContenido.val,
    surface:    t.superficie.val,
    border:     t.bordeNeutral.val,
    divider:    t.divisor.val,
    hover:      t.fondoHover.val,
    textPrimary: t.textoPrimario.val,
    textMuted:  t.textoMuted.val,
    textInact:  t.textoInactivo.val,
    textNav:    t.textoNav.val,
    green:      t.verdeCancha.val,
    greenDeep:  t.verdeCanchaProfundo.val,
    greenBg:    t.verdeCanchaActivo.val,
    headerBg:   t.cabeceraOscura.val,
  } as const

  // ── Inactive day / holiday empty state ─────────────────────────────────────
  if (isInactiveDay || holidayReason !== null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, color: C.textMuted }}>Sin actividad este día</span>
        {holidayReason !== null && (
          <span style={{ fontSize: 12, color: C.textInact }}>{holidayReason}</span>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Scroll container ─────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="calendar-scroll"
        style={{ flex: 1, overflow: 'auto', backgroundColor: C.bg }}
      >
        {/* ── CSS Grid ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: gridCols,
            gridTemplateRows:    gridRows,
            minHeight:           '100%',
          }}
        >

          {/* ── Corner cell ─────────────────────────────────────────────────── */}
          <div style={{
            gridRow:         1,
            gridColumn:      1,
            position:        'sticky',
            top:             0,
            left:            0,
            zIndex:          15,
            backgroundColor: C.bg,
            borderRight:     `1px solid ${C.border}`,
            borderBottom:    `1px solid ${C.border}`,
          }} />

          {/* ── Court header cells ──────────────────────────────────────────── */}
          {courts.map((court, colIdx) => (
            <div
              key={`hdr-${court.id}`}
              style={{
                gridRow:         1,
                gridColumn:      colIdx + 2,
                position:        'sticky',
                top:             0,
                zIndex:          10,
                backgroundColor: C.bg,
                borderBottom:    `1px solid ${C.border}`,
                borderRight:     colIdx < courts.length - 1 ? `1px solid ${C.divider}` : 'none',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                padding:         '0 12px',
              }}
            >
              <span style={{
                fontSize:      12,
                fontWeight:    600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color:         C.textInact,
                lineHeight:    1,
                userSelect:    'none',
              }}>
                {court.name}
              </span>
            </div>
          ))}

          {/* ── Time labels + slot rows ──────────────────────────────────────── */}
          {TIME_LABELS.map((label, rowIdx) => {
            const showHour = label.endsWith(':00')
            const gridRow  = rowIdx + 2

            return (
              <Fragment key={rowIdx}>
                {/* Time label cell */}
                <div
                  style={{
                    gridRow,
                    gridColumn:      1,
                    position:        'sticky',
                    left:            0,
                    zIndex:          5,
                    backgroundColor: C.bg,
                    borderRight:     `1px solid ${C.border}`,
                    borderBottom:    `1px solid ${C.divider}`,
                    display:         'flex',
                    alignItems:      'flex-start',
                    justifyContent:  'flex-end',
                    paddingRight:    10,
                    paddingTop:      7,
                    userSelect:      'none',
                  }}
                >
                  {showHour && (
                    <span style={{
                      fontSize:        11,
                      fontWeight:      500,
                      color:           C.textInact,
                      lineHeight:      1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {label}
                    </span>
                  )}
                </div>

                {/* Slot cells for each court */}
                {courts.map((court, colIdx) => {
                  const slotKey = `${rowIdx}-${colIdx}`
                  const isHovered = hoveredSlot === slotKey

                  return (
                    <div
                      key={`slot-${rowIdx}-${colIdx}`}
                      onMouseEnter={() => setHoveredSlot(slotKey)}
                      onMouseLeave={() => setHoveredSlot(null)}
                      onClick={() => onSlotClick?.(court.id, TIME_LABELS[rowIdx] ?? '')}
                      style={{
                        gridRow,
                        gridColumn:      colIdx + 2,
                        borderRight:     colIdx < courts.length - 1 ? `1px solid ${C.divider}` : 'none',
                        borderBottom:    `1px solid ${showHour ? C.border : C.divider}`,
                        position:        'relative',
                        backgroundColor: isHovered ? C.hover : 'transparent',
                        transition:      'background-color 80ms ease-out',
                        cursor:          isHovered ? 'pointer' : 'default',
                      }}
                    >
                      {isHovered && (
                        <SlotAddHint color={C.textInact} />
                      )}
                    </div>
                  )
                })}
              </Fragment>
            )
          })}

          {/* ── Reservation cards ────────────────────────────────────────────── */}
          {effectiveReservations.map((res) => {
            const courtIdx  = courts.findIndex((c) => c.id === res.courtId)
            if (courtIdx === -1) return null

            const rowStart  = timeToRowStart(res.startTime, DAY_START_MIN)
            const rowEnd    = timeToRowStart(res.endTime, DAY_START_MIN)
            const slotCount = rowEnd - rowStart

            return (
              <div
                key={res.id}
                style={{
                  gridRow:    `${rowStart} / ${rowEnd}`,
                  gridColumn: courtIdx + 2,
                  position:   'relative',
                  zIndex:     2,
                }}
              >
                <ReservationCard
                  reservation={res}
                  slotHeight={SLOT_HEIGHT}
                  slotCount={slotCount}
                  now={now}
                  onClick={() => setSelectedId(res.id)}
                />
              </div>
            )
          })}

          {/* ── Spillover overlays (overnight tail from previous day) ─────────── */}
          {spillovers.map((res) => {
            const courtIdx = courts.findIndex((c) => c.id === res.courtId)
            if (courtIdx === -1) return null

            const rowStart  = timeToRowStart(DAY_START_MIN, DAY_START_MIN)
            const rowEnd    = timeToRowStart(res.endTime, DAY_START_MIN)
            if (rowEnd <= rowStart) return null

            return (
              <div
                key={`spillover-${res.id}`}
                style={{
                  gridRow:         `${rowStart} / ${rowEnd}`,
                  gridColumn:      courtIdx + 2,
                  position:        'relative',
                  zIndex:          1,
                  opacity:         0.4,
                  pointerEvents:   'none',
                }}
              >
                <ReservationCard
                  reservation={res}
                  slotHeight={SLOT_HEIGHT}
                  slotCount={rowEnd - rowStart}
                  now={now}
                  onClick={() => {}}
                />
              </div>
            )
          })}

          {/* ── Current time indicator — only on today ───────────────────────── */}
          {isToday && withinDay && courts.length > 0 && (
            <div
              aria-hidden="true"
              style={{
                gridRow:       nowGridRow,
                gridColumn:    `2 / -1`,
                alignSelf:     'start',
                marginTop:     nowMarginTop,
                height:        2,
                backgroundColor: C.green,
                opacity:       0.8,
                zIndex:        3,
                pointerEvents: 'none',
                position:      'relative',
              }}
            >
              {/* Dot on the left edge */}
              <div style={{
                position:        'absolute',
                left:            -4,
                top:             -3,
                width:           8,
                height:          8,
                borderRadius:    '50%',
                backgroundColor: C.green,
              }} />
            </div>
          )}

        </div>
      </div>

      {/* ── Slide-over ────────────────────────────────────────────────────────── */}
      <ReservationSlideOver
        reservation={selected}
        courts={courts}
        reservations={effectiveReservations}
        now={now}
        venuePricePerHour={venuePricePerHour}
        venueNightRatePrice={venueNightRatePrice}
        venueNightRateStart={venueNightRateStart}
        onClose={() => setSelectedId(null)}
        onUpdateStatus={onUpdateStatus}
        onExtend={onExtend}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onCancelSeries={onCancelSeries}
        onModifySeries={onModifySeries}
        onChargeEvent={onChargeEvent}
      />
    </div>
  )
}

// ─── Slot add hint ────────────────────────────────────────────────────────────

function SlotAddHint({ color }: { color: string }) {
  return (
    <div style={{
      position:       'absolute',
      inset:          0,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            4,
      pointerEvents:  'none',
    }}>
      <Plus size={13} strokeWidth={2.5} color={color} />
      <span style={{
        fontSize:   11,
        fontWeight: 500,
        color,
        lineHeight: 1,
        userSelect: 'none',
      }}>
        Agregar
      </span>
    </div>
  )
}
