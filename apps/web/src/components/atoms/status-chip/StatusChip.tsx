'use client'

import { useTheme } from 'tamagui'

export type ReservationStatus = 'pagado' | 'señado' | 'paga_en_cancha'

const LABELS: Record<ReservationStatus, string> = {
  pagado:         'Pagado',
  señado:         'Señado',
  paga_en_cancha: 'Paga en cancha',
}

interface StatusChipProps {
  status: ReservationStatus
}

export function StatusChip({ status }: StatusChipProps) {
  const t = useTheme()

  const palette = status === 'pagado'
    ? { bg: t.verdeCanchaFondo.val,    color: t.verdeCanchaProfundo.val, border: t.verdeCanchaActivo.val }
    : status === 'señado'
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
      {LABELS[status]}
    </span>
  )
}
