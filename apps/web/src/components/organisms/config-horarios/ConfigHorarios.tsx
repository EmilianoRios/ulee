'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'tamagui'
import { TimeSelect } from '@/components/atoms/time-select'

export interface ScheduleEntry {
  dayOfWeek: number   // ISO 8601: 1=Monday … 7=Sunday
  active:    boolean
  openTime:  string   // "HH:MM"
  closeTime: string   // "HH:MM"
}

interface HorarioDia {
  dia:      string
  activo:   boolean
  apertura: string
  cierre:   string
}

interface Props {
  formId:        string
  onDirtyChange: (dirty: boolean) => void
  onSaved:       () => void
  initialData:   ScheduleEntry[] | null
  onSubmit:      (schedule: ScheduleEntry[]) => Promise<void>
}

// dayOfWeek 1=Monday, 2=Tuesday … 7=Sunday
const DAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
}

function adaptInitialDataToForm(data: ScheduleEntry[]): HorarioDia[] {
  return [...data]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map(entry => ({
      dia:      DAY_LABELS[entry.dayOfWeek] ?? `Día ${entry.dayOfWeek}`,
      activo:   entry.active,
      apertura: entry.openTime,
      cierre:   entry.closeTime,
    }))
}

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

export function ConfigHorarios({ formId, onDirtyChange, onSaved, initialData, onSubmit }: Props) {
  const t = useTheme()
  const [horarios, setHorarios] = useState<HorarioDia[]>(
    initialData ? adaptInitialDataToForm(initialData) : []
  )
  const serverSnapshot = useRef<HorarioDia[] | null>(
    initialData ? adaptInitialDataToForm(initialData) : null
  )

  useEffect(() => {
    if (initialData === null) return
    const adapted = adaptInitialDataToForm(initialData)
    serverSnapshot.current = adapted
    setHorarios(adapted)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialData)])

  useEffect(() => {
    if (serverSnapshot.current === null) {
      onDirtyChange(false)
      return
    }
    onDirtyChange(JSON.stringify(horarios) !== JSON.stringify(serverSnapshot.current))
  }, [horarios, onDirtyChange])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!initialData) return
    const schedule: ScheduleEntry[] = horarios.map((h, i) => ({
      dayOfWeek: initialData[i]?.dayOfWeek ?? i + 1,
      active:    h.activo,
      openTime:  h.apertura,
      closeTime: h.cierre,
    }))
    await onSubmit(schedule)
    onSaved()
  }

  function update(idx: number, patch: Partial<HorarioDia>) {
    setHorarios(hs => hs.map((h, i) => i === idx ? { ...h, ...patch } : h))
  }

  const disabled = initialData === null


  const headerLabel: React.CSSProperties = {
    fontSize:      11,
    fontWeight:    500,
    color:         t.textoMuted.val,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    lineHeight:    1,
    userSelect:    'none',
  }

  if (disabled) {
    return (
      <form
        id={formId}
        onSubmit={(e) => e.preventDefault()}
        style={{ display: 'flex', flexDirection: 'column', gap: 0, opacity: 0.5 }}
      >
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
      </form>
    )
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

          <TimeSelect
            value={h.apertura}
            disabled={!h.activo}
            onChange={(v) => update(i, { apertura: v })}
          />

          <TimeSelect
            value={h.cierre}
            disabled={!h.activo}
            onChange={(v) => update(i, { cierre: v })}
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
