'use client'

import { Select } from '@/components/atoms/select/Select'
import { SURFACES } from '@/lib/constants/courts'

interface SurfaceSelectProps {
  value:    string
  onChange: (value: string) => void
  style?:   React.CSSProperties
}

export function SurfaceSelect({ value, onChange, style }: SurfaceSelectProps) {
  return (
    <Select
      value={value}
      onChange={onChange}
      style={style}
      options={SURFACES.map((s) => ({ value: s, label: s }))}
    />
  )
}
