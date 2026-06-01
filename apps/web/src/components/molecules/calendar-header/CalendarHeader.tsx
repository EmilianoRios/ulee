'use client'

import { useTheme } from 'tamagui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CalendarViewMode = 'dia' | 'semana' | 'mes'

interface CalendarHeaderProps {
  currentDate:      Date
  viewMode:         CalendarViewMode
  onPrev:           () => void
  onNext:           () => void
  onToday:          () => void
  isHoyVisible:     boolean
  onViewModeChange: (mode: CalendarViewMode) => void
  action?:          React.ReactNode
}

const VIEW_OPTIONS: { id: CalendarViewMode; label: string }[] = [
  { id: 'dia',    label: 'Día' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes' },
]

const MONTH_NAMES_CAP = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MONTH_ABBREVS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function getMondayOfWeek(d: Date): Date {
  const dow = d.getDay() === 0 ? 7 : d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - (dow - 1))
  return mon
}

function formatDateLabel(date: Date, viewMode: CalendarViewMode): string {
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

function NavButton({ onClick, label, children }: {
  onClick:  () => void
  label:    string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width:           32,
        height:          32,
        borderRadius:    6,
        border:          `1px solid ${t.bordeNeutral.val}`,
        backgroundColor: 'transparent',
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        color:           t.textoMuted.val,
        flexShrink:      0,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
    >
      {children}
    </button>
  )
}

export function CalendarHeader({
  currentDate,
  viewMode,
  onPrev,
  onNext,
  onToday,
  isHoyVisible,
  onViewModeChange,
  action,
}: CalendarHeaderProps) {
  const t = useTheme()

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 32px',
      height:         56,
      flexShrink:     0,
    }}>

      {/* Date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <NavButton onClick={onPrev} label={prevLabel(viewMode)}>
          <ChevronLeft size={16} strokeWidth={2} />
        </NavButton>

        <h1 style={{
          margin:        0,
          fontSize:      18,
          fontWeight:    600,
          color:         t.textoNav.val,
          letterSpacing: '-0.01em',
          lineHeight:    1.2,
          userSelect:    'none',
          minWidth:      260,
        }}>
          {formatDateLabel(currentDate, viewMode)}
        </h1>

        <NavButton onClick={onNext} label={nextLabel(viewMode)}>
          <ChevronRight size={16} strokeWidth={2} />
        </NavButton>

        {isHoyVisible && (
          <button
            onClick={onToday}
            style={{
              padding:         '6px 14px',
              borderRadius:    6,
              border:          `1px solid ${t.bordeNeutral.val}`,
              backgroundColor: 'transparent',
              cursor:          'pointer',
              fontSize:        13,
              fontWeight:      500,
              color:           t.textoMuted.val,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            Hoy
          </button>
        )}
      </div>

      {/* Action + View mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {action}

        <div style={{
          display:         'flex',
          backgroundColor: t.superficie.val,
          borderRadius:    8,
          padding:         3,
          gap:             2,
          border:          `1px solid ${t.bordeNeutral.val}`,
        }}>
          {VIEW_OPTIONS.map(({ id, label }) => {
            const isActive = viewMode === id
            return (
              <button
                key={id}
                onClick={() => onViewModeChange(id)}
                style={{
                  padding:         '5px 16px',
                  borderRadius:    6,
                  border:          'none',
                  cursor:          'pointer',
                  fontSize:        13,
                  fontWeight:      isActive ? 600 : 400,
                  backgroundColor: isActive ? t.superficieContenido.val : 'transparent',
                  color:           isActive ? t.textoPrimario.val : t.textoInactivo.val,
                  boxShadow:       isActive ? '0 1px 3px oklch(0% 0 0 / 0.07)' : 'none',
                  transition:      'background-color 120ms ease-out',
                  userSelect:      'none',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
