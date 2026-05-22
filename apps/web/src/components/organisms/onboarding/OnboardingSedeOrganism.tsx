'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@canchero/backend'
import { StepIndicator } from '@/components/molecules/step-indicator'

const STEPS = ['Tu sede', 'Tus canchas', 'Listo']

const DEFAULT_SCHEDULE = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
  dayOfWeek,
  active:    true,
  openTime:  480,  // 08:00 in minutes
  closeTime: 1320, // 22:00 in minutes
}))

export function OnboardingSedeOrganism() {
  const router = useRouter()
  const createVenue = useMutation(api.functions.venues.mutations.create)

  const [name, setName]                   = useState('')
  const [address, setAddress]             = useState('')
  const [phone, setPhone]                 = useState('')
  const [description, setDescription]     = useState('')
  const [email, setEmail]                 = useState('')
  const [pricePerHour, setPricePerHour]   = useState('')
  const [error, setError]                 = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre de la sede es obligatorio.')
      return
    }
    if (!address.trim()) {
      setError('La dirección es obligatoria.')
      return
    }
    if (email.trim() && !email.includes('@')) {
      setError('Email inválido.')
      return
    }
    if (pricePerHour && parseInt(pricePerHour.replace(/\D/g, ''), 10) < 0) {
      setError('El precio por hora debe ser un número positivo.')
      return
    }

    try {
      setLoading(true)
      const venueId = await createVenue({
        name:          name.trim(),
        address:       address.trim(),
        phone:         phone.trim(),
        schedule:      DEFAULT_SCHEDULE,
        pricingConfig: {
          pricePerHour: pricePerHour ? parseInt(pricePerHour.replace(/\D/g, ''), 10) : 0,
          currency:     'ARS',
        },
        description: description.trim() || undefined,
        email:       email.trim() || undefined,
      })
      router.push(`/onboarding/canchas?venueId=${venueId}`)
    } catch (err) {
      setError('Ocurrió un error al crear la sede. Intentá de nuevo.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={0} />

      <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
        Configurá tu sede
      </h1>
      <p style={{ color: 'oklch(60% 0.01 228)', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
        Completá los datos principales de tu establecimiento.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Nombre de la sede *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Canchero Club"
            maxLength={100}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Dirección *</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Av. Corrientes 1234, CABA"
            maxLength={200}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Teléfono de contacto</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: +54 11 1234-5678"
            maxLength={20}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Club deportivo con 4 canchas de fútbol 5..."
            maxLength={500}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Email de contacto</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej: info@cancheroclub.com"
            maxLength={100}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Precio por hora</label>
          <input
            type="text"
            inputMode="numeric"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value.replace(/\D/g, ''))}
            placeholder="Ej: 5000"
            style={inputStyle}
          />
          <span style={{ color: 'oklch(50% 0.01 228)', fontSize: 12 }}>
            Podés configurarlo después en Configuración
          </span>
        </div>

        {error && (
          <p style={{ color: 'oklch(65% 0.19 25)', fontSize: 13, margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop:       8,
            padding:         '12px 24px',
            backgroundColor: loading ? 'oklch(35% 0.10 155)' : 'oklch(52% 0.16 155)',
            color:           'white',
            border:          'none',
            borderRadius:    8,
            fontSize:        14,
            fontWeight:      600,
            cursor:          loading ? 'default' : 'pointer',
            fontFamily:      'inherit',
            transition:      'background-color 150ms ease-out',
          }}
        >
          {loading ? 'Guardando...' : 'Continuar'}
        </button>
      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  color:      'oklch(75% 0.01 228)',
  fontSize:   13,
  fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  padding:         '10px 12px',
  backgroundColor: 'oklch(18% 0.01 228)',
  border:          '1px solid oklch(30% 0.01 228)',
  borderRadius:    7,
  color:           'white',
  fontSize:        14,
  fontFamily:      'inherit',
  outline:         'none',
}
