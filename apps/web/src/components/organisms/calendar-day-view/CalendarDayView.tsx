'use client'

import { useRef, useEffect, useState, useMemo, Fragment } from 'react'
import { useTheme } from 'tamagui'
import { Plus } from 'lucide-react'

import { ReservationCard }      from '@/components/atoms/reservation-card'
import { ReservationSlideOver } from '@/components/organisms/reservation-slide-over'
import type { ReservationBackendStatus, ReservationUpdateFields } from '@/components/organisms/reservation-slide-over'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { resolveScheduleForDate } from '@canchero/backend'
import type { DaySchedule, ScheduleVersion } from '@canchero/backend'

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_MINUTES        = 30
const SLOT_HEIGHT         = 40    // px per 30-min slot
const COURT_HEADER_HEIGHT = 44    // px
const TIME_AXIS_WIDTH     = 64    // px

// ─── Helpers ──────────────────────────────────────────────────────────────────

// When a schedule starts in the evening (dayStart >= 12) and a time hour is
// before the start and clearly early morning (< 12), it belongs to the next
// calendar day — represent it as hour + 24 so grid arithmetic stays linear.
function toVirtualHour(h: number, dayStart: number): number {
  return dayStart >= 12 && h < dayStart && h < 12 ? h + 24 : h
}

function parseMins(time: string, dayStart = 0): number {
  const [h, m] = time.split(':').map(Number)
  return toVirtualHour(h, dayStart) * 60 + m
}

function timeToRowStart(time: string, dayStart: number): number {
  const [h, m] = time.split(':').map(Number)
  const vh = toVirtualHour(h, dayStart)
  return 2 + (vh - dayStart) * 2 + Math.floor(m / SLOT_MINUTES)
}

function generateTimeLabels(dayStart: number, dayEnd: number): string[] {
  const labels: string[] = []
  for (let h = dayStart; h < dayEnd; h++) {
    const d = h % 24
    labels.push(`${String(d).padStart(2, '0')}:00`)
    labels.push(`${String(d).padStart(2, '0')}:30`)
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
  schedule:                  DaySchedule[]
  scheduleHistory:           ScheduleVersion[]
  selectedDate:              Date
  scheduleOverrideNeeded?:   boolean
  onExtendConfirmOverride?:  () => void
  onExtendCancelOverride?:   () => void
  onSlotClick?:              (courtId: string, time: string) => void
  onUpdateStatus?:           (reservationId: string, status: ReservationBackendStatus, paymentMethod?: 'cash' | 'online', amount?: number) => void
  onExtend?:                 (reservationId: string, minutes: 30 | 60) => void
  onUpdate?:                 (reservationId: string, fields: ReservationUpdateFields) => void
  onDelete?:                 (reservationId: string) => void
  mockNow?:                  Date
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarDayView({ courts, reservations, schedule, scheduleHistory, selectedDate, scheduleOverrideNeeded, onExtendConfirmOverride, onExtendCancelOverride, onSlotClick, onUpdateStatus, onExtend, onUpdate, onDelete, mockNow }: CalendarDayViewProps) {
  const t = useTheme()

  const scrollRef = useRef<HTMLDivElement>(null)

  const [realNow,     setRealNow]     = useState(() => new Date())
  const [selected,    setSelected]    = useState<CalendarReservation | null>(null)
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

  const { DAY_START, DAY_END } = useMemo(() => {
    const entry = scheduleForDate.find((s) => s.dayOfWeek === dayOfWeek && s.active)
    const rawStart = entry ? Number(entry.openTime.split(':')[0]) : 9
    let start = rawStart
    let end   = entry
      ? (() => {
          const [ch, cm] = entry.closeTime.split(':').map(Number)
          const closeHour = cm > 0 ? ch + 1 : ch
          // Midnight-crossing: close hour is "before" open → add 24
          return closeHour <= rawStart ? closeHour + 24 : closeHour
        })()
      : 24

    // Extend bounds to cover reservations that fall outside the configured schedule
    for (const r of reservations) {
      const [sh]     = r.startTime.split(':').map(Number)
      const [eh, em] = r.endTime.split(':').map(Number)
      const vsh = toVirtualHour(sh, rawStart)
      const veh = toVirtualHour(eh, rawStart)
      start = Math.min(start, vsh)
      end   = Math.max(end, em > 0 ? veh + 1 : veh)
    }

    return { DAY_START: start, DAY_END: end }
  }, [scheduleForDate, dayOfWeek, reservations])

  const isInactiveDay = useMemo(() => {
    const entry = scheduleForDate.find((s) => s.dayOfWeek === dayOfWeek)
    return entry !== undefined && !entry.active
  }, [scheduleForDate, dayOfWeek])

  const TOTAL_SLOTS = (DAY_END - DAY_START) * 2

  const TIME_LABELS = useMemo(
    () => generateTimeLabels(DAY_START, DAY_END),
    [DAY_START, DAY_END],
  )

  // ── Argentina timezone helpers ──────────────────────────────────────────────
  const { hours: nowH, minutes: nowM } = useMemo(() => getArgentinaTime(now), [now])

  // Auto-scroll to current time on mount
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const { hours: scrollH, minutes: scrollM } = getArgentinaTime(now)
    const vScrollH = toVirtualHour(scrollH, DAY_START)
    const minutesFromStart = (vScrollH - DAY_START) * 60 + scrollM
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
  const nowVH        = toVirtualHour(nowH, DAY_START)
  const nowTotalMins = nowVH * 60 + nowM
  const effectiveReservations = reservations.map((r) => {
    if (nowTotalMins > parseMins(r.endTime, DAY_START) && (r.state === 'señado' || r.state === 'en-cancha')) {
      return { ...r, state: 'jugado' as const }
    }
    if (nowTotalMins >= parseMins(r.startTime, DAY_START) && nowTotalMins < parseMins(r.endTime, DAY_START) && r.state === 'señado') {
      return { ...r, state: 'en-cancha' as const }
    }
    return r
  })

  // ── Current time line ───────────────────────────────────────────────────────
  const withinDay   = nowVH >= DAY_START && nowVH < DAY_END
  const nowSlotIdx  = withinDay ? Math.floor(((nowVH - DAY_START) * 60 + nowM) / SLOT_MINUTES) : -1
  const nowFraction = withinDay ? ((nowVH - DAY_START) * 60 + nowM) % SLOT_MINUTES / SLOT_MINUTES : 0
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

  // ── Inactive day empty state ────────────────────────────────────────────────
  if (isInactiveDay) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: C.textMuted }}>Sin actividad este día</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Override warning banner ───────────────────────────────────────────── */}
      {scheduleOverrideNeeded && (
        <div style={{
          padding:         '10px 16px',
          backgroundColor: 'oklch(94% 0.04 42)',
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          gap:             12,
          flexShrink:      0,
        }}>
          <span style={{ fontSize: 13, color: 'oklch(40% 0.12 42)', lineHeight: 1.4 }}>
            Esta extensión supera el horario de cierre. ¿Confirmás de todas formas?
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={onExtendCancelOverride}
              style={{
                padding:         '5px 12px',
                borderRadius:    6,
                border:          '1px solid oklch(75% 0.06 42)',
                backgroundColor: 'transparent',
                cursor:          'pointer',
                fontSize:        12,
                fontWeight:      500,
                color:           'oklch(45% 0.10 42)',
                lineHeight:      1,
                fontFamily:      'inherit',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onExtendConfirmOverride}
              style={{
                padding:         '5px 12px',
                borderRadius:    6,
                border:          'none',
                backgroundColor: 'oklch(70% 0.12 42)',
                cursor:          'pointer',
                fontSize:        12,
                fontWeight:      500,
                color:           'oklch(98% 0.004 42)',
                lineHeight:      1,
                fontFamily:      'inherit',
              }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

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
                      onClick={() => onSlotClick?.(court.id, TIME_LABELS[rowIdx])}
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
            const courtIdx   = courts.findIndex((c) => c.id === res.courtId)
            if (courtIdx === -1) return null

            const rowStart   = timeToRowStart(res.startTime, DAY_START)
            const rowEnd     = timeToRowStart(res.endTime, DAY_START)
            const slotCount  = rowEnd - rowStart

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
                  onClick={() => setSelected(res)}
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
        onClose={() => setSelected(null)}
        onUpdateStatus={onUpdateStatus}
        onExtend={onExtend}
        onUpdate={onUpdate}
        onDelete={onDelete}
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
