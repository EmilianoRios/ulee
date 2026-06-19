'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexReactClient } from 'convex/react'
import { TamaguiProvider } from 'tamagui'
import { useMutation } from 'convex/react'
import { api } from '@canchero/backend'
import { tamaguiConfig } from '@canchero/ui'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function SyncUser() {
  const { isSignedIn } = useAuth()
  const { user }       = useUser()
  const sync           = useMutation(api.functions.users.sync.sync)
  const claimInvite    = useMutation(api.functions.users.mutations.claimInvite)
  const router         = useRouter()

  useEffect(() => {
    if (!isSignedIn || !user) return

    const email = user.primaryEmailAddress?.emailAddress ?? ''

    sync({
      emailFallback: email,
      nameFallback:  user.fullName ?? '',
    }).then(async (result) => {
      // Try to claim a pending invite using the Clerk client-side email
      // (reliable regardless of JWT template configuration)
      if (email) {
        const claim = await claimInvite({ email })
        if (claim.claimed) {
          // Role is now employee — OnboardingGuard will handle final redirect
          router.push('/')
          return
        }
      }

      if (result.isNew) router.push('/onboarding/sede')
    }).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user])

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
