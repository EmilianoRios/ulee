'use client'

import { useMemo } from 'react'
import { useTheme } from 'tamagui'
import { resolveScheduleForDate } from '@canchero/backend'
import type { DaySchedule, ScheduleVersion } from '@canchero/backend'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { getMonthGrid, isSameDay } from '@/lib/calendar-utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CalendarMonthViewProps {
  byDate:          Record<string, CalendarReservation[]>
  viewYear:        number
  viewMonth:       number
  selectedDate:    Date
  schedule:        DaySchedule[]
  scheduleHistory: ScheduleVersion[]
  holidays:        { date: string; reason: string }[]
  onDayClick:      (date: Date) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function dateToIso(d: Date): string {
  const y  = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${dd}`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarMonthView({
  byDate,
  viewYear,
  viewMonth,
  selectedDate: _selectedDate,
  schedule,
  scheduleHistory,
  holidays,
  onDayClick,
}: CalendarMonthViewProps) {
  const t = useTheme()
  const today = useMemo(() => new Date(), [])

  const weeks = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  )

  const C = {
    bg:          t.superficieContenido.val,
    bgInactive:  'oklch(96% 0.004 240)',
    bgToday:     t.verdeCanchaActivo.val,
    bgOutside:   t.superficie.val,
    border:      t.bordeNeutral.val,
    divider:     t.divisor.val,
    textPrimary: t.textoPrimario.val,
    textInact:   t.textoInactivo.val,
    todayText:   t.verdeCanchaProfundo.val,
    badgeBg:     t.verdeCancha.val,
    badgeText:   'oklch(98% 0.004 155)',
  } as const

  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      height:          '100%',
      overflow:        'hidden',
      backgroundColor: C.bg,
    }}>

      {/* ── Day-of-week header row ─────────────────────────────────────────── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom:        `1px solid ${C.border}`,
        flexShrink:          0,
      }}>
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            style={{
              padding:       '10px 0',
              textAlign:     'center',
              fontSize:      11,
              fontWeight:    600,
              color:         C.textInact,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              userSelect:    'none',
            }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* ── Month grid ────────────────────────────────────────────────────── */}
      <div style={{
        flex:                1,
        display:             'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridTemplateRows:    `repeat(${weeks.length}, 1fr)`,
        overflow:            'hidden',
      }}>
        {weeks.flatMap((week, weekIdx) =>
          week.map((date, dayIdx) => {
            const isCurrentMonth = date.getMonth() === viewMonth
            const dateStr        = dateToIso(date)
            const isToday        = isSameDay(date, today)
            const count          = byDate[dateStr]?.length ?? 0
            const holiday        = holidays.find((h) => h.date === dateStr) ?? null

            let isInactive = false
            if (isCurrentMonth) {
              const dayOfWeek   = date.getDay() === 0 ? 7 : date.getDay()
              const daySchedule = resolveScheduleForDate(scheduleHistory, schedule, dateStr)
              const entry       = daySchedule.find((s) => s.dayOfWeek === dayOfWeek)
              isInactive        = entry !== undefined && !entry.active
            }

            const isLastRow = weekIdx === weeks.length - 1
            const isLastCol = dayIdx === 6

            let cellBg = C.bg
            if (!isCurrentMonth) cellBg = C.bgOutside
            else if (isToday)    cellBg = C.bgToday
            else if (isInactive) cellBg = C.bgInactive

            return (
              <div
                key={dateStr}
                role={isCurrentMonth ? 'button' : undefined}
                tabIndex={isCurrentMonth ? 0 : undefined}
                onClick={isCurrentMonth ? () => onDayClick(date) : undefined}
                onKeyDown={isCurrentMonth
                  ? (e) => { if (e.key === 'Enter' || e.key === ' ') onDayClick(date) }
                  : undefined
                }
                style={{
                  position:        'relative',
                  padding:         '8px',
                  borderRight:     !isLastCol ? `1px solid ${C.divider}` : 'none',
                  borderBottom:    !isLastRow ? `1px solid ${C.divider}` : 'none',
                  backgroundColor: cellBg,
                  cursor:          isCurrentMonth ? 'pointer' : 'default',
                  overflow:        'hidden',
                  minHeight:       0,
                  userSelect:      'none',
                }}
                onMouseEnter={isCurrentMonth && !isToday ? (e) => {
                  ;(e.currentTarget as HTMLDivElement).style.backgroundColor = t.fondoHover.val
                } : undefined}
                onMouseLeave={isCurrentMonth && !isToday ? (e) => {
                  ;(e.currentTarget as HTMLDivElement).style.backgroundColor = cellBg
                } : undefined}
              >
                {/* Day number */}
                <span style={{
                  fontSize:   13,
                  fontWeight: isToday && isCurrentMonth ? 700 : 400,
                  color:      !isCurrentMonth
                    ? C.textInact
                    : isToday
                      ? C.todayText
                      : C.textPrimary,
                  lineHeight: 1,
                  display:    'block',
                }}>
                  {date.getDate()}
                </span>

                {/* Reservation count badge */}
                {isCurrentMonth && count > 0 && (
                  <span style={{
                    position:        'absolute',
                    top:             6,
                    right:           6,
                    minWidth:        18,
                    height:          18,
                    borderRadius:    9,
                    backgroundColor: C.badgeBg,
                    color:           C.badgeText,
                    fontSize:        10,
                    fontWeight:      600,
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    padding:         '0 4px',
                    lineHeight:      1,
                    userSelect:      'none',
                  }}>
                    {count}
                  </span>
                )}

                {/* Holiday dot */}
                {isCurrentMonth && holiday !== null && (
                  <span
                    title={holiday.reason}
                    style={{
                      display:         'block',
                      marginTop:       4,
                      width:           6,
                      height:          6,
                      borderRadius:    '50%',
                      backgroundColor: 'oklch(60% 0.15 30)',
                    }}
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
