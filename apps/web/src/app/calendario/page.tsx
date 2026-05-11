'use client'

import { useState, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from 'tamagui'

import { CalendarDayView }  from '@/components/organisms/calendar-day-view'
import { ModuleLayout }     from '@/components/templates/module-layout'
import type { CalendarViewMode } from '@/components/molecules/calendar-header'
import type { Court, CalendarReservation } from '@/components/atoms/reservation-card'

// ─── Mock data ────────────────────────────────────────────────────────────────

const COURTS: Court[] = [
  { id: '1', name: 'Cancha 1' },
  { id: '2', name: 'La Principal' },
  { id: '3', name: 'Pádel Norte' },
  { id: '4', name: 'Pádel Sur' },
]

const RESERVATIONS: CalendarReservation[] = [
  { id: '1',  clientName: 'Lucas Martínez',     phone: '11 4523-8891', startTime: '09:00', endTime: '10:30', state: 'pagado',   amount: 4500, courtId: '1' },
  { id: '2',  clientName: 'Sofía González',     phone: '11 6712-3344', startTime: '09:00', endTime: '10:00', state: 'en-cancha',amount: 3600, courtId: '2', notes: 'Viene con seña pagada desde la app.' },
  { id: '3',  clientName: 'Martín Rodríguez',                          startTime: '11:00', endTime: '12:30', state: 'señado',   amount: 5400, courtId: '1', notes: 'Llama antes de venir.' },
  { id: '4',  clientName: 'Club Deportivo Norte',phone: '11 2233-4455',startTime: '12:00', endTime: '14:00', state: 'señado',   amount: 8000, courtId: '3' },
  { id: '5',  clientName: 'Pedro Fernández',                           startTime: '09:00', endTime: '10:30', state: 'ausente',  amount: 3000, courtId: '3' },
  { id: '6',  clientName: 'Valentina López',    phone: '11 9988-7766', startTime: '14:00', endTime: '15:30', state: 'pagado',   amount: 5400, courtId: '2' },
  { id: '7',  clientName: 'Juan Méndez',                               startTime: '15:00', endTime: '16:30', state: 'señado',   amount: 4200, courtId: '4' },
  { id: '8',  clientName: 'Equipo Rivadavia',   phone: '11 1122-3344', startTime: '18:00', endTime: '20:00', state: 'señado',   amount: 9600, courtId: '1' },
  { id: '9',  clientName: 'Ana Torres',                                startTime: '20:00', endTime: '21:30', state: 'pagado',   amount: 6000, courtId: '4' },
  { id: '10', clientName: 'Nicolás García',                            startTime: '21:00', endTime: '22:30', state: 'señado',        amount: 5400, courtId: '2' },
  { id: '11', clientName: 'Limpieza y pintura',                        startTime: '16:00', endTime: '18:00', state: 'mantenimiento',  amount: 0,    courtId: '2' },
  { id: '12', clientName: 'Prof. Herrera — Clínica pádel',            startTime: '10:00', endTime: '12:00', state: 'recurrente',     amount: 7200, courtId: '4' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const LEGEND: { label: string; color: string }[] = [
  { label: 'Pagado',        color: 'oklch(90% 0.008 220)' },
  { label: 'En cancha',     color: 'oklch(68% 0.13 155)'  },
  { label: 'Señado',        color: 'oklch(78% 0.09 42)'   },
  { label: 'Ausente',       color: 'oklch(60% 0.010 224)' },
  { label: 'Mantenimiento', color: 'oklch(76% 0.13 88)'   },
  { label: 'Recurrente',    color: 'oklch(70% 0.09 275)'  },
]

const VIEW_OPTIONS: { id: CalendarViewMode; label: string }[] = [
  { id: 'dia',    label: 'Día'    },
  { id: 'semana', label: 'Semana' },
  { id: 'mes',    label: 'Mes'    },
]

function formatHeaderDate(date: Date): string {
  const raw = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

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

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode,    setViewMode]    = useState<CalendarViewMode>('dia')

  const prevDay = useCallback(() => {
    setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n })
  }, [])
  const nextDay = useCallback(() => {
    setCurrentDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n })
  }, [])
  const goToday = useCallback(() => setCurrentDate(new Date()), [])

  const isToday = new Date().toDateString() === currentDate.toDateString()

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
    <div style={{
      height:          56,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 32px',
      backgroundColor: t.cabeceraOscura.val,
    }}>

      {/* Left: title + date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          onClick={prevDay}
          aria-label="Día anterior"
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
          minWidth:      248,
          textAlign:     'center',
        }}>
          {formatHeaderDate(currentDate)}
        </span>

        <button
          onClick={nextDay}
          aria-label="Día siguiente"
          style={navBtn}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = D.hover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <ChevronRight size={15} strokeWidth={2} />
        </button>

        {!isToday && (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            const isActive   = viewMode === id
            const isDisabled = id !== 'dia'
            return (
              <button
                key={id}
                onClick={() => !isDisabled && setViewMode(id)}
                style={{
                  padding:         '5px 14px',
                  borderRadius:    6,
                  border:          'none',
                  cursor:          isDisabled ? 'not-allowed' : 'pointer',
                  fontSize:        12,
                  fontWeight:      isActive ? 600 : 400,
                  backgroundColor: isActive ? D.toggleOn : 'transparent',
                  color:           isActive ? D.text : D.toggleOff,
                  opacity:         isDisabled && !isActive ? 0.4 : 1,
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

    {/* Info strip: state legend on light background */}
    <div style={{
      height:       36,
      display:      'flex',
      alignItems:   'center',
      padding:      '0 32px',
      borderBottom: `1px solid ${t.divisor.val}`,
      gap:          20,
    }}>
      {LEGEND.map(({ label, color }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>{label}</span>
        </span>
      ))}
    </div>
    </>
  )

  return (
    <ModuleLayout strip={strip}>
      <div style={{
        height:        '100%',
        padding:       '12px 32px',
        boxSizing:     'border-box',
        display:       'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          flex:         1,
          minHeight:    0,
          borderRadius: 7,
          border:       `1px solid ${t.bordeNeutral.val}`,
          overflow:     'hidden',
        }}>
          <CalendarDayView courts={COURTS} reservations={RESERVATIONS} />
        </div>
      </div>
    </ModuleLayout>
  )
}
