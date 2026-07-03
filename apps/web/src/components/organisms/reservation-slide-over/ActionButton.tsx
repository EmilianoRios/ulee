'use client'

import { useTheme } from 'tamagui'

export function ActionButton({ label, onClick, variant = 'secondary', icon, disabled, compact }: {
  label:     string
  onClick:   () => void
  variant?:  'primary' | 'secondary' | 'danger'
  icon?:     React.ReactNode
  disabled?: boolean
  compact?:  boolean
}) {
  const t = useTheme()
  const palette = {
    primary:   { bg: t.verdeCancha.val,        text: 'oklch(98% 0.004 155)', border: t.verdeCancha.val },
    secondary: { bg: 'transparent',             text: t.textoPrimario.val,    border: t.bordeNeutral.val },
    danger:    { bg: 'oklch(97% 0.01 25)',      text: 'oklch(40% 0.18 25)',   border: 'oklch(88% 0.06 25)' },
  }[variant]

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             6,
        padding:         compact ? '9px 14px' : '11px 18px',
        borderRadius:    7,
        border:          `1px solid ${palette.border}`,
        backgroundColor: palette.bg,
        color:           palette.text,
        fontSize:        13,
        fontWeight:      500,
        fontFamily:      'inherit',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        flex:            compact ? 'none' : 1,
        justifyContent:  'center',
        lineHeight:      1.3,
        opacity:         disabled ? 0.5 : 1,
        transition:      'background-color 150ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (variant === 'primary')   (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val
        if (variant === 'secondary') (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        if (variant === 'primary')   (e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.bg
        if (variant === 'secondary') (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
      }}
    >
      {icon}
      {label}
    </button>
  )
}
