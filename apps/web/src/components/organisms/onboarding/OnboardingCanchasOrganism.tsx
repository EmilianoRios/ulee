'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { useTheme } from 'tamagui'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import { StepIndicator } from '@/components/molecules/step-indicator'
import { SportSelect } from '@/components/molecules/sport-select'
import { SurfaceSelect } from '@/components/molecules/surface-select'
import { DEFAULT_SPORT, DEFAULT_SURFACE } from '@/lib/constants/courts'
import { CheckCircle } from 'lucide-react'

const STEPS = ['Tu sede', 'Tus canchas', 'Listo']

interface AddedCourt {
  id:    Id<'courts'>
  name:  string
  sport: string
}

function SegmentedControl({ options, value, onChange }: {
  options:  { label: string; value: string }[]
  value:    string
  onChange: (v: string) => void
}) {
  const t = useTheme()
  return (
    <div style={{
      display:         'flex',
      borderRadius:    7,
      border:          '1px solid oklch(30% 0.01 228)',
      overflow:        'hidden',
      backgroundColor: 'oklch(18% 0.01 228)',
    }}>
      {options.map((opt, i) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex:            1,
              padding:         '9px 8px',
              border:          'none',
              borderLeft:      i > 0 ? '1px solid oklch(30% 0.01 228)' : 'none',
              backgroundColor: active ? 'oklch(25% 0.10 155)' : 'transparent',
              color:           active ? 'oklch(75% 0.16 155)' : 'oklch(75% 0.01 228)',
              fontSize:        12,
              fontWeight:      active ? 600 : 400,
              fontFamily:      'inherit',
              cursor:          'pointer',
              lineHeight:      1.3,
              transition:      'background-color 120ms ease-out, color 120ms ease-out',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function OnboardingCanchasOrganism() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const venueId      = searchParams.get('venueId') as Id<'venues'> | null

  const createCourt = useMutation(api.functions.courts.mutations.create)

  const [courts, setCourts]             = useState<AddedCourt[]>([])
  const [name, setName]                 = useState('')
  const [sport, setSport]               = useState(DEFAULT_SPORT)
  const [surface, setSurface]           = useState(DEFAULT_SURFACE)
  const [covered, setCovered]                   = useState(false)
  const [priceOverride, setPriceOverride]       = useState('')
  const [nightRateOverride, setNightRateOverride] = useState('')
  const [error, setError]               = useState<string | null>(null)
  const [adding, setAdding]             = useState(false)
  const [finishing, setFinishing]       = useState(false)

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
        name:                   name.trim(),
        sport,
        surface,
        covered,
        priceOverride:          priceOverride ? parseInt(priceOverride, 10) : undefined,
        nightRatePriceOverride: nightRateOverride ? parseInt(nightRateOverride, 10) : undefined,
      })
      setCourts((prev) => [...prev, { id: courtId, name: name.trim(), sport }])
      setName('')
      setSport(DEFAULT_SPORT)
      setSurface(DEFAULT_SURFACE)
      setCovered(false)
      setPriceOverride('')
      setNightRateOverride('')
    } catch (err: unknown) {
      const convexMessage = (err as { data?: string })?.data
      if (convexMessage === 'plan_limit_courts') {
        setError('Alcanzaste el límite de canchas en el plan gratuito.')
      } else {
        setError('Error al agregar la cancha. Intentá de nuevo.')
      }
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
                {c.sport}
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
          <SportSelect value={sport} onChange={setSport} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Superficie</label>
          <SurfaceSelect value={surface} onChange={setSurface} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Cobertura</label>
          <SegmentedControl
            options={[
              { label: 'Techada',       value: 'true'  },
              { label: 'Al aire libre', value: 'false' },
            ]}
            value={String(covered)}
            onChange={(v) => setCovered(v === 'true')}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Tarifa diurna ($ / hora, opcional)</label>
          <input
            type="text"
            inputMode="numeric"
            value={priceOverride}
            onChange={(e) => setPriceOverride(e.target.value.replace(/\D/g, ''))}
            placeholder="Hereda de la sede si no se completa"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Tarifa nocturna ($ / hora, opcional)</label>
          <input
            type="text"
            inputMode="numeric"
            value={nightRateOverride}
            onChange={(e) => setNightRateOverride(e.target.value.replace(/\D/g, ''))}
            placeholder="Hereda de la sede si no se completa"
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
