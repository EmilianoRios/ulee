'use client'

import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '@canchero/ui'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          {children}
        </TamaguiProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
