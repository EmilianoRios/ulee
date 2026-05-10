'use client'

import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useTheme } from 'tamagui'

import { CalendarDayView }  from '@/components/organisms/calendar-day-view'
import { CalendarHeader }   from '@/components/molecules/calendar-header'
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
  { id: '10', clientName: 'Nicolás García',                            startTime: '21:00', endTime: '22:30', state: 'señado',   amount: 5400, courtId: '2' },
]

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

  const action = (
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
  )

  const strip = (
    <CalendarHeader
      currentDate={currentDate}
      viewMode={viewMode}
      onPrevDay={prevDay}
      onNextDay={nextDay}
      onToday={goToday}
      onViewModeChange={setViewMode}
      action={action}
    />
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
