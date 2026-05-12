'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'

interface Props {
  formId:        string
  onDirtyChange: (dirty: boolean) => void
  onSaved:       () => void
}

interface HorarioDia {
  dia:      string
  activo:   boolean
  apertura: string
  cierre:   string
}

const INITIAL: HorarioDia[] = [
  { dia: 'Lunes',     activo: true,  apertura: '08:00', cierre: '23:00' },
  { dia: 'Martes',    activo: true,  apertura: '08:00', cierre: '23:00' },
  { dia: 'Miércoles', activo: true,  apertura: '08:00', cierre: '23:00' },
  { dia: 'Jueves',    activo: true,  apertura: '08:00', cierre: '23:00' },
  { dia: 'Viernes',   activo: true,  apertura: '08:00', cierre: '23:00' },
  { dia: 'Sábado',    activo: true,  apertura: '09:00', cierre: '22:00' },
  { dia: 'Domingo',   activo: false, apertura: '10:00', cierre: '20:00' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width:           36,
        height:          20,
        borderRadius:    10,
        border:          'none',
        padding:         2,
        backgroundColor: checked ? t.verdeCancha.val : t.bordeNeutral.val,
        cursor:          'pointer',
        position:        'relative',
        display:         'flex',
        alignItems:      'center',
        flexShrink:      0,
        transition:      'background-color 150ms ease-out',
      }}
    >
      <span style={{
        display:         'block',
        width:           16,
        height:          16,
        borderRadius:    '50%',
        backgroundColor: 'white',
        transform:       checked ? 'translateX(16px)' : 'translateX(0)',
        transition:      'transform 150ms ease-out',
        flexShrink:      0,
      }} />
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ConfigHorarios({ formId, onDirtyChange, onSaved }: Props) {
  const t = useTheme()
  const [horarios, setHorarios] = useState<HorarioDia[]>(INITIAL)

  useEffect(() => {
    onDirtyChange(JSON.stringify(horarios) !== JSON.stringify(INITIAL))
  }, [horarios, onDirtyChange])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSaved()
  }

  function update(idx: number, patch: Partial<HorarioDia>) {
    setHorarios(hs => hs.map((h, i) => i === idx ? { ...h, ...patch } : h))
  }

  const timeInput = (disabled: boolean): React.CSSProperties => ({
    padding:         '7px 10px',
    borderRadius:    7,
    border:          `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: disabled ? t.superficie.val : t.superficieContenido.val,
    color:           disabled ? t.textoInactivo.val : t.textoPrimario.val,
    fontSize:        13,
    fontFamily:      'inherit',
    outline:         'none',
    width:           100,
    cursor:          disabled ? 'default' : 'pointer',
    transition:      'border-color 150ms ease-out, background-color 150ms ease-out',
    boxSizing:       'border-box',
  })

  const headerLabel: React.CSSProperties = {
    fontSize:      11,
    fontWeight:    500,
    color:         t.textoMuted.val,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    lineHeight:    1,
    userSelect:    'none',
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 0 }}
    >
      {/* Column headers */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '130px 60px 1fr 1fr',
        gap:                 12,
        padding:             '0 0 10px',
        borderBottom:        `1px solid ${t.divisor.val}`,
        alignItems:          'center',
      }}>
        <span style={headerLabel}>Día</span>
        <span style={headerLabel}>Abierto</span>
        <span style={headerLabel}>Apertura</span>
        <span style={headerLabel}>Cierre</span>
      </div>

      {/* Day rows */}
      {horarios.map((h, i) => (
        <div
          key={h.dia}
          style={{
            display:             'grid',
            gridTemplateColumns: '130px 60px 1fr 1fr',
            gap:                 12,
            alignItems:          'center',
            padding:             '10px 0',
            borderBottom:        i < horarios.length - 1 ? `1px solid ${t.divisor.val}` : 'none',
            opacity:             h.activo ? 1 : 0.55,
            transition:          'opacity 150ms ease-out',
          }}
        >
          <span style={{
            fontSize:   13,
            fontWeight: h.activo ? 500 : 400,
            color:      h.activo ? t.textoPrimario.val : t.textoInactivo.val,
            lineHeight: 1,
            transition: 'color 150ms ease-out',
          }}>
            {h.dia}
          </span>

          <Toggle
            checked={h.activo}
            onChange={(v) => update(i, { activo: v })}
          />

          <input
            type="time"
            value={h.apertura}
            disabled={!h.activo}
            onChange={(e) => update(i, { apertura: e.target.value })}
            style={timeInput(!h.activo)}
            onFocus={(e) => { if (h.activo) e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />

          <input
            type="time"
            value={h.cierre}
            disabled={!h.activo}
            onChange={(e) => update(i, { cierre: e.target.value })}
            style={timeInput(!h.activo)}
            onFocus={(e) => { if (h.activo) e.currentTarget.style.borderColor = t.verdeCancha.val }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = t.bordeNeutral.val }}
          />
        </div>
      ))}

      <p style={{
        fontSize:   12,
        color:      t.textoMuted.val,
        lineHeight: 1.5,
        margin:     '16px 0 0',
      }}>
        Estos son los horarios generales de la sede. Podés configurar horarios específicos por cancha en el módulo Canchas.
      </p>
    </form>
  )
}
