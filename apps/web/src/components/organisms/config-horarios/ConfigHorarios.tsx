'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'tamagui'
import { ScheduleEditor } from '@/components/molecules/schedule-editor'
import type { ScheduleEntry } from '@/components/molecules/schedule-editor'

// Re-export so existing consumers (e.g. configuracion/page.tsx) keep working
export type { ScheduleEntry }

interface Props {
  formId:        string
  onDirtyChange: (dirty: boolean) => void
  onSaved:       () => void
  initialData:   ScheduleEntry[] | null
  onSubmit:      (schedule: ScheduleEntry[]) => Promise<void>
}

export function ConfigHorarios({ formId, onDirtyChange, onSaved, initialData, onSubmit }: Props) {
  const t = useTheme()
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(initialData ?? [])
  const serverSnapshot = useRef<ScheduleEntry[] | null>(initialData)

  useEffect(() => {
    if (initialData === null) return
    serverSnapshot.current = initialData
    setSchedule(initialData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialData)])

  useEffect(() => {
    if (serverSnapshot.current === null) {
      onDirtyChange(false)
      return
    }
    onDirtyChange(JSON.stringify(schedule) !== JSON.stringify(serverSnapshot.current))
  }, [schedule, onDirtyChange])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!initialData) return
    await onSubmit(schedule)
    onSaved()
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
      style={{ display: 'flex', flexDirection: 'column', gap: 0, color: t.textoPrimario.val }}
    >
      <ScheduleEditor value={schedule} onChange={setSchedule} />

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
