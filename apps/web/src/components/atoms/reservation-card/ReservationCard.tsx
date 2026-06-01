'use client'

import { useTheme } from 'tamagui'

export type CalendarReservationState = 'pendiente' | 'señado' | 'en-cancha' | 'ausente' | 'pagado' | 'mantenimiento' | 'recurrente' | 'jugado' | 'evento'

export interface Court {
  id:                     string
  name:                   string
  priceOverride?:         number
  nightRatePriceOverride?: number
}

export interface CalendarReservation {
  id: string
  clientName: string
  phone?: string
  startTime: number   // absolute minutes since midnight of reservation date
  endTime: number     // may be > 1440 for overnight reservations
  state: CalendarReservationState
  amount: number
  depositAmount?: number
  wasFullyPaid: boolean    // true when reservation reached paid status or had 100% deposit
  courtId: string
  date?: string       // "YYYY-MM-DD" — may be absent for spillovers
  notes?: string
  seriesId?: string
}

const STATE_LABEL: Record<CalendarReservationState, string> = {
  pendiente:     'Pendiente',
  señado:        'Señado',
  'en-cancha':   'En cancha',
  ausente:       'Ausente',
  pagado:        'Pagado',
  mantenimiento: 'Mantenimiento',
  recurrente:    'Recurrente',
  jugado:        'Jugado',
  evento:        'Evento',
}

interface ReservationCardProps {
  reservation: CalendarReservation
  slotHeight: number
  slotCount: number
  now: Date
  onClick: () => void
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export function ReservationCard({ reservation, slotHeight, slotCount, now, onClick }: ReservationCardProps) {
  const t = useTheme()

  const heightPx = slotHeight * slotCount

  const palette = {
    pendiente: {
      bg:     'oklch(95% 0.05 55)',
      border: 'oklch(80% 0.10 55)',
      text:   'oklch(32% 0.07 55)',
      label:  'oklch(52% 0.15 55)',
    },
    señado: {
      bg:     t.acentoTerrazaClaro.val,
      border: 'oklch(84% 0.07 42)',
      text:   t.textoNav.val,
      label:  t.acentoTerraza.val,
    },
    'en-cancha': {
      bg:     t.verdeCanchaActivo.val,
      border: t.verdeCancha.val,
      text:   t.verdeCanchaProfundo.val,
      label:  t.verdeCanchaProfundo.val,
    },
    ausente: {
      bg:     t.fondoHover.val,
      border: t.divisor.val,
      text:   t.textoInactivo.val,
      label:  t.textoInactivo.val,
    },
    pagado: {
      bg:     t.superficieContenido.val,
      border: t.bordeNeutral.val,
      text:   t.textoPrimario.val,
      label:  t.verdeCanchaProfundo.val,
    },
    mantenimiento: {
      bg:     'oklch(94% 0.06 88)',
      border: 'oklch(76% 0.13 88)',
      text:   'oklch(32% 0.10 85)',
      label:  'oklch(46% 0.15 85)',
    },
    recurrente: {
      bg:     'oklch(92% 0.04 275)',
      border: 'oklch(70% 0.09 275)',
      text:   'oklch(28% 0.08 275)',
      label:  'oklch(44% 0.12 275)',
    },
    jugado: {
      bg:     'oklch(91% 0.012 220)',
      border: 'oklch(76% 0.018 222)',
      text:   'oklch(38% 0.014 222)',
      label:  'oklch(52% 0.17 58)',
    },
    evento: {
      bg:     'oklch(93% 0.04 200)',
      border: 'oklch(68% 0.10 200)',
      text:   'oklch(30% 0.08 200)',
      label:  'oklch(44% 0.11 200)',
    },
  }[reservation.state]

  const isCompact = heightPx < 72

  const nowMins   = now.getHours() * 60 + now.getMinutes()
  const startMins = reservation.startTime
  const endMins   = reservation.endTime

  const elapsed   = Math.max(0, nowMins - startMins)
  const remaining = Math.max(0, endMins - nowMins)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        position:        'absolute',
        inset:           '2px 4px',
        backgroundColor: palette.bg,
        border:          `1.5px solid ${palette.border}`,
        borderRadius:    6,
        padding:         isCompact ? '4px 8px' : '10px 12px',
        cursor:          'pointer',
        display:         'flex',
        flexDirection:   'column',
        gap:             4,
        overflow:        'hidden',
        userSelect:      'none',
        outline:         'none',
        zIndex:          2,
        boxSizing:       'border-box',
      }}
    >
      {reservation.state === 'jugado' && (
        <div style={{
          position:        'absolute',
          top:             5,
          right:           5,
          width:           7,
          height:          7,
          borderRadius:    '50%',
          backgroundColor: 'oklch(72% 0.17 58)',
          boxShadow:       '0 0 0 2px oklch(91% 0.012 220)',
          flexShrink:      0,
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, overflow: 'hidden' }}>
        <span style={{
          fontSize:      12,
          fontWeight:    600,
          color:         palette.text,
          whiteSpace:    'nowrap',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          lineHeight:    1.3,
          letterSpacing: '-0.1px',
          flex:          1,
        }}>
          {reservation.clientName}
        </span>
        <span style={{
          fontSize:      10,
          fontWeight:    500,
          letterSpacing: '0.02em',
          color:         palette.label,
          whiteSpace:    'nowrap',
          flexShrink:    0,
          lineHeight:    1.5,
        }}>
          {STATE_LABEL[reservation.state]}
        </span>
      </div>

      {!isCompact && (
        <span style={{ fontSize: 11, color: palette.text, opacity: 0.65, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          {minutesToTime(reservation.startTime)} – {minutesToTime(reservation.endTime)}
          {reservation.endTime > 1440 && (
            <span style={{
              fontSize:        9,
              fontWeight:      600,
              color:           'oklch(44% 0.12 275)',
              backgroundColor: 'oklch(92% 0.04 275)',
              borderRadius:    3,
              padding:         '1px 3px',
              lineHeight:      1.4,
            }}>+1</span>
          )}
        </span>
      )}

      {!isCompact && reservation.state === 'en-cancha' && heightPx >= 100 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10, color: palette.text, opacity: 0.7, lineHeight: 1.4 }}>
            {fmtDuration(elapsed)} jugados
          </span>
          <span style={{ fontSize: 10, color: palette.text, opacity: 0.7, lineHeight: 1.4 }}>
            {fmtDuration(remaining)} restantes
          </span>
        </div>
      )}

      {!isCompact && heightPx >= 88 && (
        <span style={{
          fontSize:    12,
          fontWeight:  500,
          color:       palette.text,
          lineHeight:  1.3,
          marginTop:   'auto',
        }}>
          ${reservation.amount.toLocaleString('es-AR')}
        </span>
      )}
    </div>
  )
}
