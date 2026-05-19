'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'tamagui'
import { X, Plus, Camera } from 'lucide-react'
import type { Court } from '../courts-list'
import type { CourtStatus } from '../../atoms/court-status-chip'

interface CourtSlideOverProps {
  court:   Court | null
  isOpen:  boolean
  onClose: () => void
  onSave:  (data: Omit<Court, 'id' | 'todayTurnos' | 'todayRevenue'>) => void
}

// ─── Options ──────────────────────────────────────────────────────────────────

const SPORTS   = ['Fútbol 5', 'Fútbol 7', 'Fútbol 8', 'Fútbol 11', 'Pádel', 'Tenis', 'Básquet', 'Otro']
const SURFACES = ['Sintético', 'Tierra', 'Hormigón', 'Madera', 'Cemento', 'Otro']

const COVERED_OPTIONS = [
  { label: 'Techada',       value: 'true'          },
  { label: 'Al aire libre', value: 'false'          },
]

const STATUS_OPTIONS: { label: string; value: CourtStatus }[] = [
  { label: 'Activa',        value: 'active'      },
  { label: 'Inactiva',      value: 'inactive'    },
  { label: 'Mantenimiento', value: 'maintenance' },
]

const DEFAULT_FORM = {
  name:         '',
  sport:        'Fútbol 5',
  surface:      'Sintético',
  covered:      'true',
  pricePerHour: '',
  status:       'active' as CourtStatus,
  images:       [] as string[],
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, letterSpacing: '0.02em' }}>
        {label}
      </label>
      {children}
    </div>
  )
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
      border:          `1px solid ${t.bordeNeutral.val}`,
      overflow:        'hidden',
      backgroundColor: t.superficie.val,
    }}>
      {options.map((opt, i) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex:            1,
              padding:         '9px 8px',
              border:          'none',
              borderLeft:      i > 0 ? `1px solid ${t.bordeNeutral.val}` : 'none',
              backgroundColor: active ? t.verdeCanchaActivo.val : 'transparent',
              color:           active ? t.verdeCanchaProfundo.val : t.textoPrimario.val,
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CourtSlideOver({ court, isOpen, onClose, onSave }: CourtSlideOverProps) {
  const t = useTheme()

  const [form, setForm]       = useState(DEFAULT_FORM)
  const fileInputRef          = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (court) {
      setForm({
        name:         court.name,
        sport:        court.sport,
        surface:      court.surface,
        covered:      String(court.covered),
        pricePerHour: String(court.pricePerHour),
        status:       court.status,
        images:       court.images ?? [],
      })
    } else {
      setForm(DEFAULT_FORM)
    }
  }, [isOpen, court?.id])

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const isNew = court === null
  const title = isNew ? 'Nueva cancha' : court.name

  function handleSave() {
    const price = parseInt(form.pricePerHour.replace(/\D/g, ''), 10)
    if (!form.name.trim() || isNaN(price) || price <= 0) return
    onSave({
      name:         form.name.trim(),
      sport:        form.sport,
      surface:      form.surface,
      covered:      form.covered === 'true',
      pricePerHour: price,
      status:       form.status,
      images:       form.images,
    })
    onClose()
  }

  function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) setForm((f) => ({ ...f, images: [...f.images, result] }))
      }
      reader.readAsDataURL(file)
    })
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
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

  const selectBase: React.CSSProperties = {
    ...inputBase,
    cursor:              'pointer',
    appearance:          'none',
    WebkitAppearance:    'none',
    backgroundImage:     `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat:    'no-repeat',
    backgroundPosition:  'right 12px center',
    paddingRight:        36,
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
          background:    'oklch(12% 0.01 222 / 0.18)',
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
        style={{
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
        }}
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
        <div style={{
          flex:          1,
          overflowY:     'auto',
          padding:       '24px',
          display:       'flex',
          flexDirection: 'column',
          gap:           20,
        }}>
          <FormField label="Nombre de la cancha">
            <input
              type="text"
              value={form.name}
              placeholder="ej. Cancha 1, La Principal…"
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputBase}
              onFocus={(e) => { (e.currentTarget as HTMLInputElement).style.borderColor = t.verdeCancha.val }}
              onBlur={(e)  => { (e.currentTarget as HTMLInputElement).style.borderColor = t.bordeNeutral.val }}
            />
          </FormField>

          <FormField label="Deporte">
            <select
              value={form.sport}
              onChange={(e) => setForm(f => ({ ...f, sport: e.target.value }))}
              style={selectBase}
              onFocus={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = t.verdeCancha.val }}
              onBlur={(e)  => { (e.currentTarget as HTMLSelectElement).style.borderColor = t.bordeNeutral.val }}
            >
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>

          <FormField label="Superficie">
            <select
              value={form.surface}
              onChange={(e) => setForm(f => ({ ...f, surface: e.target.value }))}
              style={selectBase}
              onFocus={(e) => { (e.currentTarget as HTMLSelectElement).style.borderColor = t.verdeCancha.val }}
              onBlur={(e)  => { (e.currentTarget as HTMLSelectElement).style.borderColor = t.bordeNeutral.val }}
            >
              {SURFACES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>

          <FormField label="Cobertura">
            <SegmentedControl
              options={COVERED_OPTIONS}
              value={form.covered}
              onChange={(v) => setForm(f => ({ ...f, covered: v }))}
            />
          </FormField>

          <FormField label="Precio por hora">
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

          {!isNew && (
            <FormField label="Estado">
              <SegmentedControl
                options={STATUS_OPTIONS}
                value={form.status}
                onChange={(v) => setForm(f => ({ ...f, status: v as CourtStatus }))}
              />
            </FormField>
          )}

          {/* Fotos */}
          <FormField label="Fotos de la cancha">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {form.images.map((src, i) => (
                <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                  <img
                    src={src}
                    alt={`Foto ${i + 1}`}
                    style={{
                      width:        72,
                      height:       72,
                      borderRadius: 7,
                      objectFit:    'cover',
                      border:       `1px solid ${t.bordeNeutral.val}`,
                      display:      'block',
                    }}
                  />
                  <button
                    onClick={() => removeImage(i)}
                    aria-label="Eliminar foto"
                    style={{
                      position:        'absolute',
                      top:             -6,
                      right:           -6,
                      width:           20,
                      height:          20,
                      borderRadius:    '50%',
                      border:          `1px solid ${t.bordeNeutral.val}`,
                      backgroundColor: t.superficieContenido.val,
                      cursor:          'pointer',
                      display:         'flex',
                      alignItems:      'center',
                      justifyContent:  'center',
                      color:           t.textoMuted.val,
                      padding:         0,
                      fontFamily:      'inherit',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.superficieContenido.val }}
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </div>
              ))}

              {/* Botón agregar */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width:           form.images.length === 0 ? '100%' : 72,
                  height:          72,
                  borderRadius:    7,
                  border:          `1.5px dashed ${t.bordeNeutral.val}`,
                  backgroundColor: 'transparent',
                  cursor:          'pointer',
                  display:         'flex',
                  flexDirection:   'column',
                  alignItems:      'center',
                  justifyContent:  'center',
                  gap:             6,
                  color:           t.textoMuted.val,
                  fontFamily:      'inherit',
                  transition:      'border-color 150ms ease-out, background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.borderColor     = t.verdeCancha.val
                  btn.style.backgroundColor = t.verdeCanchaActivo.val
                }}
                onMouseLeave={(e) => {
                  const btn = e.currentTarget as HTMLButtonElement
                  btn.style.borderColor     = t.bordeNeutral.val
                  btn.style.backgroundColor = 'transparent'
                }}
              >
                {form.images.length === 0 ? (
                  <>
                    <Camera size={20} strokeWidth={1.5} />
                    <span style={{ fontSize: 12, lineHeight: 1.3, textAlign: 'center' }}>
                      Agregar fotos
                    </span>
                  </>
                ) : (
                  <Plus size={18} strokeWidth={2} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => handleImageFiles(e.target.files)}
              />
            </div>
          </FormField>
        </div>

        {/* Footer */}
        <div style={{
          padding:        '16px 24px',
          borderTop:      `1px solid ${t.divisor.val}`,
          display:        'flex',
          gap:            8,
          flexShrink:     0,
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
            style={{
              flex:            1,
              padding:         '10px 16px',
              borderRadius:    7,
              border:          'none',
              backgroundColor: t.verdeCancha.val,
              color:           'oklch(98% 0.004 155)',
              fontSize:        13,
              fontWeight:      500,
              fontFamily:      'inherit',
              cursor:          'pointer',
              transition:      'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCancha.val }}
          >
            {isNew ? 'Crear cancha' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  )
}
