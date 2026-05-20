'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { StepIndicator } from '@/components/molecules/step-indicator'
import { CheckCircle } from 'lucide-react'

const STEPS = ['Tu sede', 'Tus canchas', 'Listo']

const SPORTS = [
  { value: 'futbol',  label: 'Fútbol' },
  { value: 'padel',   label: 'Pádel' },
  { value: 'tenis',   label: 'Tenis' },
  { value: 'otro',    label: 'Otro' },
]

interface AddedCourt {
  id: Id<'courts'>
  name: string
  sport: string
}

export function OnboardingCanchasOrganism() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const venueId      = searchParams.get('venueId') as Id<'venues'> | null

  const createCourt = useMutation(api.functions.courts.mutations.create)

  const [courts, setCourts]   = useState<AddedCourt[]>([])
  const [name, setName]       = useState('')
  const [sport, setSport]     = useState('futbol')
  const [surface, setSurface] = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [adding, setAdding]   = useState(false)
  const [finishing, setFinishing] = useState(false)

  async function handleAddCourt(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('El nombre de la cancha es obligatorio.')
      return
    }
    if (!venueId) {
      setError('No se encontró la sede. Volvé al paso anterior.')
      return
    }

    try {
      setAdding(true)
      const courtId = await createCourt({
        venueId,
        name:    name.trim(),
        sport,
        surface: surface.trim() || undefined,
      })
      setCourts((prev) => [...prev, { id: courtId, name: name.trim(), sport }])
      setName('')
      setSurface('')
    } catch (err) {
      setError('Error al agregar la cancha. Intentá de nuevo.')
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  async function handleFinish() {
    if (courts.length === 0) {
      setError('Tenés que agregar al menos una cancha para continuar.')
      return
    }
    setFinishing(true)
    router.push(`/onboarding/listo${venueId ? `?venueId=${venueId}` : ''}`)
  }

  return (
    <div>
      <StepIndicator steps={STEPS} currentStep={1} />

      <h1 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
        Agregá tus canchas
      </h1>
      <p style={{ color: 'oklch(60% 0.01 228)', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
        Necesitás al menos una cancha para continuar.
      </p>

      {/* Added courts list */}
      {courts.length > 0 && (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {courts.map((c) => (
            <div
              key={c.id}
              style={{
                display:         'flex',
                alignItems:      'center',
                gap:             10,
                padding:         '10px 14px',
                backgroundColor: 'oklch(18% 0.01 228)',
                borderRadius:    8,
                border:          '1px solid oklch(30% 0.10 155)',
              }}
            >
              <CheckCircle size={16} color="oklch(52% 0.16 155)" />
              <span style={{ color: 'white', fontSize: 14 }}>{c.name}</span>
              <span style={{ color: 'oklch(50% 0.01 228)', fontSize: 12, marginLeft: 'auto' }}>
                {SPORTS.find(s => s.value === c.sport)?.label ?? c.sport}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add court form */}
      <form onSubmit={handleAddCourt} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Nombre de la cancha *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Cancha 1"
            maxLength={80}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Deporte *</label>
          <select
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {SPORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Superficie</label>
          <input
            type="text"
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            placeholder="Ej: Césped sintético, cemento..."
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ color: 'oklch(65% 0.19 25)', fontSize: 13, margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={adding}
          style={{
            padding:         '10px 24px',
            backgroundColor: 'oklch(25% 0.01 228)',
            color:           'oklch(75% 0.01 228)',
            border:          '1px solid oklch(35% 0.01 228)',
            borderRadius:    8,
            fontSize:        14,
            fontWeight:      500,
            cursor:          adding ? 'default' : 'pointer',
            fontFamily:      'inherit',
          }}
        >
          {adding ? 'Agregando...' : '+ Agregar cancha'}
        </button>
      </form>

      {/* Finish button */}
      <button
        onClick={handleFinish}
        disabled={courts.length === 0 || finishing}
        style={{
          marginTop:       24,
          width:           '100%',
          padding:         '12px 24px',
          backgroundColor: courts.length === 0
            ? 'oklch(22% 0.01 228)'
            : 'oklch(52% 0.16 155)',
          color:           courts.length === 0
            ? 'oklch(40% 0.01 228)'
            : 'white',
          border:          'none',
          borderRadius:    8,
          fontSize:        14,
          fontWeight:      600,
          cursor:          courts.length === 0 ? 'default' : 'pointer',
          fontFamily:      'inherit',
          transition:      'background-color 150ms ease-out',
        }}
      >
        {finishing ? 'Finalizando...' : 'Finalizar'}
      </button>
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
