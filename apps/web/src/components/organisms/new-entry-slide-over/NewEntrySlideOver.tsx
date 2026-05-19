'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'tamagui'
import { X, ChevronDown } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@canchero/backend'
import type { Id } from '@canchero/backend'
import type { Court } from '@/components/atoms/reservation-card'

export type EntryType = 'reserva' | 'mantenimiento' | 'evento' | 'recurrente'

interface NewEntrySlideOverProps {
  open:            boolean
  defaultType?:    EntryType
  initialTime?:    string
  initialCourtId?: string
  courts:          Court[]
  initialDate:     Date
  venueId:         Id<'venues'> | null
  onClose:         () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toInputDate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const SUBMIT_LABEL: Record<EntryType, string> = {
  reserva:       'Guardar reserva',
  mantenimiento: 'Guardar',
  evento:        'Agregar evento',
  recurrente:    'Crear turno fijo',
}

const TAB_OPTIONS: { type: EntryType; label: string }[] = [
  { type: 'reserva',       label: 'Reserva' },
  { type: 'mantenimiento', label: 'Mantenimiento' },
  { type: 'evento',        label: 'Evento' },
  { type: 'recurrente',    label: 'Recurrente' },
]

const STATE_TO_STATUS: Record<'señado' | 'pagado', 'deposit_paid' | 'paid'> = {
  señado: 'deposit_paid',
  pagado: 'paid',
}

const DIAS_SEMANA = [
  { key: 'lun', label: 'L' },
  { key: 'mar', label: 'M' },
  { key: 'mie', label: 'X' },
  { key: 'jue', label: 'J' },
  { key: 'vie', label: 'V' },
  { key: 'sab', label: 'S' },
  { key: 'dom', label: 'D' },
]

function borderColor(t: ReturnType<typeof useTheme>, focused: boolean, error?: string): string {
  if (error)   return 'oklch(65% 0.15 25)'
  if (focused) return 'oklch(50% 0.18 155)'
  return t.bordeNeutral.val
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, marginBottom: 5, letterSpacing: '0.02em' }}>
        {label}
        {required && <span style={{ color: 'oklch(55% 0.18 25)', marginLeft: 2 }}>*</span>}
      </div>
      {children}
      {error && (
        <div style={{ fontSize: 11, color: 'oklch(50% 0.18 25)', marginTop: 4, lineHeight: 1.4 }}>
          {error}
        </div>
      )}
    </div>
  )
}

function TxtInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '8px 11px', borderRadius: 7,
        border: `1.5px solid ${borderColor(t, focused, error)}`,
        backgroundColor: t.superficieContenido.val, fontSize: 13,
        color: t.textoPrimario.val, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 120ms ease-out',
      }}
    />
  )
}

function NumInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '8px 11px', borderRadius: 7,
        border: `1.5px solid ${borderColor(t, focused, error)}`,
        backgroundColor: t.superficieContenido.val, fontSize: 13,
        color: t.textoPrimario.val, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 120ms ease-out',
      }}
    />
  )
}

function DateInput({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: string
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '8px 11px', borderRadius: 7,
        border: `1.5px solid ${borderColor(t, focused, error)}`,
        backgroundColor: t.superficieContenido.val, fontSize: 13,
        color: t.textoPrimario.val, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 120ms ease-out',
      }}
    />
  )
}

function TimeInput({ value, onChange, error }: {
  value: string; onChange: (v: string) => void; error?: string
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '8px 11px', borderRadius: 7,
        border: `1.5px solid ${borderColor(t, focused, error)}`,
        backgroundColor: t.superficieContenido.val, fontSize: 13,
        color: t.textoPrimario.val, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', transition: 'border-color 120ms ease-out',
      }}
    />
  )
}

function SelectInput({ value, onChange, options, error }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; error?: string
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '8px 32px 8px 11px', borderRadius: 7,
          border: `1.5px solid ${borderColor(t, focused, error)}`,
          backgroundColor: t.superficieContenido.val, fontSize: 13,
          color: t.textoPrimario.val, outline: 'none', boxSizing: 'border-box',
          fontFamily: 'inherit', appearance: 'none', cursor: 'pointer',
          transition: 'border-color 120ms ease-out',
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div style={{
        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: t.textoMuted.val, display: 'flex', alignItems: 'center',
      }}>
        <ChevronDown size={14} strokeWidth={2} />
      </div>
    </div>
  )
}

function TxtArea({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string
}) {
  const t = useTheme()
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '8px 11px', borderRadius: 7,
        border: `1.5px solid ${borderColor(t, focused, error)}`,
        backgroundColor: t.superficieContenido.val, fontSize: 13,
        color: t.textoPrimario.val, outline: 'none', boxSizing: 'border-box',
        fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5, minHeight: 56,
        transition: 'border-color 120ms ease-out',
      }}
    />
  )
}

function RadioGroup({ value, onChange, options }: {
  value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 7, fontFamily: 'inherit',
              border: `1.5px solid ${active ? 'oklch(50% 0.18 155)' : t.bordeNeutral.val}`,
              backgroundColor: active ? 'oklch(85% 0.058 155)' : t.superficieContenido.val,
              color: active ? 'oklch(32% 0.17 155)' : t.textoPrimario.val,
              fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer',
              transition: 'all 120ms ease-out',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Compound field: time range ───────────────────────────────────────────────

function TimeRangeField({ inicio, onInicio, fin, onFin, errorInicio, errorFin }: {
  inicio: string; onInicio: (v: string) => void
  fin: string;   onFin:    (v: string) => void
  errorInicio?: string; errorFin?: string
}) {
  const t = useTheme()
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, marginBottom: 5, letterSpacing: '0.02em' }}>
        Horario <span style={{ color: 'oklch(55% 0.18 25)', marginLeft: 2 }}>*</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}><TimeInput value={inicio} onChange={onInicio} error={errorInicio} /></div>
        <span style={{ color: t.textoMuted.val, fontSize: 13, flexShrink: 0, userSelect: 'none' }}>→</span>
        <div style={{ flex: 1 }}><TimeInput value={fin} onChange={onFin} error={errorFin} /></div>
      </div>
      {(errorInicio || errorFin) && (
        <div style={{ fontSize: 11, color: 'oklch(50% 0.18 25)', marginTop: 4 }}>
          {errorInicio || errorFin}
        </div>
      )}
    </div>
  )
}

// ─── Form content ─────────────────────────────────────────────────────────────

function FormContent({ type, courts, initialDate, initialTime, initialCourtId, venueId, onClose }: {
  type:            EntryType
  courts:          Court[]
  initialDate:     Date
  initialTime?:    string
  initialCourtId?: string
  venueId:         Id<'venues'> | null
  onClose:         () => void
}) {
  const t = useTheme()

  const createReservation = useMutation(api.functions.reservations.mutations.create)

  const defaultCourtId  = initialCourtId ?? courts[0]?.id ?? ''
  const defaultInicio   = initialTime ?? '09:00'
  const defaultFin      = initialTime ? addMinutes(initialTime, 90) : '10:30'

  const [errors,      setErrors]      = useState<Record<string, string>>({})
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Shared fields
  const [courtId,    setCourtId]    = useState(defaultCourtId)
  const [fecha,      setFecha]      = useState(toInputDate(initialDate))
  const [horaInicio, setHoraInicio] = useState(defaultInicio)
  const [horaFin,    setHoraFin]    = useState(defaultFin)
  const [notas,      setNotas]      = useState('')

  // Reserva
  const [cliente,  setCliente]  = useState('')
  const [telefono, setTelefono] = useState('')
  const [monto,    setMonto]    = useState('')
  const [estado,   setEstado]   = useState<'señado' | 'pagado'>('señado')

  // Mantenimiento
  const [descripcion, setDescripcion] = useState('')

  // Evento
  const [nombreEvento, setNombreEvento] = useState('')
  const [montoEvento,  setMontoEvento]  = useState('')

  // Recurrente
  const [frecuencia,     setFrecuencia]     = useState<'semanal' | 'mensual' | 'anual'>('semanal')
  const [diasSemana,     setDiasSemana]     = useState<string[]>([])
  const [diaDelMes,      setDiaDelMes]      = useState('')
  const [fechaVenc,      setFechaVenc]      = useState('')
  const [sinVencimiento, setSinVencimiento] = useState(false)

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (type === 'reserva') {
      if (!cliente.trim())  errs.cliente   = 'El nombre del cliente es obligatorio'
      if (!telefono.trim()) errs.telefono  = 'El teléfono del cliente es obligatorio'
      if (!courtId)         errs.courtId   = 'Seleccioná una cancha'
      if (!horaInicio)      errs.horaInicio = 'Requerido'
      if (!horaFin)         errs.horaFin   = 'Requerido'
      if (!monto)           errs.monto     = 'Ingresá el monto'
    }
    if (type === 'mantenimiento') {
      if (!descripcion.trim()) errs.descripcion = 'La descripción es obligatoria'
      if (!courtId)            errs.courtId     = 'Seleccioná una cancha'
      if (!horaInicio)         errs.horaInicio  = 'Requerido'
      if (!horaFin)            errs.horaFin     = 'Requerido'
    }
    if (type === 'evento') {
      if (!nombreEvento.trim()) errs.nombreEvento = 'El nombre del evento es obligatorio'
      if (!courtId)             errs.courtId      = 'Seleccioná una cancha'
      if (!horaInicio)          errs.horaInicio   = 'Requerido'
      if (!horaFin)             errs.horaFin      = 'Requerido'
    }
    if (type === 'recurrente') {
      if (!cliente.trim())                          errs.cliente    = 'El nombre del cliente es obligatorio'
      if (!courtId)                                 errs.courtId    = 'Seleccioná una cancha'
      if (!horaInicio)                              errs.horaInicio = 'Requerido'
      if (!horaFin)                                 errs.horaFin    = 'Requerido'
      if (!monto)                                   errs.monto      = 'Ingresá el monto'
      if (!fecha)                                   errs.fecha      = 'Requerido'
      if (frecuencia === 'semanal' && diasSemana.length === 0) errs.diasSemana = 'Seleccioná al menos un día'
      if (frecuencia === 'mensual' && !diaDelMes)   errs.diaDelMes  = 'Requerido'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    if (!venueId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      if (type === 'reserva' || type === 'recurrente') {
        await createReservation({
          venueId,
          courtId:     courtId as Id<'courts'>,
          date:        fecha,
          startTime:   horaInicio,
          endTime:     horaFin,
          clientName:  cliente,
          clientPhone: telefono,
          totalAmount: Number(monto),
          status:      STATE_TO_STATUS[estado],
          notes:       notas || undefined,
        })
      } else if (type === 'mantenimiento') {
        await createReservation({
          venueId,
          courtId:     courtId as Id<'courts'>,
          date:        fecha,
          startTime:   horaInicio,
          endTime:     horaFin,
          clientName:  descripcion,
          clientPhone: '',
          totalAmount: 0,
          status:      'maintenance',
          notes:       notas || undefined,
        })
      } else if (type === 'evento') {
        await createReservation({
          venueId,
          courtId:     courtId as Id<'courts'>,
          date:        fecha,
          startTime:   horaInicio,
          endTime:     horaFin,
          clientName:  nombreEvento,
          clientPhone: '',
          totalAmount: montoEvento ? Number(montoEvento) : 0,
          status:      'event',
          notes:       notas || undefined,
        })
      }
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  const courtOptions = courts.map((c) => ({ value: c.id, label: c.name }))

  // Shared layout pieces
  const whereWhenBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 10 }}>
        <Field label="Cancha" required error={errors.courtId}>
          <SelectInput value={courtId} onChange={setCourtId} options={courtOptions} error={errors.courtId} />
        </Field>
        <Field label="Fecha" required>
          <DateInput value={fecha} onChange={setFecha} />
        </Field>
      </div>
      <TimeRangeField
        inicio={horaInicio} onInicio={setHoraInicio}
        fin={horaFin}       onFin={setHoraFin}
        errorInicio={errors.horaInicio} errorFin={errors.horaFin}
      />
    </div>
  )

  const notasBlock = (
    <Field label="Notas">
      <TxtArea value={notas} onChange={setNotas} placeholder="Observaciones opcionales..." />
    </Field>
  )

  return (
    <>
      {/* Body */}
      <div className="calendar-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {type === 'reserva' && (
            <>
              {/* Quién */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 10 }}>
                <Field label="Cliente" required error={errors.cliente}>
                  <TxtInput value={cliente} onChange={setCliente} placeholder="Nombre" error={errors.cliente} />
                </Field>
                <Field label="Teléfono" required error={errors.telefono}>
                  <TxtInput value={telefono} onChange={setTelefono} placeholder="11 4523-8891" error={errors.telefono} />
                </Field>
              </div>

              {/* Dónde / cuándo */}
              {whereWhenBlock}

              {/* Pago */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Monto ($)" required error={errors.monto}>
                  <NumInput value={monto} onChange={setMonto} placeholder="4500" error={errors.monto} />
                </Field>
                <Field label="Estado inicial" required>
                  <RadioGroup
                    value={estado}
                    onChange={(v) => setEstado(v as 'señado' | 'pagado')}
                    options={[{ value: 'señado', label: 'Señado' }, { value: 'pagado', label: 'Pagado' }]}
                  />
                </Field>
              </div>

              {notasBlock}
            </>
          )}

          {type === 'mantenimiento' && (
            <>
              <Field label="Descripción" required error={errors.descripcion}>
                <TxtInput value={descripcion} onChange={setDescripcion} placeholder="Limpieza, pintura de líneas..." error={errors.descripcion} />
              </Field>

              {whereWhenBlock}

              {notasBlock}
            </>
          )}

          {type === 'evento' && (
            <>
              <Field label="Nombre del evento" required error={errors.nombreEvento}>
                <TxtInput value={nombreEvento} onChange={setNombreEvento} placeholder="Clínica pádel — Prof. Herrera" error={errors.nombreEvento} />
              </Field>

              {whereWhenBlock}

              <Field label="Monto ($)">
                <NumInput value={montoEvento} onChange={setMontoEvento} placeholder="7200" />
              </Field>

              {notasBlock}
            </>
          )}

          {type === 'recurrente' && (
            <>
              {/* Quién */}
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 10 }}>
                <Field label="Cliente" required error={errors.cliente}>
                  <TxtInput value={cliente} onChange={setCliente} placeholder="Nombre" error={errors.cliente} />
                </Field>
                <Field label="Teléfono">
                  <TxtInput value={telefono} onChange={setTelefono} placeholder="11 4523-8891" />
                </Field>
              </div>

              {/* Cancha y horario */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Cancha" required error={errors.courtId}>
                  <SelectInput value={courtId} onChange={setCourtId} options={courtOptions} error={errors.courtId} />
                </Field>
                <TimeRangeField
                  inicio={horaInicio} onInicio={setHoraInicio}
                  fin={horaFin}       onFin={setHoraFin}
                  errorInicio={errors.horaInicio} errorFin={errors.horaFin}
                />
              </div>

              {/* Frecuencia */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Frecuencia" required>
                  <RadioGroup
                    value={frecuencia}
                    onChange={(v) => { setFrecuencia(v as typeof frecuencia); setDiasSemana([]); setDiaDelMes('') }}
                    options={[
                      { value: 'semanal', label: 'Semanal' },
                      { value: 'mensual', label: 'Mensual' },
                      { value: 'anual',   label: 'Anual'   },
                    ]}
                  />
                </Field>

                {frecuencia === 'semanal' && (
                  <Field label="Días" required error={errors.diasSemana}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {DIAS_SEMANA.map(({ key, label }) => {
                        const selected = diasSemana.includes(key)
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setDiasSemana((prev) =>
                              prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
                            )}
                            style={{
                              flex: 1, height: 36, borderRadius: 7, fontFamily: 'inherit',
                              border: `1.5px solid ${selected ? 'oklch(50% 0.18 155)' : t.bordeNeutral.val}`,
                              backgroundColor: selected ? 'oklch(85% 0.058 155)' : t.superficieContenido.val,
                              color: selected ? 'oklch(32% 0.17 155)' : t.textoPrimario.val,
                              fontSize: 13, fontWeight: selected ? 700 : 400,
                              cursor: 'pointer', transition: 'all 120ms ease-out',
                            }}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </Field>
                )}

                {frecuencia === 'mensual' && (
                  <Field label="Día del mes" required error={errors.diaDelMes}>
                    <NumInput value={diaDelMes} onChange={setDiaDelMes} placeholder="15" error={errors.diaDelMes} />
                  </Field>
                )}
              </div>

              {/* Vigencia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Fecha de inicio" required error={errors.fecha}>
                  <DateInput value={fecha} onChange={setFecha} error={errors.fecha} />
                </Field>
                <Field label="Vencimiento">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {!sinVencimiento && (
                      <DateInput value={fechaVenc} onChange={setFechaVenc} />
                    )}
                    <button
                      type="button"
                      onClick={() => { setSinVencimiento((v) => !v); setFechaVenc('') }}
                      style={{
                        padding: '7px 11px', borderRadius: 7, fontFamily: 'inherit',
                        border: `1.5px solid ${sinVencimiento ? 'oklch(50% 0.18 155)' : t.bordeNeutral.val}`,
                        backgroundColor: sinVencimiento ? 'oklch(85% 0.058 155)' : 'transparent',
                        color: sinVencimiento ? 'oklch(32% 0.17 155)' : t.textoMuted.val,
                        fontSize: 12, fontWeight: sinVencimiento ? 600 : 400,
                        cursor: 'pointer', textAlign: 'left', transition: 'all 120ms ease-out',
                      }}
                    >
                      {sinVencimiento ? '✓ Sin vencimiento' : 'Sin vencimiento'}
                    </button>
                  </div>
                </Field>
              </div>

              {/* Pago */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Monto por turno ($)" required error={errors.monto}>
                  <NumInput value={monto} onChange={setMonto} placeholder="9600" error={errors.monto} />
                </Field>
                <Field label="Estado inicial" required>
                  <RadioGroup
                    value={estado}
                    onChange={(v) => setEstado(v as 'señado' | 'pagado')}
                    options={[{ value: 'señado', label: 'Señado' }, { value: 'pagado', label: 'Pagado' }]}
                  />
                </Field>
              </div>

              {notasBlock}
            </>
          )}

        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 24px 24px', borderTop: `1px solid ${t.divisor.val}`,
        flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1, padding: '10px 20px', borderRadius: 7, border: 'none',
              backgroundColor: submitting ? t.verdeCanchaActivo.val : t.verdeCancha.val,
              color: submitting ? t.verdeCanchaProfundo.val : 'oklch(98% 0.004 155)',
              fontSize: 13, fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'background-color 120ms ease-out',
            }}
            onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
            onMouseLeave={(e) => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
          >
            {submitting ? 'Guardando...' : SUBMIT_LABEL[type]}
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: 7, border: `1px solid ${t.bordeNeutral.val}`,
              backgroundColor: 'transparent', color: t.textoPrimario.val,
              fontSize: 13, fontWeight: 400, cursor: 'pointer', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            Cancelar
          </button>
        </div>
        {submitError && (
          <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', lineHeight: 1.4 }}>
            {submitError}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function NewEntrySlideOver({
  open, defaultType = 'reserva', initialTime, initialCourtId,
  courts, initialDate, venueId, onClose,
}: NewEntrySlideOverProps) {
  const t = useTheme()

  const [activeType, setActiveType] = useState<EntryType>(defaultType)
  const [formKey,    setFormKey]    = useState(0)

  useEffect(() => {
    if (open) {
      setActiveType(defaultType)
      setFormKey((k) => k + 1)
    }
  }, [open, defaultType])

  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'oklch(12% 0.01 222 / 0.28)',
          zIndex: 300, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease-out',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo ingreso"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          width: 440, height: 'min(90vh, 680px)',
          backgroundColor: t.superficieContenido.val,
          border: `1px solid ${t.bordeNeutral.val}`,
          borderRadius: 12,
          zIndex: 400, display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          opacity: open ? 1 : 0,
          transform: open
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -50%) scale(0.96)',
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 200ms ease-out, transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 12px 48px oklch(0% 0 0 / 0.12)',
        }}
      >
        {open && (
          <>
            {/* Top bar: title + X */}
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'space-between',
              padding:        '14px 16px 10px',
              flexShrink:     0,
            }}>
              <span style={{
                fontSize:      13,
                fontWeight:    600,
                color:         t.textoNav.val,
                letterSpacing: '-0.01em',
                lineHeight:    1,
              }}>
                Nueva entrada
              </span>
              <button
                onClick={onClose}
                aria-label="Cerrar panel"
                style={{
                  width:           28, height: 28, borderRadius: 6,
                  border:          `1px solid ${t.bordeNeutral.val}`,
                  backgroundColor: 'transparent', cursor: 'pointer',
                  display:         'flex', alignItems: 'center', justifyContent: 'center',
                  color:           t.textoMuted.val, flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Tab strip */}
            <div style={{
              display:      'flex',
              padding:      '0 16px',
              borderBottom: `1px solid ${t.divisor.val}`,
              flexShrink:   0,
            }}>
              {TAB_OPTIONS.map(({ type, label }) => {
                const active = activeType === type
                return (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    style={{
                      padding:         '0 12px 10px',
                      border:          'none',
                      borderBottom:    active ? `2px solid ${t.verdeCancha.val}` : '2px solid transparent',
                      backgroundColor: 'transparent',
                      color:           active ? t.textoPrimario.val : t.textoInactivo.val,
                      fontSize:        13,
                      fontWeight:      active ? 600 : 400,
                      cursor:          'pointer',
                      fontFamily:      'inherit',
                      lineHeight:      1,
                      marginBottom:    -1,
                      whiteSpace:      'nowrap',
                      transition:      'color 120ms ease-out, border-color 120ms ease-out',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Form — keyed so it remounts on tab change or reopen */}
            <FormContent
              key={`${activeType}-${formKey}`}
              type={activeType}
              courts={courts}
              initialDate={initialDate}
              initialTime={initialTime}
              initialCourtId={initialCourtId}
              venueId={venueId}
              onClose={onClose}
            />
          </>
        )}
      </div>
    </>
  )
}
