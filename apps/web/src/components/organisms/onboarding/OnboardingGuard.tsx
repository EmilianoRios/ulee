'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@canchero/backend'

export function OnboardingGuard() {
  const router = useRouter()
  const userStatus = useQuery(api.functions.users.queries.getCurrentUserStatus)

  useEffect(() => {
    if (userStatus === undefined) return

    if (userStatus === null) return

    if (userStatus.role === 'owner' && !userStatus.onboardingCompleted) {
      router.replace('/onboarding/sede')
    }

    if (userStatus.role === 'employee' && !userStatus.onboardingCompleted) {
      router.replace('/onboarding/acceso')
    }
  }, [userStatus, router])

  return null
}
