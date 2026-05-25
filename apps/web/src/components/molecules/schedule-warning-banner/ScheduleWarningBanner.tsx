'use client'

import { X, Clock } from 'lucide-react'
import Link from 'next/link'

interface ScheduleWarningBannerProps {
  onDismiss: () => void
}

export function ScheduleWarningBanner({ onDismiss }: ScheduleWarningBannerProps) {
  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
      gap:             12,
      padding:         '10px 16px',
      borderRadius:    7,
      backgroundColor: 'oklch(28% 0.06 60)',
      border:          '1px solid oklch(45% 0.12 60)',
      marginBottom:    12,
      flexShrink:      0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Clock size={15} strokeWidth={2} color="oklch(75% 0.15 60)" style={{ flexShrink: 0 }} />
        <span style={{
          fontSize:   13,
          color:      'oklch(85% 0.08 60)',
          lineHeight: 1.4,
        }}>
          Tu sede tiene el horario predeterminado (08:00–22:00). Si no refleja tu horario real, el calendario puede verse incorrecto.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Link
          href="/configuracion"
          style={{
            fontSize:        12,
            fontWeight:      500,
            color:           'oklch(78% 0.14 60)',
            textDecoration:  'none',
            padding:         '4px 10px',
            borderRadius:    5,
            border:          '1px solid oklch(45% 0.12 60)',
            lineHeight:      1,
            whiteSpace:      'nowrap',
          }}
        >
          Configurar horario
        </Link>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          style={{
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            width:           22,
            height:          22,
            borderRadius:    4,
            border:          'none',
            backgroundColor: 'transparent',
            cursor:          'pointer',
            color:           'oklch(60% 0.08 60)',
            padding:         0,
            flexShrink:      0,
          }}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
