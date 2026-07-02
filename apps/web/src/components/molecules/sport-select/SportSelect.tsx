'use client'

import { Select } from '@/components/atoms/select/Select'
import { SPORTS } from '@/lib/constants/courts'

interface SportSelectProps {
  value:    string
  onChange: (value: string) => void
  style?:   React.CSSProperties
}

export function SportSelect({ value, onChange, style }: SportSelectProps) {
  return (
    <Select
      value={value}
      onChange={onChange}
      style={style}
      options={SPORTS.map((s) => ({ value: s, label: s }))}
    />
  )
}
