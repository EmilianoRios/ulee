'use client'

import { useTheme } from 'tamagui'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CalendarViewMode = 'dia' | 'semana' | 'mes'

interface CalendarHeaderProps {
  currentDate: Date
  viewMode: CalendarViewMode
  onPrevDay: () => void
  onNextDay: () => void
  onToday: () => void
  onViewModeChange: (mode: CalendarViewMode) => void
  action?: React.ReactNode
}

const VIEW_OPTIONS: { id: CalendarViewMode; label: string }[] = [
  { id: 'dia',    label: 'Día' },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes' },
]

function formatDate(date: Date): string {
  const raw = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function NavButton({ onClick, label, children }: {
  onClick: () => void
  label: string
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
  onPrevDay,
  onNextDay,
  onToday,
  onViewModeChange,
  action,
}: CalendarHeaderProps) {
  const t = useTheme()
  const isToday = new Date().toDateString() === currentDate.toDateString()

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
        <NavButton onClick={onPrevDay} label="Día anterior">
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
          {formatDate(currentDate)}
        </h1>

        <NavButton onClick={onNextDay} label="Día siguiente">
          <ChevronRight size={16} strokeWidth={2} />
        </NavButton>

        {!isToday && (
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

      {/* View mode toggle */}
      <div style={{
        display:         'flex',
        backgroundColor: t.superficie.val,
        borderRadius:    8,
        padding:         3,
        gap:             2,
        border:          `1px solid ${t.bordeNeutral.val}`,
      }}>
        {VIEW_OPTIONS.map(({ id, label }) => {
          const isActive   = viewMode === id
          const isDisabled = id !== 'dia'

          return (
            <button
              key={id}
              onClick={() => !isDisabled && onViewModeChange(id)}
              style={{
                padding:         '5px 16px',
                borderRadius:    6,
                border:          'none',
                cursor:          isDisabled ? 'not-allowed' : 'pointer',
                fontSize:        13,
                fontWeight:      isActive ? 600 : 400,
                backgroundColor: isActive ? t.superficieContenido.val : 'transparent',
                color:           isActive ? t.textoPrimario.val : t.textoInactivo.val,
                opacity:         isDisabled ? 0.45 : 1,
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
