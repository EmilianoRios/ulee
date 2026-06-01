'use client'

import { useMemo, useState, useEffect, useRef, Fragment } from 'react'
import { useTheme } from 'tamagui'
import { resolveScheduleForDate } from '@canchero/backend'
import type { DaySchedule, ScheduleVersion } from '@canchero/backend'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { ReservationSlideOver } from '@/components/organisms/reservation-slide-over'
import { computeOverlapLayout, COURT_PALETTES } from '@/lib/calendar-utils'
import type { OverlapLayout } from '@/lib/calendar-utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_MINUTES      = 30
const SLOT_HEIGHT       = 40    // px per 30-min slot
const DAY_HEADER_HEIGHT = 44    // px
const TIME_AXIS_WIDTH   = 64    // px
const MIN_DAY_COL_WIDTH = 160   // px

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function dateToIso(d: Date): string {
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${dd}`
}

function getArgentinaDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

function getArgentinaTime(date: Date): { hours: number; minutes: number } {
  const str = date.toLocaleString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour12:   false,
    hour:     '2-digit',
    minute:   '2-digit',
  })
  const [h, m] = str.split(':').map(Number)
  return { hours: h ?? 0, minutes: m ?? 0 }
}

const DAY_ABBREVS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarWeekViewProps {
  courts:             Court[]
  byDate:             Record<string, CalendarReservation[]>
  spillovers:         CalendarReservation[]
  weekStart:          Date
  schedule:           DaySchedule[]
  scheduleHistory:    ScheduleVersion[]
  holidays:           { date: string; reason: string }[]
  onReservationClick: (reservation: CalendarReservation) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarWeekView({
  courts,
  byDate,
  spillovers,
  weekStart,
  schedule,
  scheduleHistory,
  holidays,
  onReservationClick,
}: CalendarWeekViewProps) {
  const t = useTheme()

  const scrollRef = useRef<HTMLDivElement>(null)

  const [realNow, setRealNow] = useState(() => new Date())
  const [selected, setSelected] = useState<CalendarReservation | null>(null)

  useEffect(() => {
    const id = setInterval(() => setRealNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // ── Build 7 day descriptors ────────────────────────────────────────────────

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr    = dateToIso(date)
      const dayOfWeek  = date.getDay() === 0 ? 7 : date.getDay() // ISO 1=Mon … 7=Sun
      const daySchedule = resolveScheduleForDate(scheduleHistory, schedule, dateStr)
      const entry      = daySchedule.find((s) => s.dayOfWeek === dayOfWeek)
      const isInactive = entry !== undefined && !entry.active
      const holiday    = holidays.find((h) => h.date === dateStr)
      const openTime   = entry?.active ? entry.openTime  : null
      const closeTime  = entry?.active ? entry.closeTime : null
      return { date, dateStr, dayOfWeek, isInactive, holiday: holiday ?? null, openTime, closeTime }
    })
  }, [weekStart, schedule, scheduleHistory, holidays])

  // ── Compute global time axis bounds (union of all active days) ─────────────

  const { DAY_START_MIN, DAY_END_MIN } = useMemo(() => {
    let startMin     = 9 * 60
    let endMin       = 24 * 60
    let hasActiveDays = false

    for (const day of weekDays) {
      if (day.openTime !== null && day.closeTime !== null) {
        if (!hasActiveDays) {
          startMin      = day.openTime
          endMin        = day.closeTime <= day.openTime ? day.closeTime + 1440 : day.closeTime
          hasActiveDays = true
        } else {
          startMin = Math.min(startMin, day.openTime)
          const close = day.closeTime <= day.openTime ? day.closeTime + 1440 : day.closeTime
          endMin   = Math.max(endMin, close)
        }
      }
    }

    for (const dayRes of Object.values(byDate)) {
      for (const r of dayRes) {
        startMin = Math.min(startMin, r.startTime)
        endMin   = Math.max(endMin,   r.endTime)
      }
    }
    for (const r of spillovers) {
      endMin = Math.max(endMin, r.endTime)
    }

    return { DAY_START_MIN: startMin, DAY_END_MIN: endMin }
  }, [weekDays, byDate, spillovers])

  const TOTAL_SLOTS = Math.ceil((DAY_END_MIN - DAY_START_MIN) / SLOT_MINUTES)

  // ── Overlap layouts per day ────────────────────────────────────────────────

  const overlapLayouts = useMemo((): Record<string, Map<string, OverlapLayout>> => {
    const out: Record<string, Map<string, OverlapLayout>> = {}
    for (const day of weekDays) {
      out[day.dateStr] = computeOverlapLayout(byDate[day.dateStr] ?? [])
    }
    return out
  }, [weekDays, byDate])

  const timeLabels = useMemo(() => {
    const labels: string[] = []
    for (let min = DAY_START_MIN; min < DAY_END_MIN; min += SLOT_MINUTES) {
      labels.push(minutesToTime(min))
    }
    return labels
  }, [DAY_START_MIN, DAY_END_MIN])

  // ── Today indicators ──────────────────────────────────────────────────────

  const todayStr     = getArgentinaDateString(realNow)
  const { hours: nowH, minutes: nowM } = getArgentinaTime(realNow)
  const nowTotalMins = nowH * 60 + nowM
  const withinToday  = nowTotalMins >= DAY_START_MIN && nowTotalMins < DAY_END_MIN
  const nowGridRow   = withinToday ? 2 + Math.floor((nowTotalMins - DAY_START_MIN) / SLOT_MINUTES) : -1
  const nowMarginTop = withinToday ? ((nowTotalMins - DAY_START_MIN) % SLOT_MINUTES / SLOT_MINUTES) * SLOT_HEIGHT : 0
  const todayColIdx  = weekDays.findIndex((d) => d.dateStr === todayStr)

  // Auto-scroll to current time on mount when today is in view
  useEffect(() => {
    const el = scrollRef.current
    if (!el || todayColIdx === -1) return
    const minutesFromStart = nowTotalMins - DAY_START_MIN
    if (minutesFromStart < 0) return
    const pixelFromStart = (minutesFromStart / SLOT_MINUTES) * SLOT_HEIGHT
    const visibleHeight  = el.clientHeight - DAY_HEADER_HEIGHT
    el.scrollTop = Math.max(0, pixelFromStart - visibleHeight * 0.25)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Token shortcuts ─────────────────────────────────────────────────────────

  const C = {
    bg:           t.superficieContenido.val,
    border:       t.bordeNeutral.val,
    divider:      t.divisor.val,
    textPrimary:  t.textoPrimario.val,
    textMuted:    t.textoMuted.val,
    textInact:    t.textoInactivo.val,
    green:        t.verdeCancha.val,
    inactiveBg:   'oklch(96% 0.004 240)',
    todayHeader:  t.verdeCanchaActivo.val,
    todayText:    t.verdeCanchaProfundo.val,
  } as const

  // ── Grid template ──────────────────────────────────────────────────────────

  const gridCols = `${TIME_AXIS_WIDTH}px repeat(7, minmax(${MIN_DAY_COL_WIDTH}px, 1fr))`
  const gridRows = `${DAY_HEADER_HEIGHT}px repeat(${TOTAL_SLOTS}, ${SLOT_HEIGHT}px)`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Scroll container (both vertical + horizontal) ─────────────────── */}
      <div
        ref={scrollRef}
        className="calendar-scroll"
        style={{ flex: 1, overflow: 'auto', backgroundColor: C.bg }}
      >
        {/* ── CSS Grid ──────────────────────────────────────────────────── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: gridCols,
            gridTemplateRows:    gridRows,
            minWidth:            `${TIME_AXIS_WIDTH + MIN_DAY_COL_WIDTH * 7}px`,
          }}
        >

          {/* ── Corner cell (sticky top-left) ────────────────────────────── */}
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

          {/* ── Day header cells ─────────────────────────────────────────── */}
          {weekDays.map((day, colIdx) => {
            const isToday = day.dateStr === todayStr
            const abbrev  = DAY_ABBREVS[colIdx] ?? ''
            const dayNum  = day.date.getDate()
            return (
              <div
                key={`hdr-${day.dateStr}`}
                style={{
                  gridRow:         1,
                  gridColumn:      colIdx + 2,
                  position:        'sticky',
                  top:             0,
                  zIndex:          10,
                  backgroundColor: isToday ? C.todayHeader : day.isInactive ? C.inactiveBg : C.bg,
                  borderBottom:    `1px solid ${C.border}`,
                  borderRight:     colIdx < 6 ? `1px solid ${C.divider}` : 'none',
                  display:         'flex',
                  flexDirection:   'column',
                  alignItems:      'center',
                  justifyContent:  'center',
                  gap:             3,
                  padding:         '6px 8px',
                }}
              >
                <span style={{
                  fontSize:      11,
                  fontWeight:    600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color:         isToday ? C.todayText : C.textInact,
                  lineHeight:    1,
                  userSelect:    'none',
                }}>
                  {abbrev}
                </span>
                <span style={{
                  fontSize:   16,
                  fontWeight: isToday ? 700 : 400,
                  color:      isToday ? C.todayText : C.textPrimary,
                  lineHeight: 1,
                  userSelect: 'none',
                }}>
                  {dayNum}
                </span>
                {day.holiday !== null && (
                  <span
                    title={day.holiday.reason}
                    style={{
                      fontSize:        9,
                      fontWeight:      500,
                      color:           'oklch(46% 0.15 30)',
                      backgroundColor: 'oklch(94% 0.05 30)',
                      borderRadius:    3,
                      padding:         '1px 4px',
                      lineHeight:      1.4,
                      userSelect:      'none',
                      maxWidth:        '100%',
                      overflow:        'hidden',
                      textOverflow:    'ellipsis',
                      whiteSpace:      'nowrap',
                    }}>
                    Feriado
                  </span>
                )}
              </div>
            )
          })}

          {/* ── Time labels + slot rows ───────────────────────────────────── */}
          {timeLabels.map((label, rowIdx) => {
            const showHour = label.endsWith(':00')
            const gridRow  = rowIdx + 2

            return (
              <Fragment key={rowIdx}>
                {/* Time label (sticky left) */}
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
                      fontSize:           11,
                      fontWeight:         500,
                      color:              C.textMuted,
                      lineHeight:         1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {label}
                    </span>
                  )}
                </div>

                {/* Day slot cells — no click handler (read-only, spec FR-18) */}
                {weekDays.map((day, colIdx) => (
                  <div
                    key={`slot-${rowIdx}-${colIdx}`}
                    style={{
                      gridRow,
                      gridColumn:      colIdx + 2,
                      borderRight:     colIdx < 6 ? `1px solid ${C.divider}` : 'none',
                      borderBottom:    `1px solid ${showHour ? C.border : C.divider}`,
                      position:        'relative',
                      backgroundColor: day.isInactive ? C.inactiveBg : 'transparent',
                    }}
                  />
                ))}
              </Fragment>
            )
          })}

          {/* ── Day column overlays — one transparent layer per day ──────── */}
          {weekDays.map((day, colIdx) => {
            const dayRes = byDate[day.dateStr] ?? []
            if (dayRes.length === 0) return null
            const layouts = overlapLayouts[day.dateStr] ?? new Map<string, OverlapLayout>()

            return (
              <div
                key={`overlay-${day.dateStr}`}
                style={{
                  gridRow:       `2 / ${2 + TOTAL_SLOTS}`,
                  gridColumn:    colIdx + 2,
                  position:      'relative',
                  pointerEvents: 'none',
                  zIndex:        2,
                }}
              >
                {dayRes.map((res) => {
                  const layout   = layouts.get(res.id) ?? { leftFraction: 0, widthFraction: 1 }
                  const topPx    = Math.max(0, (res.startTime - DAY_START_MIN) / SLOT_MINUTES * SLOT_HEIGHT)
                  const endBound = Math.min(res.endTime, DAY_END_MIN)
                  const heightPx = Math.max(SLOT_HEIGHT / 2, (endBound - res.startTime) / SLOT_MINUTES * SLOT_HEIGHT)

                  const courtIdx = courts.findIndex((c) => c.id === res.courtId)
                  const court    = courts[courtIdx]

                  return (
                    <WeekPill
                      key={res.id}
                      reservation={res}
                      courtName={court?.name ?? ''}
                      courtIdx={courtIdx >= 0 ? courtIdx : 0}
                      topPx={topPx}
                      heightPx={heightPx}
                      leftFraction={layout.leftFraction}
                      widthFraction={layout.widthFraction}
                      onClick={() => {
                        setSelected(res)
                        onReservationClick(res)
                      }}
                    />
                  )
                })}
              </div>
            )
          })}

          {/* ── Spillover pills — top of Monday column (col 2) ───────────── */}
          {spillovers.map((res) => {
            const slotCount = Math.ceil((res.endTime - DAY_START_MIN) / SLOT_MINUTES)
            if (slotCount <= 0) return null

            const courtIdx = courts.findIndex((c) => c.id === res.courtId)
            const court    = courts[courtIdx]

            return (
              <div
                key={`spillover-${res.id}`}
                style={{
                  gridRow:       `2 / ${2 + slotCount}`,
                  gridColumn:    2,
                  position:      'relative',
                  zIndex:        1,
                  opacity:       0.4,
                  pointerEvents: 'none',
                }}
              >
                <WeekPill
                  reservation={res}
                  courtName={court?.name ?? ''}
                  courtIdx={courtIdx >= 0 ? courtIdx : 0}
                  topPx={0}
                  heightPx={slotCount * SLOT_HEIGHT}
                  leftFraction={0}
                  widthFraction={1}
                  onClick={() => {}}
                />
              </div>
            )
          })}

          {/* ── Current time indicator — only in today's column ───────────── */}
          {todayColIdx !== -1 && withinToday && (
            <div
              aria-hidden="true"
              style={{
                gridRow:         nowGridRow,
                gridColumn:      todayColIdx + 2,
                alignSelf:       'start',
                marginTop:       nowMarginTop,
                height:          2,
                backgroundColor: C.green,
                opacity:         0.8,
                zIndex:          3,
                pointerEvents:   'none',
                position:        'relative',
              }}
            >
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

      {/* ── Slide-over ──────────────────────────────────────────────────────── */}
      <ReservationSlideOver
        reservation={selected}
        courts={courts}
        reservations={Object.values(byDate).flat()}
        now={realNow}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}

// ─── WeekPill ─────────────────────────────────────────────────────────────────

interface WeekPillProps {
  reservation:   CalendarReservation
  courtName:     string
  courtIdx:      number
  topPx:         number
  heightPx:      number
  leftFraction:  number
  widthFraction: number
  onClick:       () => void
}

function WeekPill({
  reservation, courtName, courtIdx,
  topPx, heightPx, leftFraction, widthFraction,
  onClick,
}: WeekPillProps) {
  // Approximate pixel width for content-density decisions.
  // Actual width may be wider on large screens; this uses the minimum column width
  // so we never show more than what fits at the narrowest expected size.
  const estimatedWidthPx = widthFraction * MIN_DAY_COL_WIDTH
  const isTall           = heightPx >= 60
  const isNarrow         = estimatedWidthPx < 64
  const isVeryNarrow     = estimatedWidthPx < 44

  const palette   = COURT_PALETTES[courtIdx % COURT_PALETTES.length]!
  const endMins   = reservation.endTime > 1440 ? reservation.endTime - 1440 : reservation.endTime
  const timeRange = `${minutesToTime(reservation.startTime)}–${minutesToTime(endMins)}`

  // Native tooltip with full info for very narrow pills where text isn't visible
  const tooltipText = isVeryNarrow
    ? `${reservation.clientName} · ${timeRange}${courtName ? ` · ${courtName}` : ''}`
    : undefined

  return (
    <div
      role="button"
      tabIndex={0}
      title={tooltipText}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        position:        'absolute',
        top:             topPx + 2,
        height:          heightPx - 4,
        left:            `calc(${leftFraction * 100}% + 2px)`,
        width:           `calc(${widthFraction * 100}% - 4px)`,
        minWidth:        24,
        backgroundColor: palette.bg,
        border:          `1.5px solid ${palette.border}`,
        borderRadius:    5,
        padding:         isVeryNarrow ? '2px' : isNarrow ? '3px 4px' : isTall ? '6px 8px' : '3px 6px',
        cursor:          'pointer',
        overflow:        'hidden',
        display:         'flex',
        flexDirection:   'column',
        gap:             2,
        pointerEvents:   'auto',
        boxSizing:       'border-box',
      }}
    >
      {!isVeryNarrow && (
        <span style={{
          fontSize:     11,
          fontWeight:   600,
          color:        palette.text,
          lineHeight:   1.2,
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          userSelect:   'none',
        }}>
          {reservation.clientName}
        </span>
      )}
      {!isNarrow && (
        <span style={{
          fontSize:           10,
          color:              palette.text,
          opacity:            0.75,
          lineHeight:         1.2,
          userSelect:         'none',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace:         'nowrap',
          overflow:           'hidden',
          textOverflow:       'ellipsis',
        }}>
          {timeRange}
        </span>
      )}
      {!isNarrow && isTall && courtName && (
        <span style={{
          fontSize:     10,
          color:        palette.text,
          opacity:      0.65,
          lineHeight:   1.2,
          userSelect:   'none',
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {courtName}
        </span>
      )}
    </div>
  )
}
