'use client'

import { useTheme } from 'tamagui'

export type CalendarReservationState = 'señado' | 'en-cancha' | 'ausente' | 'pagado'

export interface Court {
  id: string
  name: string
}

export interface CalendarReservation {
  id: string
  clientName: string
  phone?: string
  startTime: string
  endTime: string
  state: CalendarReservationState
  amount: number
  courtId: string
  notes?: string
}

const STATE_LABEL: Record<CalendarReservationState, string> = {
  señado:      'Señado',
  'en-cancha': 'En cancha',
  ausente:     'Ausente',
  pagado:      'Pagado',
}

interface ReservationCardProps {
  reservation: CalendarReservation
  slotHeight: number
  slotCount: number
  now: Date
  onClick: () => void
}

function parseMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
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
  }[reservation.state]

  const isCompact = heightPx < 72

  const nowMins   = now.getHours() * 60 + now.getMinutes()
  const startMins = parseMins(reservation.startTime)
  const endMins   = parseMins(reservation.endTime)

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
        padding:         isCompact ? '4px 8px' : '8px 10px',
        cursor:          'pointer',
        display:         'flex',
        flexDirection:   'column',
        gap:             2,
        overflow:        'hidden',
        userSelect:      'none',
        outline:         'none',
        zIndex:          2,
        boxSizing:       'border-box',
      }}
    >
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
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color:         palette.label,
          whiteSpace:    'nowrap',
          flexShrink:    0,
          lineHeight:    1.6,
        }}>
          {STATE_LABEL[reservation.state]}
        </span>
      </div>

      {!isCompact && (
        <span style={{ fontSize: 11, color: palette.text, opacity: 0.65, lineHeight: 1.3 }}>
          {reservation.startTime} – {reservation.endTime}
        </span>
      )}

      {!isCompact && reservation.state === 'en-cancha' && heightPx >= 100 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: palette.text, opacity: 0.7, lineHeight: 1.4 }}>
            ⏱ {fmtDuration(elapsed)} transcurridos
          </span>
          <span style={{ fontSize: 10, color: palette.text, opacity: 0.7, lineHeight: 1.4 }}>
            ⏳ {fmtDuration(remaining)} restantes
          </span>
        </div>
      )}

      {!isCompact && heightPx >= 88 && (
        <span style={{
          fontSize:    11,
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
