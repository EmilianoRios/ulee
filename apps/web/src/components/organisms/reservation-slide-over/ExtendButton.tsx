'use client'

import { useTheme } from 'tamagui'

export function ExtendButton({ label, available, active, onClick }: {
  label:     string
  available: boolean
  active?:   boolean
  onClick:   () => void
}) {
  const t = useTheme()
  const bg     = active ? t.verdeCanchaActivo.val : available ? 'transparent' : t.fondoHover.val
  const border  = active ? t.verdeCancha.val : available ? t.bordeNeutral.val : t.divisor.val
  const color   = active ? t.verdeCanchaProfundo.val : available ? t.textoPrimario.val : t.textoInactivo.val
  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      title={available ? undefined : 'Slot ocupado'}
      style={{
        flex:            1,
        padding:         '9px 12px',
        borderRadius:    7,
        border:          `1px solid ${border}`,
        backgroundColor: bg,
        color,
        fontSize:        13,
        fontWeight:      active ? 600 : 500,
        fontFamily:      'inherit',
        cursor:          available ? 'pointer' : 'not-allowed',
        lineHeight:      1.3,
        opacity:         available ? 1 : 0.5,
        transition:      'background-color 120ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (available && !active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val
      }}
      onMouseLeave={(e) => {
        if (available && !active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
      }}
    >
      {label}
    </button>
  )
}
