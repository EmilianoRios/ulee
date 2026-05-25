'use client'

import { useTheme } from 'tamagui'

interface ToggleProps {
  checked:  boolean
  onChange: (v: boolean) => void
}

export function Toggle({ checked, onChange }: ToggleProps) {
  const t = useTheme()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width:           36,
        height:          20,
        borderRadius:    10,
        border:          'none',
        padding:         2,
        backgroundColor: checked ? t.verdeCancha.val : t.bordeNeutral.val,
        cursor:          'pointer',
        position:        'relative',
        display:         'flex',
        alignItems:      'center',
        flexShrink:      0,
        transition:      'background-color 150ms ease-out',
      }}
    >
      <span style={{
        display:         'block',
        width:           16,
        height:          16,
        borderRadius:    '50%',
        backgroundColor: 'white',
        transform:       checked ? 'translateX(16px)' : 'translateX(0)',
        transition:      'transform 150ms ease-out',
        flexShrink:      0,
      }} />
    </button>
  )
}
