'use client'

import { useTheme } from 'tamagui'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: t.textoMuted.val, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}
