'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { useUser } from '@clerk/nextjs'
import { api } from '@canchero/backend'
import { ACTIVE_VENUE_STORAGE_KEY } from '@/context/active-venue'
import { Clock } from 'lucide-react'

export function EmployeeWaitOrganism() {
  const router             = useRouter()
  const { user }           = useUser()
  const completeOnboarding = useMutation(api.functions.users.mutations.completeOnboarding)
  const claimInvite        = useMutation(api.functions.users.mutations.claimInvite)

  // Real-time Convex subscription — fires whenever venueAccess changes
  const venueAccess = useQuery(api.functions.users.queries.getMyVenueAccess)

  // Auto-claim: use Clerk client-side email (always reliable, no JWT dependency)
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email || venueAccess === undefined) return
    if (venueAccess.length > 0) return // already has access, no need to claim

    claimInvite({ email }).catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, venueAccess])

  useEffect(() => {
    if (!venueAccess || venueAccess.length === 0) return

    // Pre-select the first accessible venue so the dashboard loads with it active
    const firstVenueId = venueAccess[0].venueId
    localStorage.setItem(ACTIVE_VENUE_STORAGE_KEY, firstVenueId)

    // Access granted — complete onboarding and redirect
    completeOnboarding()
      .catch(console.error)
      .finally(() => {
        router.replace('/reservas')
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
