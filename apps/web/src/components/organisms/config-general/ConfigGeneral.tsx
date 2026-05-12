'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'

interface Props {
  formId:        string
  onDirtyChange: (dirty: boolean) => void
  onSaved:       () => void
}

const INITIAL = {
  nombre:      'Complejo Deportivo La Villa',
  descripcion: 'El complejo más completo del barrio. Canchas de fútbol 5, fútbol 7, pádel y tenis.',
  direccion:   'Av. Corrientes 4521, Buenos Aires',
  telefono:    '+54 11 4523-7890',
  email:       'contacto@lavilla.com.ar',
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

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, letterSpacing: '0.02em', lineHeight: 1 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConfigGeneral({ formId, onDirtyChange, onSaved }: Props) {
  const t = useTheme()
  const [form, setForm] = useState(INITIAL)

  useEffect(() => {
    onDirtyChange(JSON.stringify(form) !== JSON.stringify(INITIAL))
  }, [form, onDirtyChange])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSaved()
  }

  const inputBase: React.CSSProperties = {
    width:           '100%',
    padding:         '9px 12px',
    borderRadius:    7,
    border:          `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: t.superficieContenido.val,
    color:           t.textoPrimario.val,
    fontSize:        13,
    fontFamily:      'inherit',
    outline:         'none',
    boxSizing:       'border-box',
    transition:      'border-color 150ms ease-out',
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
    >
      <Section
        title="Datos de la sede"
        description="Esta información aparece en la app que ven tus clientes."
      >
        <FormField label="Nombre de la sede">
          <input
            type="text"
            value={form.nombre}
            placeholder="ej. Complejo Deportivo Sur"
            onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))}
            style={inputBase}
            onFocus={(e) => { e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />
        </FormField>

        <FormField label="Descripción">
          <textarea
            value={form.descripcion}
            placeholder="Describí tu complejo…"
            rows={3}
            onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
            style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5, minHeight: 80 }}
            onFocus={(e) => { e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />
        </FormField>
      </Section>

      <div style={{ height: 1, backgroundColor: t.divisor.val }} />

      <Section title="Contacto">
        <FormField label="Dirección">
          <input
            type="text"
            value={form.direccion}
            placeholder="ej. Av. Corrientes 1234, CABA"
            onChange={(e) => setForm(f => ({ ...f, direccion: e.target.value }))}
            style={inputBase}
            onFocus={(e) => { e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Teléfono / Celular">
            <input
              type="tel"
              value={form.telefono}
              placeholder="+54 11 0000-0000"
              onChange={(e) => setForm(f => ({ ...f, telefono: e.target.value }))}
              style={inputBase}
              onFocus={(e) => { e.currentTarget.style.borderColor = t.verdeCancha.val }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
            />
          </FormField>

          <FormField label="Email de contacto">
            <input
              type="email"
              value={form.email}
              placeholder="contacto@complejo.com.ar"
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputBase}
              onFocus={(e) => { e.currentTarget.style.borderColor = t.verdeCancha.val }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
            />
          </FormField>
        </div>
      </Section>
    </form>
  )
}
