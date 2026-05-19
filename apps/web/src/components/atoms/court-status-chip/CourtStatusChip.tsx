'use client'

import { useTheme } from 'tamagui'
import type { Doc } from '@canchero/backend'
import { COURT_STATUS_LABELS } from '@/lib/convex/status-labels'

export type CourtStatus = Doc<'courts'>['status']

interface CourtStatusChipProps {
  status: CourtStatus
}

export function CourtStatusChip({ status }: CourtStatusChipProps) {
  const t = useTheme()

  const palette =
    status === 'active'
      ? { bg: t.verdeCanchaFondo.val,   color: t.verdeCanchaProfundo.val, border: t.verdeCanchaActivo.val }
      : status === 'maintenance'
      ? { bg: t.acentoTerrazaClaro.val, color: t.acentoTerraza.val,       border: 'oklch(88% 0.06 42)'   }
      : { bg: 'oklch(93% 0.008 224)',   color: t.textoMuted.val,           border: t.bordeNeutral.val     }

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
      {COURT_STATUS_LABELS[status]}
    </span>
  )
}
