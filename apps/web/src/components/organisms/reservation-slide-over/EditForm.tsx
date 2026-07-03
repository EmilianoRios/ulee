'use client'

import { useTheme } from 'tamagui'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { TimeSelect } from '@/components/atoms/time-select'
import { minutesToTime, timeToMins } from './helpers'
import { SectionLabel } from './SectionLabel'
import { ActionButton } from './ActionButton'
import type { ReservationUpdateFields } from './types'

export function EditForm({ reservation, fields, onChange, onConfirm, onCancel }: {
  reservation: CalendarReservation
  fields:      ReservationUpdateFields
  onChange:    (f: ReservationUpdateFields) => void
  onConfirm:   () => void
  onCancel:    () => void
}) {
  const t = useTheme()

  // Derive display strings from numeric fields (% 1440 for clock face display)
  const effectiveStart = fields.startTime ?? reservation.startTime
  const effectiveEnd   = fields.endTime   ?? reservation.endTime
  const editStartStr   = minutesToTime(effectiveStart % 1440)
  const editEndStr     = minutesToTime(effectiveEnd   % 1440)
  const editIsOvernight = effectiveEnd >= 1440

  const inputStyle: React.CSSProperties = {
    width:           '100%',
    padding:         '7px 10px',
    borderRadius:    6,
    border:          `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: t.superficie.val,
    color:           t.textoPrimario.val,
    fontSize:        13,
    fontFamily:      'inherit',
    outline:         'none',
    boxSizing:       'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 500,
    color: t.textoMuted.val,
    marginBottom: 4,
    display: 'block',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel>Editar reserva</SectionLabel>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Inicio</label>
          <TimeSelect
            value={editStartStr}
            onChange={(v) => onChange({ ...fields, startTime: timeToMins(v) })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Fin</label>
          <TimeSelect
            value={editEndStr}
            onChange={(v) => {
              const m = timeToMins(v)
              const startRef = fields.startTime ?? reservation.startTime
              onChange({ ...fields, endTime: m <= startRef ? m + 1440 : m })
            }}
            nextDay={editIsOvernight}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Cliente</label>
        <input
          type="text"
          style={inputStyle}
          defaultValue={reservation.clientName}
          onChange={(e) => onChange({ ...fields, clientName: e.target.value || undefined })}
        />
      </div>

      <div>
        <label style={labelStyle}>Teléfono</label>
        <input
          type="text"
          style={inputStyle}
          defaultValue={reservation.phone ?? ''}
          onChange={(e) => onChange({ ...fields, clientPhone: e.target.value || undefined })}
        />
      </div>

      <div>
        <label style={labelStyle}>Total</label>
        <input
          type="number"
          style={inputStyle}
          defaultValue={reservation.amount}
          onChange={(e) => onChange({ ...fields, totalAmount: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <ActionButton label="Guardar cambios" onClick={onConfirm} variant="primary" />
        <ActionButton label="Cancelar" onClick={onCancel} variant="secondary" compact />
      </div>
    </div>
  )
}
