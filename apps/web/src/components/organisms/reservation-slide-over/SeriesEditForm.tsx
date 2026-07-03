'use client'

import { useState } from 'react'
import { useTheme } from 'tamagui'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { TimeSelect } from '@/components/atoms/time-select'
import { DatePicker } from '@/components/atoms/date-picker/DatePicker'
import { minutesToTime, timeToMins } from './helpers'
import { SectionLabel } from './SectionLabel'
import { ActionButton } from './ActionButton'
import type { SeriesUpdateFields } from './types'

export function SeriesEditForm({ reservation, onConfirm, onCancel }: {
  reservation: CalendarReservation
  onConfirm:   (fields: SeriesUpdateFields) => void
  onCancel:    () => void
}) {
  const t = useTheme()

  const [name,      setName]      = useState(reservation.clientName)
  const [phone,     setPhone]     = useState(reservation.phone ?? '')
  const [amount,    setAmount]    = useState(String(reservation.amount))
  const [notes,     setNotes]     = useState(reservation.notes ?? '')
  const [startStr,  setStartStr]  = useState(minutesToTime(reservation.startTime % 1440))
  const [endStr,    setEndStr]    = useState(minutesToTime(reservation.endTime   % 1440))
  const [endDate,   setEndDate]   = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 6,
    border: `1px solid ${t.bordeNeutral.val}`,
    backgroundColor: t.superficie.val, color: t.textoPrimario.val,
    fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: t.textoMuted.val, marginBottom: 4, display: 'block',
  }

  function computeDelta(): SeriesUpdateFields {
    const delta: SeriesUpdateFields = {}
    if (name    !== reservation.clientName)      delta.clientName  = name
    if (phone   !== (reservation.phone ?? ''))   delta.clientPhone = phone
    const parsedAmt = Number(amount)
    if (!isNaN(parsedAmt) && parsedAmt !== reservation.amount) delta.totalAmount = parsedAmt
    if (notes   !== (reservation.notes ?? ''))   delta.notes       = notes
    const newStart = timeToMins(startStr)
    if (newStart !== reservation.startTime)      delta.startTime   = newStart
    const newEndBase = timeToMins(endStr)
    const newEnd = newEndBase <= newStart ? newEndBase + 1440 : newEndBase
    if (newEnd  !== reservation.endTime)         delta.endTime     = newEnd
    if (endDate.trim() !== '')                   delta.endDate     = endDate.trim()
    return delta
  }

  const delta   = computeDelta()
  const hasChanges = Object.keys(delta).length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel>Editar serie</SectionLabel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>Cliente</label>
          <input type="text" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Teléfono</label>
          <input type="text" style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Monto por turno ($)</label>
        <input type="number" style={inputStyle} value={amount} min={0} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={labelStyle}>Inicio</label>
          <TimeSelect value={startStr} onChange={setStartStr} style={{ width: '100%' }} />
        </div>
        <div>
          <label style={labelStyle}>Fin</label>
          <TimeSelect value={endStr} onChange={setEndStr} style={{ width: '100%' }} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Notas</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical', minHeight: 48, lineHeight: 1.5 }}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <label style={labelStyle}>Extender hasta (opcional)</label>
        <DatePicker value={endDate} onChange={setEndDate} style={inputStyle} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <ActionButton
          label="Guardar cambios"
          onClick={() => onConfirm(delta)}
          variant="primary"
          disabled={!hasChanges}
        />
        <ActionButton label="Cancelar" onClick={onCancel} variant="secondary" compact />
      </div>
    </div>
  )
}
