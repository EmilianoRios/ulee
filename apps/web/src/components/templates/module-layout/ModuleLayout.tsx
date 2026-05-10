'use client'

import { useTheme } from 'tamagui'

interface ModuleLayoutProps {
  strip?:   React.ReactNode
  children: React.ReactNode
}

export function ModuleLayout({ strip, children }: ModuleLayoutProps) {
  const t = useTheme()

  return (
    <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {strip && (
        <div style={{
          flexShrink:   0,
          borderBottom: `1px solid ${t.divisor.val}`,
        }}>
          {strip}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
