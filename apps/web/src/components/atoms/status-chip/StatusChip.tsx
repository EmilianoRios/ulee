'use client'

import { useTheme } from 'tamagui'
import type { Doc } from '@canchero/backend'
import { RESERVATION_STATUS_LABELS } from '@/lib/convex/status-labels'

export type ReservationStatus = Doc<'reservations'>['status']

interface StatusChipProps {
  status: ReservationStatus
}

export function StatusChip({ status }: StatusChipProps) {
  const t = useTheme()

  const palette =
    status === 'paid'
      ? { bg: t.verdeCanchaFondo.val,   color: t.verdeCanchaProfundo.val, border: t.verdeCanchaActivo.val }
    : status === 'deposit_paid'
      ? { bg: t.acentoTerrazaClaro.val, color: t.acentoTerraza.val,       border: 'oklch(88% 0.06 42)'   }
    : status === 'pending'
      ? { bg: 'oklch(97% 0.06 95)',     color: 'oklch(50% 0.12 75)',       border: 'oklch(88% 0.08 90)'   }
    : status === 'on_court'
      ? { bg: 'oklch(93% 0.04 240)',    color: 'oklch(38% 0.12 240)',      border: 'oklch(82% 0.07 240)'  }
    : status === 'played'
      ? { bg: 'oklch(94% 0.04 185)',    color: 'oklch(36% 0.10 185)',      border: 'oklch(82% 0.07 185)'  }
    : status === 'absent'
      ? { bg: 'oklch(97% 0.03 15)',     color: 'oklch(44% 0.12 20)',       border: 'oklch(88% 0.06 15)'   }
    : status === 'maintenance'
      ? { bg: 'oklch(96% 0.05 60)',     color: 'oklch(43% 0.12 55)',       border: 'oklch(87% 0.08 60)'   }
    : status === 'recurring'
      ? { bg: 'oklch(94% 0.04 280)',    color: 'oklch(38% 0.12 280)',      border: 'oklch(84% 0.07 280)'  }
    : status === 'event'
      ? { bg: 'oklch(94% 0.05 305)',    color: 'oklch(38% 0.13 305)',      border: 'oklch(83% 0.08 305)'  }
    :   { bg: 'transparent',            color: t.textoMuted.val,           border: t.bordeNeutral.val     }

  return (
    <span
      style={{
        display:         'inline-flex',
        alignItems:      'center',
        padding:         '3px 9px',
        borderRadius:    9999,
        fontSize:        11,
        fontWeight:      500,
        letterSpacing:   '0.02em',
        lineHeight:      1.4,
        backgroundColor: palette.bg,
        color:           palette.color,
        border:          `1px solid ${palette.border}`,
        whiteSpace:      'nowrap',
      }}
    >
      {RESERVATION_STATUS_LABELS[status]}
    </span>
  )
}
