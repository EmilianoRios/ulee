'use client'

import { useTheme } from 'tamagui'

export function PaymentMethodButton({ label, icon, selected, onClick }: {
  label:    string
  icon:     React.ReactNode
  selected: boolean
  onClick:  () => void
}) {
  const t = useTheme()
  return (
    <button
      onClick={onClick}
      style={{
        flex:            1,
        padding:         '10px 12px',
        borderRadius:    7,
        border:          `2px solid ${selected ? t.verdeCancha.val : t.bordeNeutral.val}`,
        backgroundColor: selected ? t.verdeCanchaActivo.val : 'transparent',
        color:           selected ? t.verdeCanchaProfundo.val : t.textoPrimario.val,
        fontSize:        13,
        fontWeight:      selected ? 600 : 500,
        fontFamily:      'inherit',
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             6,
        lineHeight:      1.3,
        transition:      'border-color 120ms ease-out, background-color 120ms ease-out',
      }}
    >
      {icon}
      {label}
    </button>
  )
}
