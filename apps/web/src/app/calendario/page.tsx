'use client'

import { useState, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from 'tamagui'

import { CalendarDayView }    from '@/components/organisms/calendar-day-view'
import { ModuleLayout }       from '@/components/templates/module-layout'
import { NewEntrySlideOver }  from '@/components/organisms/new-entry-slide-over'
import type { EntryType }     from '@/components/organisms/new-entry-slide-over'
import type { CalendarViewMode }           from '@/components/molecules/calendar-header'
import type { Court, CalendarReservation } from '@/components/atoms/reservation-card'

// ─── Mock data ────────────────────────────────────────────────────────────────

// Simulated current time: 12:00 noon (2026). The indicator and transitions use this.
const MOCK_NOW = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d })()

const COURTS: Court[] = [
  { id: '1', name: 'Cancha 1' },
  { id: '2', name: 'La Principal' },
  { id: '3', name: 'Pádel Norte' },
  { id: '4', name: 'Pádel Sur' },
]

function buildMockReservations(): CalendarReservation[] {
  // MOCK_NOW = 12:00. Offsets in minutes from noon.
  // -180=09:00  -120=10:00  -60=11:00  0=12:00  60=13:00  120=14:00
  //  180=15:00   240=16:00  300=17:00  360=18:00 420=19:00  480=20:00
  //  540=21:00   600=22:00  660=23:00
  const base = 12 * 60

  function t(offset: number): string {
    const m   = base + offset
    const h   = Math.floor(m / 60) % 24
    const min = m % 60
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  return [
    // ── Cancha 1 — pagado 9:00, en-cancha cruzando las 12:00, señados tarde y noche
    { id: '1',  clientName: 'Lucas Martínez',          phone: '11 4523-8891', startTime: t(-180), endTime: t(-90),  state: 'jugado',        amount: 4500, courtId: '1' },
    { id: '2',  clientName: 'Equipo Rivadavia',        phone: '11 1122-3344', startTime: t(-60),  endTime: t(60),   state: 'en-cancha',     amount: 9600, courtId: '1' },
    { id: '3',  clientName: 'Nicolás García',                                 startTime: t(120),  endTime: t(210),  state: 'pagado',        amount: 5400, courtId: '1' },
    { id: '4',  clientName: 'Familias Fernández',                             startTime: t(300),  endTime: t(390),  state: 'señado',        amount: 6000, courtId: '1' },
    { id: '5',  clientName: 'Torneo Sub-18',                                  startTime: t(540),  endTime: t(660),  state: 'señado',        amount: 7200, courtId: '1' },

    // ── La Principal — señado → auto-jugado (cobro pendiente), señado, recurrente, mantenimiento
    { id: '6',  clientName: 'Sofía González',          phone: '11 6712-3344', startTime: t(-150), endTime: t(-30),  state: 'señado',        amount: 3600, courtId: '2', notes: 'Viene con seña pagada desde la app.' },
    { id: '7',  clientName: 'Ana Torres',              phone: '11 5544-3322', startTime: t(60),   endTime: t(150),  state: 'pagado',        amount: 4800, courtId: '2' },
    { id: '8',  clientName: 'Prof. Herrera — Clínica', phone: '11 1155-2233', startTime: t(240),  endTime: t(360),  state: 'recurrente',    amount: 7200, courtId: '2' },
    { id: '9',  clientName: 'Limpieza y pintura',                             startTime: t(480),  endTime: t(570),  state: 'mantenimiento', amount: 0,    courtId: '2' },

    // ── Pádel Norte — ausente 10:00, recurrente cruzando las 12:00, señado, evento noche
    { id: '10', clientName: 'Pedro Fernández',                                startTime: t(-120), endTime: t(-60),  state: 'ausente',       amount: 3000, courtId: '3' },
    { id: '11', clientName: 'Clínica Técnica Herrera',                        startTime: t(-30),  endTime: t(90),   state: 'recurrente',    amount: 5400, courtId: '3' },
    { id: '12', clientName: 'Valentina López',         phone: '11 9988-7766', startTime: t(180),  endTime: t(300),  state: 'señado',        amount: 5400, courtId: '3' },
    { id: '13', clientName: 'Torneo Verano 2026',                             startTime: t(420),  endTime: t(570),  state: 'evento',        amount: 0,    courtId: '3', notes: 'Torneo interno. Acceso libre para socios.' },

    // ── Pádel Sur — señado → auto-jugado, en-cancha cruzando las 12:00, señados tarde y noche
    { id: '14', clientName: 'Martín Rodríguez',                               startTime: t(-180), endTime: t(-60),  state: 'señado',        amount: 4200, courtId: '4' },
    { id: '15', clientName: 'Club Deportivo Norte',    phone: '11 2233-4455', startTime: t(-60),  endTime: t(30),   state: 'en-cancha',     amount: 8000, courtId: '4' },
    { id: '16', clientName: 'Juan Méndez',                                    startTime: t(90),   endTime: t(210),  state: 'pagado',        amount: 4200, courtId: '4' },
    { id: '17', clientName: 'Constanza Ríos',                                 startTime: t(330),  endTime: t(450),  state: 'señado',        amount: 5600, courtId: '4' },
    { id: '18', clientName: 'Familia González',                               startTime: t(480),  endTime: t(630),  state: 'señado',        amount: 6800, courtId: '4' },
  ]
}

const RESERVATIONS = buildMockReservations()

function parseMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const MOCK_NOW_MINS = MOCK_NOW.getHours() * 60 + MOCK_NOW.getMinutes()

const PENDING_COBROS = RESERVATIONS.filter((r) => {
  if (r.state === 'jugado') return true
  if ((r.state === 'señado' || r.state === 'en-cancha') && MOCK_NOW_MINS > parseMins(r.endTime)) return true
  return false
}).length

// ─── Constants ────────────────────────────────────────────────────────────────

const LEGEND: { label: string; color: string }[] = [
  { label: 'Pagado',        color: 'oklch(90% 0.008 220)' },
  { label: 'En cancha',     color: 'oklch(68% 0.13 155)'  },
  { label: 'Señado',        color: 'oklch(78% 0.09 42)'   },
  { label: 'Ausente',       color: 'oklch(60% 0.010 224)' },
  { label: 'Jugado',        color: 'oklch(76% 0.018 222)' },
  { label: 'Mantenimiento', color: 'oklch(76% 0.13 88)'   },
  { label: 'Recurrente',    color: 'oklch(70% 0.09 275)'  },
  { label: 'Evento',        color: 'oklch(68% 0.10 200)'  },
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

  const [currentDate,      setCurrentDate]      = useState(() => new Date())
  const [viewMode,         setViewMode]         = useState<CalendarViewMode>('dia')
  const [slideOverOpen,    setSlideOverOpen]    = useState(false)
  const [defaultType,      setDefaultType]      = useState<EntryType>('reserva')
  const [initialSlotTime,  setInitialSlotTime]  = useState<string | undefined>(undefined)
  const [initialSlotCourt, setInitialSlotCourt] = useState<string | undefined>(undefined)

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

    {/* Info strip: state legend + pending payments alert */}
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

      {PENDING_COBROS > 0 && (
        <span style={{
          marginLeft:      'auto',
          display:         'flex',
          alignItems:      'center',
          gap:             6,
          padding:         '3px 10px',
          borderRadius:    9999,
          backgroundColor: 'oklch(95% 0.06 58)',
          border:          '1px solid oklch(82% 0.12 58)',
          userSelect:      'none',
          flexShrink:      0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'oklch(60% 0.18 58)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: 'oklch(38% 0.14 58)', lineHeight: 1 }}>
            {PENDING_COBROS} cobro{PENDING_COBROS !== 1 ? 's' : ''} pendiente{PENDING_COBROS !== 1 ? 's' : ''}
          </span>
        </span>
      )}
    </div>
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
          <div style={{
            flex:         1,
            minHeight:    0,
            borderRadius: 7,
            border:       `1px solid ${t.bordeNeutral.val}`,
            overflow:     'hidden',
          }}>
            <CalendarDayView
            courts={COURTS}
            reservations={RESERVATIONS}
            mockNow={MOCK_NOW}
            onSlotClick={(courtId, time) => {
              setDefaultType('reserva')
              setInitialSlotTime(time)
              setInitialSlotCourt(courtId)
              setSlideOverOpen(true)
            }}
          />
          </div>
        </div>
      </ModuleLayout>

      <NewEntrySlideOver
        open={slideOverOpen}
        defaultType={defaultType}
        initialTime={initialSlotTime}
        initialCourtId={initialSlotCourt}
        courts={COURTS}
        initialDate={currentDate}
        onClose={() => setSlideOverOpen(false)}
      />
    </>
  )
}
