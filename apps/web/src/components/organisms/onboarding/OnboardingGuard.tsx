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
    if (userStatus.onboardingCompleted) return

    // Route based on venueAccess, not global role.
    // This allows a user to be both owner and employee across different venues.
    const employeeOnly = userStatus.hasEmployeeAccess && !userStatus.hasOwnerAccess
    if (employeeOnly) {
      router.replace('/onboarding/acceso')
    } else {
      router.replace('/onboarding/sede')
    }
  }, [userStatus, router])

  return null
}
