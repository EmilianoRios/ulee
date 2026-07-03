'use client'

import { useTheme } from 'tamagui'
import { X } from 'lucide-react'
import { STATE_LABEL } from './helpers'

export function ReservationSlideOverHeader({ clientName, state, statePalette, onClose }: {
  clientName:   string
  state:        string
  statePalette: { bg: string; color: string; border: string }
  onClose:      () => void
}) {
  const t = useTheme()
  return (
    <div style={{
      display:      'flex',
      alignItems:   'flex-start',
      padding:      '20px 24px 16px',
      borderBottom: `1px solid ${t.divisor.val}`,
      gap:          12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{
          margin:        0,
          fontSize:      18,
          fontWeight:    600,
          color:         t.textoNav.val,
          letterSpacing: '-0.01em',
          lineHeight:    1.2,
          whiteSpace:    'nowrap',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
        }}>
          {clientName}
        </h2>
        <div style={{ marginTop: 6 }}>
          <span style={{
            display:         'inline-flex',
            alignItems:      'center',
            padding:         '3px 10px',
            borderRadius:    9999,
            fontSize:        11,
            fontWeight:      600,
            letterSpacing:   '0.04em',
            textTransform:   'uppercase',
            backgroundColor: statePalette.bg,
            color:           statePalette.color,
            border:          `1px solid ${statePalette.border}`,
            lineHeight:      1.4,
          }}>
            {STATE_LABEL[state]}
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Cerrar panel"
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
          fontFamily:      'inherit',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
      >
        <X size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
