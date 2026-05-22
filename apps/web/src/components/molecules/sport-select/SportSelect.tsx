'use client'

import { useTheme } from 'tamagui'
import { SPORTS } from '@/lib/constants/courts'

interface SportSelectProps {
  value:    string
  onChange: (value: string) => void
  style?:   React.CSSProperties
}

export function SportSelect({ value, onChange, style }: SportSelectProps) {
  const t = useTheme()

  const selectBase: React.CSSProperties = {
    width:               '100%',
    padding:             '9px 12px',
    paddingRight:        36,
    borderRadius:        7,
    border:              `1px solid ${t.bordeNeutral.val}`,
    backgroundColor:     t.superficieContenido.val,
    color:               t.textoPrimario.val,
    fontSize:            13,
    fontFamily:          'inherit',
    outline:             'none',
    boxSizing:           'border-box',
    cursor:              'pointer',
    appearance:          'none',
    WebkitAppearance:    'none',
    backgroundImage:     `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat:    'no-repeat',
    backgroundPosition:  'right 12px center',
    transition:          'border-color 150ms ease-out',
    ...style,
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={selectBase}
    >
      {SPORTS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}
