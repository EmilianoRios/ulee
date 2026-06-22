'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'
import { X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@canchero/backend'
import type { Doc, Id } from '@canchero/backend'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VenueSlideOverProps {
  venue:   Doc<'venues'> | null
  isOpen:  boolean
  onClose: () => void
  onCreated?: (id: Id<'venues'>) => void
}

// ─── Default form ─────────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
  dayOfWeek,
  active:    true,
  openTime:  480,  // 08:00 in minutes
  closeTime: 1320, // 22:00 in minutes
}))

const DEFAULT_FORM = {
  name:         '',
  address:      '',
  phone:        '',
  description:  '',
  email:        '',
  pricePerHour: '',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, required, children }: {
  label:    string
  required?: boolean
  children: React.ReactNode
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize:      12,
        fontWeight:    500,
        color:         t.textoMuted.val,
        letterSpacing: '0.02em',
        display:       'flex',
        alignItems:    'center',
        gap:           3,
      }}>
        {label}
        {required && (
          <span style={{ color: 'oklch(55% 0.20 25)', lineHeight: 1 }}>*</span>
        )}
      </label>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  return (
    <div style={{
      fontSize:      11,
      fontWeight:    600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color:         t.etiquetaSeccion.val,
      paddingBottom: 2,
      userSelect:    'none',
    }}>
      {children}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function VenueSlideOver({ venue, isOpen, onClose, onCreated }: VenueSlideOverProps) {
  const t = useTheme()
  const params  = useParams()
  const venueId = params?.venueId as string | undefined
  const configHref = venueId ? `/${venueId}/configuracion` : '/configuracion'

  const createVenue  = useMutation(api.functions.venues.mutations.create)
  const updateVenue  = useMutation(api.functions.venues.mutations.update)
  const updatePricing = useMutation(api.functions.venues.mutations.updatePricing)

  const [form,    setForm]    = useState(DEFAULT_FORM)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const isNew = venue === null

  // ── Populate on open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    if (venue) {
      setForm({
        name:         venue.name,
        address:      venue.address,
        phone:        venue.phone,
        description:  venue.description  ?? '',
        email:        venue.email        ?? '',
        pricePerHour: String(venue.pricingConfig.pricePerHour),
      })
    } else {
      setForm(DEFAULT_FORM)
    }
    setError(null)
  }, [isOpen, venue?._id])

  // ── Escape key ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      setError('Nombre, dirección y teléfono son obligatorios.')
      return
    }

    const price = parseInt(form.pricePerHour.replace(/\D/g, ''), 10)
    if (isNaN(price) || price < 0) {
      setError('El precio por hora debe ser un número válido.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isNew) {
        const newId = await createVenue({
          name:          form.name.trim(),
          address:       form.address.trim(),
          phone:         form.phone.trim(),
          description:   form.description.trim() || undefined,
          email:         form.email.trim()        || undefined,
          schedule:      DEFAULT_SCHEDULE,
          pricingConfig: { pricePerHour: price, currency: 'ARS' },
        })
        onCreated?.(newId)
      } else {
        await updateVenue({
          venueId:     venue._id,
          name:        form.name.trim()        || undefined,
          address:     form.address.trim()     || undefined,
          phone:       form.phone.trim()       || undefined,
          description: form.description.trim() || undefined,
          email:       form.email.trim()       || undefined,
        })
        await updatePricing({
          venueId:       venue._id,
          pricingConfig: { pricePerHour: price, currency: 'ARS' },
        })
      }
      onClose()
    } catch (err: unknown) {
      const convexMessage = (err as { data?: string })?.data
      if (convexMessage === 'plan_limit_venues') {
        setError('Alcanzaste el límite de sedes en el plan gratuito.')
      } else {
        setError('No se pudo guardar. Intentá de nuevo.')
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
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

  const title = isNew ? 'Nueva sede' : venue.name

  // Modal for create, slide-over for edit
  const panelStyle: React.CSSProperties = isNew
    ? {
        position:        'fixed',
        top:             '50%',
        left:            '50%',
        width:           440,
        maxHeight:       'min(90vh, 680px)',
        backgroundColor: t.superficieContenido.val,
        border:          `1px solid ${t.bordeNeutral.val}`,
        borderRadius:    12,
        zIndex:          400,
        display:         'flex',
        flexDirection:   'column',
        overflow:        'hidden',
        opacity:         isOpen ? 1 : 0,
        transform:       isOpen
          ? 'translate(-50%, -50%) scale(1)'
          : 'translate(-50%, -50%) scale(0.96)',
        pointerEvents:   isOpen ? 'auto' : 'none',
        transition:      'opacity 200ms ease-out, transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow:       '0 12px 48px oklch(0% 0 0 / 0.12)',
      }
    : {
        position:        'fixed',
        top:             0,
        right:           0,
        height:          '100vh',
        width:           440,
        backgroundColor: t.superficieContenido.val,
        borderLeft:      `1px solid ${t.bordeNeutral.val}`,
        zIndex:          400,
        display:         'flex',
        flexDirection:   'column',
        transform:       isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition:      'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow:       isOpen ? '-8px 0 32px oklch(0% 0 0 / 0.06)' : 'none',
        overflow:        'hidden',
      }

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position:      'fixed',
          inset:         0,
          background:    isNew ? 'oklch(12% 0.01 222 / 0.28)' : 'oklch(12% 0.01 222 / 0.18)',
          zIndex:        300,
          opacity:       isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition:    'opacity 220ms ease-out',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={panelStyle}
      >
        {/* Header */}
        <div style={{
          display:      'flex',
          alignItems:   'center',
          padding:      '20px 24px',
          borderBottom: `1px solid ${t.divisor.val}`,
          gap:          12,
          flexShrink:   0,
        }}>
          <h2 style={{
            flex:          1,
            margin:        0,
            fontSize:      18,
            fontWeight:    600,
            color:         t.textoNav.val,
            letterSpacing: '-0.01em',
            lineHeight:    1.2,
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar panel"
            style={{
              width:           32,
              height:          32,
              borderRadius:    6,
              border:          `1px solid ${t.bordeNeutral.val}`,
              backgroundColor: 'transparent',
              cursor:          'pointer',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              color:           t.textoMuted.val,
              fontFamily:      'inherit',
              transition:      'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <div className="calendar-scroll" style={{
          flex:          1,
          overflowY:     'auto',
          padding:       '24px',
          display:       'flex',
          flexDirection: 'column',
          gap:           24,
        }}>

          {/* ── Sección: Información ─────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionLabel>Información</SectionLabel>

            <FormField label="Nombre" required>
              <input
                type="text"
                value={form.name}
                placeholder="ej. Club Los Pinos"
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                style={inputBase}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = t.bordeNeutral.val }}
              />
            </FormField>

            <FormField label="Dirección" required>
              <input
                type="text"
                value={form.address}
                placeholder="ej. Av. Corrientes 1234, CABA"
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                style={inputBase}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = t.bordeNeutral.val }}
              />
            </FormField>

            <FormField label="Teléfono" required>
              <input
                type="tel"
                value={form.phone}
                placeholder="ej. +54 9 11 1234-5678"
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                style={inputBase}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = t.bordeNeutral.val }}
              />
            </FormField>

            <FormField label="Email de contacto">
              <input
                type="email"
                value={form.email}
                placeholder="ej. info@lospinos.com.ar"
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                style={inputBase}
                onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = t.bordeNeutral.val }}
              />
            </FormField>

            <FormField label="Descripción">
              <textarea
                value={form.description}
                placeholder="Descripción breve de la sede, servicios, etc."
                rows={3}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                style={{
                  ...inputBase,
                  resize:    'vertical',
                  minHeight: 80,
                  lineHeight: '1.5',
                }}
                onFocus={(e) => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = t.verdeCancha.val }}
                onBlur={(e)  => { (e.currentTarget as HTMLTextAreaElement).style.borderColor = t.bordeNeutral.val }}
              />
            </FormField>
          </div>

          {/* ── Sección: Precios ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ height: 1, backgroundColor: t.divisor.val }} />
            <SectionLabel>Precios</SectionLabel>

            <FormField label="Precio base por hora" required>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position:      'absolute',
                  left:          12,
                  top:           '50%',
                  transform:     'translateY(-50%)',
                  fontSize:      13,
                  color:         t.textoMuted.val,
                  fontWeight:    500,
                  pointerEvents: 'none',
                  userSelect:    'none',
                }}>
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.pricePerHour}
                  placeholder="0"
                  onChange={(e) => setForm(f => ({ ...f, pricePerHour: e.target.value.replace(/\D/g, '') }))}
                  style={{ ...inputBase, paddingLeft: 24 }}
                  onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.verdeCancha.val }}
                  onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = t.bordeNeutral.val }}
                />
              </div>
            </FormField>
          </div>

          {/* ── Enlace configuración ─────────────────────────────────────── */}
          {!isNew && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ height: 1, backgroundColor: t.divisor.val }} />

              <Link
                href={configHref}
                onClick={onClose}
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  padding:         '12px 16px',
                  borderRadius:    8,
                  border:          `1px solid ${t.bordeNeutral.val}`,
                  textDecoration:  'none',
                  backgroundColor: 'transparent',
                  transition:      'background-color 150ms ease-out, border-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.backgroundColor = t.fondoHover.val
                  el.style.borderColor     = t.verdeCancha.val
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.backgroundColor = 'transparent'
                  el.style.borderColor     = t.bordeNeutral.val
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: t.textoPrimario.val, lineHeight: 1.3 }}>
                    Horarios y feriados
                  </span>
                  <span style={{ fontSize: 11, color: t.textoMuted.val, lineHeight: 1.3 }}>
                    Configurar disponibilidad en Configuración
                  </span>
                </div>
                <ArrowRight size={15} strokeWidth={2} color={t.textoMuted.val} />
              </Link>
            </div>
          )}

          {/* Error */}
          {error && (
            <span style={{ fontSize: 12, color: 'oklch(55% 0.20 25)', lineHeight: 1.4 }}>
              {error}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:    '16px 24px',
          borderTop:  `1px solid ${t.divisor.val}`,
          display:    'flex',
          gap:        8,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              flex:            1,
              padding:         '10px 16px',
              borderRadius:    7,
              border:          `1px solid ${t.bordeNeutral.val}`,
              backgroundColor: 'transparent',
              color:           t.textoPrimario.val,
              fontSize:        13,
              fontWeight:      500,
              fontFamily:      'inherit',
              cursor:          'pointer',
              transition:      'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex:            1,
              padding:         '10px 16px',
              borderRadius:    7,
              border:          'none',
              backgroundColor: saving ? t.divisor.val : t.verdeCancha.val,
              color:           'oklch(98% 0.004 155)',
              fontSize:        13,
              fontWeight:      500,
              fontFamily:      'inherit',
              cursor:          saving ? 'not-allowed' : 'pointer',
              transition:      'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val
            }}
            onMouseLeave={(e) => {
              if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val
            }}
          >
            {saving ? 'Guardando…' : isNew ? 'Crear sede' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}
