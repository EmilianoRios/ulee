'use client'

import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '@canchero/ui'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      {children}
    </TamaguiProvider>
  )
}
