'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClerkProvider, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { TamaguiProvider } from 'tamagui'
import { useMutation } from 'convex/react'
import { api } from '@canchero/backend'
import { tamaguiConfig } from '@canchero/ui'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function SyncUser() {
  const { isSignedIn } = useAuth()
  const sync = useMutation(api.functions.users.sync.sync)
  const router = useRouter()

  useEffect(() => {
    if (!isSignedIn) return
    sync().then((result) => {
      if (result.isNew) router.push('/onboarding/sede')
    })
  }, [isSignedIn, sync, router])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <SyncUser />
          {children}
        </TamaguiProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
