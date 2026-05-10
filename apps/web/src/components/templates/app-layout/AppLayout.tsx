'use client'

import { useTheme } from 'tamagui'
import { Sidebar } from '../../organisms/sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div
        style={{
          flex:            1,
          backgroundColor: theme.superficie.val,
          overflow:        'hidden',
          minWidth:        0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
