'use client'

import { useState, useCallback } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from 'tamagui'
import { useQuery } from 'convex/react'
import { api } from '@canchero/backend'
import type { Doc } from '@canchero/backend'

import { CalendarDayView }    from '@/components/organisms/calendar-day-view'
import { ModuleLayout }       from '@/components/templates/module-layout'
import { NewEntrySlideOver }  from '@/components/organisms/new-entry-slide-over'
import type { EntryType }     from '@/components/organisms/new-entry-slide-over'
import type { CalendarViewMode }           from '@/components/molecules/calendar-header'
import type { Court, CalendarReservation, CalendarReservationState } from '@/components/atoms/reservation-card'
import { useActiveVenue } from '@/context/active-venue'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a JS Date to "YYYY-MM-DD" using UTC-3 offset. */
function dateFromDate(d: Date): string {
  return new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

// ─── Status mappings ──────────────────────────────────────────────────────────

const STATUS_TO_STATE: Record<Doc<'reservations'>['status'], CalendarReservationState> = {
  deposit_paid:  'señado',
  on_court:      'en-cancha',
  absent:        'ausente',
  paid:          'pagado',
  maintenance:   'mantenimiento',
  recurring:     'recurrente',
  played:        'jugado',
  event:         'evento',
}

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
  const { activeVenueId } = useActiveVenue()

  const [currentDate,      setCurrentDate]      = useState(() => new Date())
  const [viewMode,         setViewMode]         = useState<CalendarViewMode>('dia')
  const [slideOverOpen,    setSlideOverOpen]    = useState(false)
  const [defaultType,      setDefaultType]      = useState<EntryType>('reserva')
  const [initialSlotTime,  setInitialSlotTime]  = useState<string | undefined>(undefined)
  const [initialSlotCourt, setInitialSlotCourt] = useState<string | undefined>(undefined)

  const currentDateStr = dateFromDate(currentDate)

  // ── Convex queries — skip when no venue selected ───────────────────────────
  const reservationsRaw = useQuery(
    api.functions.reservations.queries.listAllByVenueAndDate,
    activeVenueId !== null
      ? { venueId: activeVenueId, date: currentDateStr }
      : 'skip'
  )

  const courtsRaw = useQuery(
    api.functions.courts.queries.listByVenue,
    activeVenueId !== null
      ? { venueId: activeVenueId }
      : 'skip'
  )

  const stats = useQuery(
    api.functions.reservations.queries.statsByVenueAndDate,
    activeVenueId !== null
      ? { venueId: activeVenueId, date: currentDateStr }
      : 'skip'
  )

  const isLoading = activeVenueId !== null && (reservationsRaw === undefined || courtsRaw === undefined)

  // ── Shape adaptation ───────────────────────────────────────────────────────
  const courts: Court[] = courtsRaw?.map((c) => ({ id: c._id as string, name: c.name })) ?? []

  const reservations: CalendarReservation[] = (reservationsRaw ?? []).map((r) => ({
    id:         r._id,
    clientName: r.clientName,
    phone:      r.clientPhone || undefined,
    startTime:  r.startTime,
    endTime:    r.endTime,
    state:      STATUS_TO_STATE[r.status],
    amount:     r.totalAmount,
    courtId:    r.courtId as string,
    notes:      r.notes,
  }))

  // ── Navigation ─────────────────────────────────────────────────────────────
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
    <div className="strip-scroll" style={{
      height:          56,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 32px',
      backgroundColor: t.cabeceraOscura.val,
      overflowX:       'auto',
      gap:             12,
    }}>

      {/* Left: title + date navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
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
          minWidth:      0,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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

    {/* Info strip: state legend + pending cobros */}
    <div className="strip-scroll" style={{
      height:          36,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      padding:         '0 32px',
      borderBottom:    `1px solid ${t.divisor.val}`,
      overflowX:       'auto',
      gap:             20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {LEGEND.map(({ label, color }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none', flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1 }}>{label}</span>
          </span>
        ))}
      </div>
      {stats !== undefined && stats.pendingCount > 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize:        11,
            fontWeight:      500,
            color:           'oklch(55% 0.15 42)',
            backgroundColor: 'oklch(95% 0.04 42)',
            borderRadius:    5,
            padding:         '2px 8px',
            lineHeight:      1.4,
          }}>
            {stats.pendingCount} cobro{stats.pendingCount !== 1 ? 's' : ''} pendiente{stats.pendingCount !== 1 ? 's' : ''}
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
          {activeVenueId === null ? (
            <div style={{
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 14, color: t.textoMuted.val }}>
                Seleccioná una sede para ver el calendario
              </span>
            </div>
          ) : isLoading ? (
            <div style={{
              flex:           1,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 14, color: t.textoMuted.val }}>Cargando...</span>
            </div>
          ) : (
            <div style={{
              flex:         1,
              minHeight:    0,
              borderRadius: 7,
              border:       `1px solid ${t.bordeNeutral.val}`,
              overflow:     'hidden',
            }}>
              <CalendarDayView
                courts={courts}
                reservations={reservations}
                mockNow={currentDate}
                onSlotClick={(courtId, time) => {
                  setDefaultType('reserva')
                  setInitialSlotTime(time)
                  setInitialSlotCourt(courtId)
                  setSlideOverOpen(true)
                }}
              />
            </div>
          )}
        </div>
      </ModuleLayout>

      <NewEntrySlideOver
        open={slideOverOpen}
        defaultType={defaultType}
        initialTime={initialSlotTime}
        initialCourtId={initialSlotCourt}
        courts={courts}
        initialDate={currentDate}
        venueId={activeVenueId}
        onClose={() => setSlideOverOpen(false)}
      />
    </>
  )
}
