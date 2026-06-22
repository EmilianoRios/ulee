'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { StepIndicator } from '@/components/molecules/step-indicator'
import { CheckCircle } from 'lucide-react'

const STEPS = ['Tu sede', 'Tus canchas', 'Listo']

export function OnboardingListoOrganism() {
  const router             = useRouter()
  const searchParams       = useSearchParams()
  const venueId            = searchParams.get('venueId') as Id<'venues'> | null
  const completeOnboarding = useMutation(api.functions.users.mutations.completeOnboarding)
  const [done, setDone]    = useState(false)

  useEffect(() => {
    let cancelled = false

    completeOnboarding()
      .then(() => {
        if (!cancelled) {
          setDone(true)
          if (venueId) {
            router.replace(`/${venueId}/reservas`)
          }
        }
      })
      .catch((err) => {
        console.error('completeOnboarding failed:', err)
        if (!cancelled) {
          setDone(true)
        }
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ textAlign: 'center' }}>
      <StepIndicator steps={STEPS} currentStep={2} />

      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <CheckCircle size={48} color="oklch(52% 0.16 155)" />
      </div>

      <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        ¡Todo listo!
      </h1>
      <p style={{ color: 'oklch(60% 0.01 228)', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
        Tu sede y tus canchas están configuradas. Ya podés empezar a gestionar tus reservas.
      </p>

      <button
        onClick={() => {
          if (venueId) router.replace(`/${venueId}/reservas`)
        }}
        style={{
          padding:         '12px 32px',
          backgroundColor: done ? 'oklch(52% 0.16 155)' : 'oklch(35% 0.10 155)',
          color:           'white',
          border:          'none',
          borderRadius:    8,
          fontSize:        14,
          fontWeight:      600,
          cursor:          'pointer',
          fontFamily:      'inherit',
          transition:      'background-color 150ms ease-out',
        }}
      >
        Ir al dashboard
      </button>
    </div>
  )
}
