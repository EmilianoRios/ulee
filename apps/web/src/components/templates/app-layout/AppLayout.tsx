'use client'

import { useTheme } from 'tamagui'
import { Sidebar } from '../../organisms/sidebar'
import { Topbar } from '../../organisms/topbar'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const theme = useTheme()
  return (
    <div
      style={{
        display:   'flex',
        width:     '100vw',
        height:    '100vh',
        overflow:  'hidden',
      }}
    >
      <Sidebar />
      <div
        style={{
          flex:          1,
          display:       'flex',
          flexDirection: 'column',
          minWidth:      0,
          overflow:      'hidden',
        }}
      >
        <Topbar />
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
    </div>
  )
}
