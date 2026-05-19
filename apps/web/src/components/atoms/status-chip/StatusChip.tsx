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

  const palette = status === 'paid'
    ? { bg: t.verdeCanchaFondo.val,    color: t.verdeCanchaProfundo.val, border: t.verdeCanchaActivo.val }
    : status === 'deposit_paid'
    ? { bg: t.acentoTerrazaClaro.val,  color: t.acentoTerraza.val,       border: 'oklch(88% 0.06 42)'   }
    : { bg: 'transparent',             color: t.textoMuted.val,           border: t.bordeNeutral.val     }

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
