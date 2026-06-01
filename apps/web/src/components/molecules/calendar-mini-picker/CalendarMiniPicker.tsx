'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { getMonthGrid, isSameDay } from '../../../lib/calendar-utils'

const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

interface CalendarMiniPickerProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

const D = {
  bg:          'oklch(22% 0.024 228)',
  border:      'oklch(35% 0.018 228)',
  text:        'oklch(97% 0.006 220)',
  textMuted:   'oklch(42% 0.012 228)',
  textDim:     'oklch(32% 0.016 228)',
  hover:       'oklch(30% 0.020 228)',
  verde:       'oklch(50% 0.18 155)',
  verdeText:   'oklch(98% 0.004 155)',
} as const

export function CalendarMiniPicker({ selectedDate, onSelectDate }: CalendarMiniPickerProps) {
  const today = new Date()

  const [collapsed,  setCollapsed]  = useLocalStorage('canchero:calendarPickerCollapsed', false)
  const [viewYear,   setViewYear]   = useState(selectedDate.getFullYear())
  const [viewMonth,  setViewMonth]  = useState(selectedDate.getMonth())

  const selYear  = selectedDate.getFullYear()
  const selMonth = selectedDate.getMonth()

  useEffect(() => {
    setViewYear(selYear)
    setViewMonth(selMonth)
  }, [selYear, selMonth])

  const weeks = getMonthGrid(viewYear, viewMonth)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }

  const navBtnBase: React.CSSProperties = {
    width:           24,
    height:          24,
    borderRadius:    5,
    border:          'none',
    backgroundColor: 'transparent',
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    color:           D.textMuted,
    padding:         0,
    flexShrink:      0,
    transition:      'background-color 100ms ease-out',
  }

  const panelToggleBtn: React.CSSProperties = {
    ...navBtnBase,
    width:           26,
    height:          26,
    color:           D.textMuted,
    marginLeft:      4,
  }

  const expandToggleBtn: React.CSSProperties = {
    width:           30,
    height:          30,
    borderRadius:    7,
    border:          `1px solid ${D.border}`,
    backgroundColor: D.hover,
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    color:           D.text,
    padding:         0,
    flexShrink:      0,
    transition:      'background-color 100ms ease-out',
  }

  // ── Collapsed view ───────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div style={{
        width:           36,
        flexShrink:      0,
        borderRight:     `1px solid ${D.border}`,
        backgroundColor: D.bg,
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        paddingTop:      18,
        transition:      'width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expandir selector de fecha"
          style={expandToggleBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'oklch(36% 0.022 228)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover }}
        >
          <PanelLeftOpen size={14} strokeWidth={2} />
        </button>
      </div>
    )
  }

  // ── Expanded view ────────────────────────────────────────────────────────────
  return (
    <div style={{
      width:           220,
      flexShrink:      0,
      borderRight:     `1px solid ${D.border}`,
      backgroundColor: D.bg,
      padding:         '20px 14px',
      display:         'flex',
      flexDirection:   'column',
      gap:             14,
      transition:      'width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
    }}>

      {/* Month header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={prevMonth}
          aria-label="Mes anterior"
          style={navBtnBase}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <ChevronLeft size={14} strokeWidth={2} />
        </button>

        <span style={{
          flex:          1,
          textAlign:     'center',
          fontSize:      13,
          fontWeight:    600,
          color:         D.text,
          letterSpacing: '-0.01em',
          userSelect:    'none',
        }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          aria-label="Mes siguiente"
          style={navBtnBase}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <ChevronRight size={14} strokeWidth={2} />
        </button>

        <div style={{ width: 1, height: 14, backgroundColor: D.border, flexShrink: 0 }} />

        <button
          onClick={() => setCollapsed(true)}
          aria-label="Colapsar selector de fecha"
          style={panelToggleBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover; (e.currentTarget as HTMLButtonElement).style.color = D.text }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = D.textMuted }}
        >
          <PanelLeftClose size={14} strokeWidth={2} />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            style={{
              textAlign:     'center',
              fontSize:      11,
              fontWeight:    500,
              color:         D.textMuted,
              letterSpacing: '0.02em',
              paddingBottom: 6,
              userSelect:    'none',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {weeks.map((week, wi) => (
          <div
            key={wi}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}
          >
            {week.map((date, di) => {
              const isCurrentMonth = date.getMonth() === viewMonth
              const isSelected     = isSameDay(date, selectedDate)
              const isToday        = isSameDay(date, today)

              const bgColor: string    = isSelected ? D.verde : 'transparent'
              const textColor: string  = isSelected
                ? D.verdeText
                : isToday
                  ? D.verde
                  : isCurrentMonth
                    ? D.text
                    : D.textDim
              const weight             = isSelected || isToday ? 600 : 400

              return (
                <button
                  key={di}
                  onClick={() => onSelectDate(date)}
                  aria-label={date.toLocaleDateString('es-AR', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                  aria-pressed={isSelected}
                  style={{
                    height:          28,
                    borderRadius:    7,
                    border:          'none',
                    backgroundColor: bgColor,
                    color:           textColor,
                    fontSize:        12,
                    fontWeight:      weight,
                    cursor:          'pointer',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    fontFamily:      'inherit',
                    transition:      'background-color 100ms ease-out',
                    padding:         0,
                    userSelect:      'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>
        ))}
      </div>

    </div>
  )
}
