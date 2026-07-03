'use client'

import { useTheme } from 'tamagui'

export function DetailRow({ icon, label, value, valueWeight = 400 }: {
  icon:          React.ReactNode
  label:         string
  value:         string
  valueWeight?:  number
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 14, height: 18, display: 'flex', alignItems: 'center', flexShrink: 0, color: t.textoMuted.val }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 13, color: t.textoPrimario.val, fontWeight: valueWeight, lineHeight: 1.4, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}
