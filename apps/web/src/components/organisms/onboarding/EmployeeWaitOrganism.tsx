'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { Clock } from 'lucide-react'

export function EmployeeWaitOrganism() {
  const router             = useRouter()
  const { user }           = useUser()
  const completeOnboarding = useMutation(api.functions.users.mutations.completeOnboarding)
  const claimInvite        = useMutation(api.functions.users.mutations.claimInvite)

  // Real-time Convex subscription — fires whenever venueAccess changes
  const venueAccess = useQuery(api.functions.users.queries.getMyVenueAccess)

  // Auto-claim: use Clerk client-side email (always reliable, no JWT dependency)
  const activeVenueAccess = venueAccess?.filter((a) => a.status === 'active') ?? []

  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email || venueAccess === undefined) return
    if (activeVenueAccess.length > 0) return // already has active access, no need to claim

    claimInvite({ email }).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, venueAccess])

  useEffect(() => {
    if (activeVenueAccess.length === 0) return

    // Active access granted — complete onboarding and redirect to the venue dashboard
    const firstVenueId = activeVenueAccess[0].venueId as Id<'venues'>

    completeOnboarding()
      .catch(console.error)
      .finally(() => {
        router.replace(`/${firstVenueId}/reservas`)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueAccess])

  const email = user?.primaryEmailAddress?.emailAddress ?? ''

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <Clock size={48} color="oklch(60% 0.14 240)" />
      </div>

      <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        Esperando acceso
      </h1>

      <p style={{ color: 'oklch(60% 0.01 228)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
        Tu cuenta está lista. Pedile al dueño de la sede que te invite usando tu dirección de email:
      </p>

      {email && (
        <div
          style={{
            display:         'inline-block',
            padding:         '10px 20px',
            backgroundColor: 'oklch(18% 0.01 228)',
            border:          '1px solid oklch(35% 0.01 228)',
            borderRadius:    8,
            marginBottom:    32,
          }}
        >
          <span style={{ color: 'oklch(80% 0.01 228)', fontSize: 14, fontWeight: 500 }}>
            {email}
          </span>
        </div>
      )}

      <p style={{ color: 'oklch(45% 0.01 228)', fontSize: 12, lineHeight: 1.6 }}>
        Cuando el dueño te agregue a su sede, esta pantalla te va a redirigir automáticamente.
      </p>
    </div>
  )
}
