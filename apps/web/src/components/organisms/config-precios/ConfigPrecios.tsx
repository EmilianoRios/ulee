'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'tamagui'

type PolicyType = 'cancha' | 'seña' | 'completo'

export interface PricingInitialData {
  pricePerHour:        number
  currency:            'ARS'
  depositPercentage:   number | undefined
  nightRatePrice:      number | undefined
  nightRateStart:      string | undefined
  chargePolicy:        'on_arrival' | 'on_booking_deposit' | 'on_booking_full' | undefined
  bookingWindowDays:   number | undefined
  balanceDeadlineDays: number | undefined
  allowedDurations:    number[] | undefined
}

interface PreciosForm {
  tarifaDiurna:   string
  tarifaNocturna: string
  inicioNocturno: string
  politicaCobro:  PolicyType
  porcentajeSeña: string
  ventanaReserva: number
  deadlineSaldo:  number
  umbralForzado:  number
  duraciones:     number[]
}

// chargePolicy DB literal → UI label
const SCHEMA_TO_POLICY: Record<string, PolicyType> = {
  on_arrival:          'cancha',
  on_booking_deposit:  'seña',
  on_booking_full:     'completo',
}

// UI label → DB literal
const POLICY_TO_SCHEMA: Record<PolicyType, 'on_arrival' | 'on_booking_deposit' | 'on_booking_full'> = {
  cancha:   'on_arrival',
  seña:     'on_booking_deposit',
  completo: 'on_booking_full',
}

const POLITICA_OPTS: { value: PolicyType; label: string; desc: string }[] = [
  { value: 'cancha',   label: 'Paga en cancha',  desc: 'El cliente no paga al reservar. Abona presencialmente.' },
  { value: 'seña',     label: 'Seña parcial',     desc: 'El cliente paga un porcentaje al reservar. El saldo lo abona en cancha.' },
  { value: 'completo', label: 'Pago completo',    desc: 'El cliente abona el 100% al momento de la reserva.' },
]

const DURACIONES = [60, 90, 120]

interface Props {
  formId:        string
  onDirtyChange: (dirty: boolean) => void
  onSaved:       () => void
  initialData:   PricingInitialData | null
  onSubmit:      (data: PricingInitialData) => Promise<void>
}

function adaptInitialDataToForm(data: PricingInitialData): PreciosForm {
  return {
    tarifaDiurna:   String(data.pricePerHour),
    tarifaNocturna: data.nightRatePrice !== undefined ? String(data.nightRatePrice) : '',
    inicioNocturno: data.nightRateStart ?? '19:00',
    politicaCobro:  data.chargePolicy ? (SCHEMA_TO_POLICY[data.chargePolicy] ?? 'seña') : 'seña',
    porcentajeSeña: data.depositPercentage !== undefined ? String(data.depositPercentage) : '30',
    ventanaReserva: data.bookingWindowDays ?? 30,
    deadlineSaldo:  data.balanceDeadlineDays ?? 3,
    umbralForzado:  0,
    duraciones:     data.allowedDurations ?? [60, 90],
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title:        string
  description?: string
  children:     React.ReactNode
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val, lineHeight: 1.3 }}>
          {title}
        </span>
        {description && (
          <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1.5 }}>
            {description}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </div>
  )
}

function FormField({ label, hint, children }: {
  label:    string
  hint?:    string
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, letterSpacing: '0.02em', lineHeight: 1 }}>
        {label}
      </label>
      {children}
      {hint && (
        <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1.5 }}>
          {hint}
        </span>
      )}
    </div>
  )
}

function RadioOption({ option, selected, onSelect }: {
  option:   typeof POLITICA_OPTS[number]
  selected: boolean
  onSelect: () => void
}) {
  const t = useTheme()
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') onSelect() }}
      style={{
        display:         'flex',
        gap:             12,
        padding:         '12px 14px',
        borderRadius:    7,
        border:          `1px solid ${selected ? t.verdeCancha.val : t.bordeNeutral.val}`,
        backgroundColor: selected ? t.verdeCanchaActivo.val : 'transparent',
        cursor:          'pointer',
        transition:      'border-color 150ms ease-out, background-color 150ms ease-out',
        userSelect:      'none',
      }}
    >
      <div style={{
        width:           16,
        height:          16,
        borderRadius:    '50%',
        border:          `2px solid ${selected ? t.verdeCancha.val : t.bordeNeutral.val}`,
        flexShrink:      0,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        marginTop:       3,
        transition:      'border-color 150ms ease-out',
      }}>
        {selected && (
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: t.verdeCancha.val }} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: t.textoPrimario.val, lineHeight: 1.3 }}>
          {option.label}
        </span>
        <span style={{ fontSize: 12, color: t.textoMuted.val, lineHeight: 1.4 }}>
          {option.desc}
        </span>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConfigPrecios({ formId, onDirtyChange, onSaved, initialData, onSubmit }: Props) {
  const t = useTheme()

  const EMPTY_FORM: PreciosForm = {
    tarifaDiurna:   '',
    tarifaNocturna: '',
    inicioNocturno: '19:00',
    politicaCobro:  'seña',
    porcentajeSeña: '30',
    ventanaReserva: 30,
    deadlineSaldo:  3,
    umbralForzado:  0,
    duraciones:     [60, 90],
  }

  const [form, setForm] = useState<PreciosForm>(
    initialData ? adaptInitialDataToForm(initialData) : EMPTY_FORM
  )
  const serverSnapshot = useRef<PreciosForm | null>(
    initialData ? adaptInitialDataToForm(initialData) : null
  )

  useEffect(() => {
    if (initialData === null) return
    const adapted = adaptInitialDataToForm(initialData)
    serverSnapshot.current = adapted
    setForm(adapted)
  }, [initialData])

  useEffect(() => {
    if (serverSnapshot.current === null) {
      onDirtyChange(false)
      return
    }
    onDirtyChange(JSON.stringify(form) !== JSON.stringify(serverSnapshot.current))
  }, [form, onDirtyChange])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!initialData) return
    const data: PricingInitialData = {
      pricePerHour:        Number(form.tarifaDiurna) || 0,
      currency:            'ARS',
      depositPercentage:   form.politicaCobro === 'seña' ? Number(form.porcentajeSeña) || undefined : undefined,
      nightRatePrice:      form.tarifaNocturna !== '' ? Number(form.tarifaNocturna) : undefined,
      nightRateStart:      form.inicioNocturno || undefined,
      chargePolicy:        POLICY_TO_SCHEMA[form.politicaCobro],
      bookingWindowDays:   form.ventanaReserva,
      balanceDeadlineDays: form.politicaCobro === 'seña' ? form.deadlineSaldo : undefined,
      allowedDurations:    form.duraciones.length > 0 ? form.duraciones : undefined,
    }
    await onSubmit(data)
    onSaved()
  }

  function toggleDuracion(mins: number) {
    setForm(f => ({
      ...f,
      duraciones: f.duraciones.includes(mins)
        ? f.duraciones.filter(d => d !== mins)
        : [...f.duraciones, mins].sort((a, b) => a - b),
    }))
  }

  const disabled = initialData === null

  const inputBase: React.CSSProperties = {
    width:           '100%',
    padding:         '9px 12px',
    borderRadius:    7,
    border:          `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: disabled ? t.superficie.val : t.superficieContenido.val,
    color:           disabled ? t.textoInactivo.val : t.textoPrimario.val,
    fontSize:        13,
    fontFamily:      'inherit',
    outline:         'none',
    boxSizing:       'border-box',
    transition:      'border-color 150ms ease-out',
  }

  const numInput: React.CSSProperties = {
    ...inputBase,
    width: 80,
    textAlign: 'right',
  }

  const timeInput: React.CSSProperties = {
    ...inputBase,
    width:  120,
    cursor: disabled ? 'default' : 'pointer',
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 32, opacity: disabled ? 0.5 : 1 }}
    >
      {/* ── Tarifas ── */}
      <Section title="Tarifas">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Tarifa diurna ($ / hora)">
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: t.textoMuted.val, fontWeight: 500, pointerEvents: 'none',
              }}>$</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.tarifaDiurna}
                disabled={disabled}
                onChange={(e) => setForm(f => ({ ...f, tarifaDiurna: e.target.value.replace(/\D/g, '') }))}
                style={{ ...inputBase, paddingLeft: 24 }}
                onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
              />
            </div>
          </FormField>

          <FormField label="Tarifa nocturna ($ / hora)">
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: t.textoMuted.val, fontWeight: 500, pointerEvents: 'none',
              }}>$</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.tarifaNocturna}
                disabled={disabled}
                onChange={(e) => setForm(f => ({ ...f, tarifaNocturna: e.target.value.replace(/\D/g, '') }))}
                style={{ ...inputBase, paddingLeft: 24 }}
                onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
              />
            </div>
          </FormField>
        </div>

        <FormField
          label="Inicio del horario nocturno"
          hint="A partir de este horario se aplica la tarifa nocturna automáticamente."
        >
          <input
            type="time"
            value={form.inicioNocturno}
            disabled={disabled}
            onChange={(e) => setForm(f => ({ ...f, inicioNocturno: e.target.value }))}
            style={timeInput}
            onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />
        </FormField>
      </Section>

      <div style={{ height: 1, backgroundColor: t.divisor.val }} />

      {/* ── Política de cobro ── */}
      <Section title="Política de cobro">
        <div role="radiogroup" aria-label="Política de cobro" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {POLITICA_OPTS.map(opt => (
            <RadioOption
              key={opt.value}
              option={opt}
              selected={form.politicaCobro === opt.value}
              onSelect={() => { if (!disabled) setForm(f => ({ ...f, politicaCobro: opt.value })) }}
            />
          ))}
        </div>

        {form.politicaCobro === 'seña' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4 }}>
            <FormField
              label="Porcentaje de seña (%)"
              hint="El cliente paga este porcentaje al reservar. Ejemplo: 30 = el 30% del total."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="1"
                  max="99"
                  step="0.1"
                  value={form.porcentajeSeña}
                  disabled={disabled}
                  onChange={(e) => setForm(f => ({ ...f, porcentajeSeña: e.target.value }))}
                  style={numInput}
                  onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = t.verdeCancha.val }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
                />
                <span style={{ fontSize: 13, color: t.textoMuted.val }}>%</span>
              </div>
            </FormField>
          </div>
        )}
      </Section>

      <div style={{ height: 1, backgroundColor: t.divisor.val }} />

      {/* ── Ventana de reserva ── */}
      <Section
        title="Ventana de reserva"
        description="Con cuántos días de anticipación máxima puede reservar un cliente."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min="1"
            max="365"
            value={form.ventanaReserva}
            disabled={disabled}
            onChange={(e) => setForm(f => ({ ...f, ventanaReserva: Number(e.target.value) }))}
            style={numInput}
            onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />
          <span style={{ fontSize: 13, color: t.textoMuted.val }}>días</span>
        </div>
      </Section>

      {form.politicaCobro === 'seña' && (
        <>
          <div style={{ height: 1, backgroundColor: t.divisor.val }} />

          <Section
            title="Deadline de saldo"
            description="Para reservas con seña, cuántos días antes del turno el cliente debe completar el pago total."
          >
            <FormField label="Plazo para completar el pago">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={form.deadlineSaldo}
                  disabled={disabled}
                  onChange={(e) => setForm(f => ({ ...f, deadlineSaldo: Number(e.target.value) }))}
                  style={numInput}
                  onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = t.verdeCancha.val }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
                />
                <span style={{ fontSize: 13, color: t.textoMuted.val }}>días antes del turno</span>
              </div>
            </FormField>

            <FormField
              label="Pago completo forzado a partir de"
              hint="Si el cliente reserva con más anticipación que este umbral, se le exige pago completo en lugar de seña."
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  min="0"
                  max={form.ventanaReserva}
                  value={form.umbralForzado}
                  disabled={disabled}
                  onChange={(e) => setForm(f => ({ ...f, umbralForzado: Number(e.target.value) }))}
                  style={numInput}
                  onFocus={(e) => { if (!disabled) e.currentTarget.style.borderColor = t.verdeCancha.val }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
                />
                <span style={{ fontSize: 13, color: t.textoMuted.val }}>días de antelación</span>
              </div>
            </FormField>
          </Section>
        </>
      )}

      <div style={{ height: 1, backgroundColor: t.divisor.val }} />

      {/* ── Duraciones permitidas ── */}
      <Section
        title="Duraciones de reserva"
        description="Cuánto tiempo puede elegir el cliente al hacer una reserva."
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DURACIONES.map(mins => {
            const selected = form.duraciones.includes(mins)
            return (
              <button
                key={mins}
                type="button"
                disabled={disabled}
                onClick={() => toggleDuracion(mins)}
                style={{
                  padding:         '8px 18px',
                  borderRadius:    7,
                  border:          `1px solid ${selected ? t.verdeCancha.val : t.bordeNeutral.val}`,
                  backgroundColor: selected ? t.verdeCanchaActivo.val : 'transparent',
                  color:           selected ? t.verdeCanchaProfundo.val : t.textoPrimario.val,
                  fontSize:        13,
                  fontWeight:      selected ? 500 : 400,
                  fontFamily:      'inherit',
                  cursor:          disabled ? 'default' : 'pointer',
                  transition:      'all 120ms ease-out',
                  userSelect:      'none',
                }}
              >
                {mins} min
              </button>
            )
          })}
        </div>
      </Section>
    </form>
  )
}
