'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'

export function VenueRouterOrganism() {
  const router = useRouter()
  const venueAccess = useQuery(api.functions.users.queries.getMyVenueAccess)

  useEffect(() => {
    if (venueAccess === undefined) return

    const first = venueAccess.filter(
      (a) => a.role === 'owner' || a.status === 'active'
    )[0]

    if (first) {
      router.replace(`/${first.venueId as Id<'venues'>}/reservas`)
    } else {
      router.replace('/onboarding/sede')
    }
  }, [venueAccess, router])

  return null
}
