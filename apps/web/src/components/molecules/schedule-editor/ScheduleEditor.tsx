'use client'

import { Toggle }     from '@/components/atoms/toggle'
import { TimeSelect } from '@/components/atoms/time-select'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ScheduleEntry {
  dayOfWeek: number   // ISO 8601: 1=Monday … 7=Sunday
  active:    boolean
  openTime:  string   // "HH:MM"
  closeTime: string   // "HH:MM"
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
}

const DIVIDER = '1px solid rgba(128, 128, 128, 0.2)'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ScheduleEditorProps {
  value:           ScheduleEntry[]
  onChange:        (schedule: ScheduleEntry[]) => void
  timeSelectStyle?: React.CSSProperties
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ScheduleEditor({ value, onChange, timeSelectStyle }: ScheduleEditorProps) {
  function update(idx: number, patch: Partial<ScheduleEntry>) {
    onChange(value.map((entry, i) => i === idx ? { ...entry, ...patch } : entry))
  }

  const headerLabel: React.CSSProperties = {
    fontSize:      11,
    fontWeight:    500,
    color:         'inherit',
    opacity:       0.5,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    lineHeight:    1,
    userSelect:    'none',
  }

  return (
    <div style={{ color: 'inherit' }}>
      {/* Column headers */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '130px 60px 1fr 1fr',
        gap:                 12,
        padding:             '0 0 10px',
        borderBottom:        DIVIDER,
        alignItems:          'center',
      }}>
        <span style={headerLabel}>Día</span>
        <span style={headerLabel}>Abierto</span>
        <span style={headerLabel}>Apertura</span>
        <span style={headerLabel}>Cierre</span>
      </div>

      {/* Day rows */}
      {value.map((entry, i) => (
        <div
          key={entry.dayOfWeek}
          style={{
            display:             'grid',
            gridTemplateColumns: '130px 60px 1fr 1fr',
            gap:                 12,
            alignItems:          'center',
            padding:             '10px 0',
            borderBottom:        i < value.length - 1 ? DIVIDER : 'none',
            opacity:             entry.active ? 1 : 0.5,
            transition:          'opacity 150ms ease-out',
          }}
        >
          <span style={{
            fontSize:   13,
            fontWeight: entry.active ? 500 : 400,
            color:      'inherit',
            lineHeight: 1,
          }}>
            {DAY_LABELS[entry.dayOfWeek] ?? `Día ${entry.dayOfWeek}`}
          </span>

          <Toggle
            checked={entry.active}
            onChange={(v) => update(i, { active: v })}
          />

          <TimeSelect
            value={entry.openTime}
            disabled={!entry.active}
            onChange={(v) => update(i, { openTime: v })}
            style={timeSelectStyle}
          />

          <TimeSelect
            value={entry.closeTime}
            disabled={!entry.active}
            onChange={(v) => update(i, { closeTime: v })}
            style={timeSelectStyle}
          />
        </div>
      ))}
    </div>
  )
}
