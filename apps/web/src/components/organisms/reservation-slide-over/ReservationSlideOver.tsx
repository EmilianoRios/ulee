'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'
import { X, Phone, Clock, Banknote, CreditCard, MapPin, ArrowLeftRight, CheckCircle2, FileText, CalendarDays, Moon } from 'lucide-react'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { TimeSelect } from '@/components/atoms/time-select'

export type ReservationBackendStatus =
  | 'pending'
  | 'deposit_paid'
  | 'on_court'
  | 'absent'
  | 'paid'
  | 'maintenance'
  | 'recurring'
  | 'played'
  | 'event'

export interface SeriesUpdateFields {
  clientName?:  string
  clientPhone?: string
  totalAmount?: number
  notes?:       string
  startTime?:   number   // minutes since midnight
  endTime?:     number   // minutes since midnight (may be > 1440 for overnight)
  endDate?:     string   // "YYYY-MM-DD" — extension only
}

export interface ReservationUpdateFields {
  startTime?:   number   // absolute minutes since midnight
  endTime?:     number   // absolute minutes; may be > 1440 for overnight
  clientName?:  string
  clientPhone?: string
  totalAmount?: number
  notes?:       string
}

interface ReservationSlideOverProps {
  reservation:         CalendarReservation | null
  courts:              Court[]
  reservations?:       CalendarReservation[]
  now?:                Date
  venuePricePerHour?:  number
  venueNightRatePrice?: number
  venueNightRateStart?: number   // minutes since midnight
  onClose:             () => void
  onUpdateStatus?:     (reservationId: string, status: ReservationBackendStatus, cashAmount?: number, onlineAmount?: number, amountOverride?: number) => Promise<void>
  onExtend?:           (reservationId: string, additionalMinutes: 30 | 60, overrideSchedule?: boolean) => Promise<void>
  onUpdate?:           (reservationId: string, fields: ReservationUpdateFields) => void
  onDelete?:           (reservationId: string) => void
  onCancelSeries?:     (seriesId: string) => void
  onModifySeries?:     (seriesId: string, fields: SeriesUpdateFields) => void
  onChargeEvent?:      (eventId: string, paymentMethod: 'cash' | 'online') => Promise<void>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPaymentErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.includes('invalid_split_amounts'))
    return 'Los montos ingresados no coinciden con el saldo pendiente.'
  return 'No se pudo registrar el cobro. Intentá de nuevo.'
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function fmtDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const raw = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function addMins(totalMins: number, mins: number): number {
  return totalMins + mins
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

function isSlotFree(
  courtId:      string,
  startMins:    number,
  endMins:      number,
  reservations: CalendarReservation[],
  excludeId:    string,
): boolean {
  return !reservations.some((r) => {
    if (r.id === excludeId || r.courtId !== courtId) return false
    return r.startTime < endMins && r.endTime > startMins
  })
}

const STATE_LABEL: Record<string, string> = {
  pendiente:     'Pendiente · a cobrar',
  señado:        'Señado · cobra al llegar',
  'en-cancha':   'En cancha',
  ausente:       'Ausente',
  pagado:        'Pagado',
  mantenimiento: 'Mantenimiento',
  recurrente:    'Turno recurrente',
  jugado:        'Jugado · cobro pendiente',
  evento:        'Evento',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionButton({ label, onClick, variant = 'secondary', icon, disabled, compact }: {
  label:     string
  onClick:   () => void
  variant?:  'primary' | 'secondary' | 'danger'
  icon?:     React.ReactNode
  disabled?: boolean
  compact?:  boolean
}) {
  const t = useTheme()
  const palette = {
    primary:   { bg: t.verdeCancha.val,        text: 'oklch(98% 0.004 155)', border: t.verdeCancha.val },
    secondary: { bg: 'transparent',             text: t.textoPrimario.val,    border: t.bordeNeutral.val },
    danger:    { bg: 'oklch(97% 0.01 25)',      text: 'oklch(40% 0.18 25)',   border: 'oklch(88% 0.06 25)' },
  }[variant]

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display:         'flex',
        alignItems:      'center',
        gap:             6,
        padding:         compact ? '9px 14px' : '11px 18px',
        borderRadius:    7,
        border:          `1px solid ${palette.border}`,
        backgroundColor: palette.bg,
        color:           palette.text,
        fontSize:        13,
        fontWeight:      500,
        fontFamily:      'inherit',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        flex:            compact ? 'none' : 1,
        justifyContent:  'center',
        lineHeight:      1.3,
        opacity:         disabled ? 0.5 : 1,
        transition:      'background-color 150ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (variant === 'primary')   (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val
        if (variant === 'secondary') (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val
      }}
      onMouseLeave={(e) => {
        if (disabled) return
        if (variant === 'primary')   (e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.bg
        if (variant === 'secondary') (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function ExtendButton({ label, available, active, onClick }: {
  label:     string
  available: boolean
  active?:   boolean
  onClick:   () => void
}) {
  const t = useTheme()
  const bg     = active ? t.verdeCanchaActivo.val : available ? 'transparent' : t.fondoHover.val
  const border  = active ? t.verdeCancha.val : available ? t.bordeNeutral.val : t.divisor.val
  const color   = active ? t.verdeCanchaProfundo.val : available ? t.textoPrimario.val : t.textoInactivo.val
  return (
    <button
      onClick={available ? onClick : undefined}
      disabled={!available}
      title={available ? undefined : 'Slot ocupado'}
      style={{
        flex:            1,
        padding:         '9px 12px',
        borderRadius:    7,
        border:          `1px solid ${border}`,
        backgroundColor: bg,
        color,
        fontSize:        13,
        fontWeight:      active ? 600 : 500,
        fontFamily:      'inherit',
        cursor:          available ? 'pointer' : 'not-allowed',
        lineHeight:      1.3,
        opacity:         available ? 1 : 0.5,
        transition:      'background-color 120ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (available && !active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val
      }}
      onMouseLeave={(e) => {
        if (available && !active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
      }}
    >
      {label}
    </button>
  )
}

function DetailRow({ icon, label, value, valueWeight = 400 }: {
  icon:          React.ReactNode
  label:         string
  value:         string
  valueWeight?:  number
}) {
  const t = useTheme()
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 14, height: 18, display: 'flex', alignItems: 'center', flexShrink: 0, color: t.textoMuted.val }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 13, color: t.textoPrimario.val, fontWeight: valueWeight, lineHeight: 1.4, marginTop: 1 }}>{value}</div>
      </div>
    </div>
  )
}

function PaymentMethodButton({ label, icon, selected, onClick }: {
  label:    string
  icon:     React.ReactNode
  selected: boolean
  onClick:  () => void
}) {
  const t = useTheme()
  return (
    <button
      onClick={onClick}
      style={{
        flex:            1,
        padding:         '10px 12px',
        borderRadius:    7,
        border:          `2px solid ${selected ? t.verdeCancha.val : t.bordeNeutral.val}`,
        backgroundColor: selected ? t.verdeCanchaActivo.val : 'transparent',
        color:           selected ? t.verdeCanchaProfundo.val : t.textoPrimario.val,
        fontSize:        13,
        fontWeight:      selected ? 600 : 500,
        fontFamily:      'inherit',
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             6,
        lineHeight:      1.3,
        transition:      'border-color 120ms ease-out, background-color 120ms ease-out',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: t.textoMuted.val, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

// ─── Inline edit form (private) ───────────────────────────────────────────────

function EditForm({ reservation, fields, onChange, onConfirm, onCancel }: {
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

// ─── Series edit form ─────────────────────────────────────────────────────────

function SeriesEditForm({ reservation, onConfirm, onCancel }: {
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
        <input type="date" style={inputStyle} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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

// ─── Payment input ────────────────────────────────────────────────────────────

function PaymentInput({ pendingBalance, cashAmount, onlineAmount, paymentReady, onChange }: {
  pendingBalance: number
  cashAmount:     number
  onlineAmount:   number
  paymentReady:   boolean
  onChange:       (cash: number, online: number) => void
}) {
  const t = useTheme()
  const [mode, setMode] = useState<'cash' | 'online' | 'split'>('cash')
  const [cashStr,   setCashStr]   = useState(String(cashAmount))
  const [onlineStr, setOnlineStr] = useState(String(onlineAmount))

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
    fontSize:     11,
    fontWeight:   500,
    color:        t.textoMuted.val,
    marginBottom: 4,
    display:      'block',
  }

  function selectMode(next: 'cash' | 'online' | 'split') {
    setMode(next)
    if (next === 'cash')   onChange(pendingBalance, 0)
    if (next === 'online') onChange(0, pendingBalance)
    if (next === 'split')  { setCashStr(String(cashAmount)); setOnlineStr(String(onlineAmount)); onChange(cashAmount, onlineAmount) }
  }

  const totalAssigned = cashAmount + onlineAmount

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <PaymentMethodButton
          label="Efectivo"
          icon={<Banknote size={14} strokeWidth={2} />}
          selected={mode === 'cash'}
          onClick={() => selectMode('cash')}
        />
        <PaymentMethodButton
          label="Mercado Pago"
          icon={<CreditCard size={14} strokeWidth={2} />}
          selected={mode === 'online'}
          onClick={() => selectMode('online')}
        />
        <PaymentMethodButton
          label="Mixto"
          icon={<ArrowLeftRight size={14} strokeWidth={2} />}
          selected={mode === 'split'}
          onClick={() => selectMode('split')}
        />
      </div>

      {mode === 'split' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={labelStyle}>Efectivo ($)</label>
            <input
              type="number"
              min={0}
              value={cashStr}
              onChange={(e) => { setCashStr(e.target.value); onChange(Math.max(0, Number(e.target.value) || 0), onlineAmount) }}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Mercado Pago ($)</label>
            <input
              type="number"
              min={0}
              value={onlineStr}
              onChange={(e) => { setOnlineStr(e.target.value); onChange(cashAmount, Math.max(0, Number(e.target.value) || 0)) }}
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {mode === 'split' && (
        <div style={{
          fontSize:   12,
          fontWeight: 500,
          color:      paymentReady ? t.verdeCanchaProfundo.val : t.textoMuted.val,
          transition: 'color 150ms ease-out',
        }}>
          Asignado: ${totalAssigned.toLocaleString('es-AR')} de ${pendingBalance.toLocaleString('es-AR')}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReservationSlideOver({ reservation, courts, reservations = [], now: nowProp, venuePricePerHour, venueNightRatePrice, venueNightRateStart, onClose, onUpdateStatus, onExtend, onUpdate, onDelete, onCancelSeries, onModifySeries, onChargeEvent }: ReservationSlideOverProps) {
  const t = useTheme()

  const [extendMins,           setExtendMins]           = useState<0 | 30 | 60>(0)
  const [cashAmount,           setCashAmount]           = useState<number>(0)
  const [onlineAmount,         setOnlineAmount]         = useState<number>(0)
  const [customAmountStr,      setCustomAmountStr]      = useState<string>('0')
  const [isEditing,            setIsEditing]            = useState(false)
  const [editFields,           setEditFields]           = useState<ReservationUpdateFields>({})
  const [deleteConfirm,        setDeleteConfirm]        = useState(false)
  const [cancelPaidConfirm,    setCancelPaidConfirm]    = useState(false)
  const [cancelDepositConfirm, setCancelDepositConfirm] = useState(false)
  const [cancelSeriesConfirm,  setCancelSeriesConfirm]  = useState(false)
  const [isEditingSeries,      setIsEditingSeries]      = useState(false)
  const [overrideConfirmPending, setOverrideConfirmPending] = useState(false)
  const [isConfirmingPayment,   setIsConfirmingPayment]   = useState(false)
  const [paymentError,          setPaymentError]          = useState<string | null>(null)
  const [isCharging,            setIsCharging]            = useState(false)
  const [chargeError,           setChargeError]           = useState<string | null>(null)

  useEffect(() => {
    if (!reservation) return
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [reservation, onClose])

  // Reset all state when reservation changes
  useEffect(() => {
    const newBalance = reservation
      ? Math.max(0, (reservation.depositAmount != null && reservation.depositAmount > 0)
          ? reservation.amount - reservation.depositAmount
          : reservation.wasFullyPaid
            ? 0
            : reservation.amount)
      : 0
    setExtendMins(0)
    setCashAmount(newBalance)
    setOnlineAmount(0)
    setCustomAmountStr(String(reservation?.amount ?? 0))
    setIsEditing(false)
    setEditFields({})
    setDeleteConfirm(false)
    setCancelPaidConfirm(false)
    setCancelDepositConfirm(false)
    setCancelSeriesConfirm(false)
    setIsEditingSeries(false)
    setOverrideConfirmPending(false)
    setIsConfirmingPayment(false)
    setPaymentError(null)
    setIsCharging(false)
    setChargeError(null)
  }, [reservation?.id])

  const isOpen = reservation !== null
  const court  = reservation ? courts.find((c) => c.id === reservation.courtId) : null

  const _now         = nowProp ?? new Date()
  const nowMins      = _now.getHours() * 60 + _now.getMinutes()
  const startMins    = reservation ? reservation.startTime : 0
  const endMins      = reservation ? reservation.endTime   : 0
  const durationMins = endMins - startMins
  const elapsed      = Math.max(0, nowMins - startMins)
  const remaining    = Math.max(0, endMins - nowMins)

  const can30 = reservation ? isSlotFree(reservation.courtId, endMins, endMins + 30, reservations, reservation.id) : false
  const can60 = reservation ? isSlotFree(reservation.courtId, endMins, endMins + 60, reservations, reservation.id) : false

  const extraCharge = (() => {
    if (!reservation || extendMins === 0) return 0
    const basePrice  = court?.priceOverride ?? venuePricePerHour ?? 0
    const nightPrice = court?.nightRatePriceOverride ?? venueNightRatePrice
    const extStart   = reservation.endTime
    const extEnd     = extStart + extendMins
    if (nightPrice && venueNightRateStart != null) {
      const dayPart   = Math.max(0, Math.min(extEnd, venueNightRateStart) - extStart)
      const nightPart = Math.max(0, extEnd - Math.max(extStart, venueNightRateStart))
      return Math.round(basePrice * dayPart / 60 + nightPrice * nightPart / 60)
    }
    return Math.round(basePrice * extendMins / 60)
  })()
  const newEndTime   = reservation && extendMins > 0 ? minutesToTime(addMins(reservation.endTime, extendMins)) : ''

  const hasNightRateSplit = (() => {
    if (!reservation || extendMins === 0) return false
    const nightPrice = court?.nightRatePriceOverride ?? venueNightRatePrice
    if (!nightPrice || venueNightRateStart == null) return false
    const extStart  = reservation.endTime
    const extEnd    = extStart + extendMins
    return Math.max(0, extEnd - Math.max(extStart, venueNightRateStart)) > 0
  })()

  const pendingBalance = reservation
    ? Math.max(0, reservation.depositAmount != null
        ? reservation.amount - reservation.depositAmount
        : reservation.wasFullyPaid
          ? 0
          : reservation.amount)
    : 0

  const customAmount  = Math.max(0, Number(customAmountStr) || 0)

  const totalAssigned     = cashAmount + onlineAmount
  const paymentReady      = pendingBalance > 0 && totalAssigned === pendingBalance
  const depositCoversTotal = pendingBalance === 0 && ((reservation?.depositAmount ?? 0) > 0 || reservation?.wasFullyPaid === true)

  const statePalette = reservation ? ({
    pendiente:     { bg: 'oklch(95% 0.05 55)',      color: 'oklch(52% 0.15 55)',       border: 'oklch(80% 0.10 55)'  },
    señado:        { bg: t.acentoTerrazaClaro.val, color: t.acentoTerraza.val,       border: 'oklch(84% 0.07 42)'  },
    'en-cancha':   { bg: t.verdeCanchaActivo.val,  color: t.verdeCanchaProfundo.val,  border: t.verdeCancha.val     },
    ausente:       { bg: t.fondoHover.val,          color: t.textoInactivo.val,        border: t.divisor.val         },
    pagado:        { bg: t.verdeCanchaFondo.val,    color: t.verdeCanchaProfundo.val,  border: t.verdeCanchaActivo.val },
    mantenimiento: { bg: 'oklch(94% 0.06 88)',      color: 'oklch(32% 0.10 85)',       border: 'oklch(76% 0.13 88)'  },
    recurrente:    { bg: 'oklch(92% 0.04 275)',     color: 'oklch(28% 0.08 275)',      border: 'oklch(70% 0.09 275)' },
    jugado:        { bg: 'oklch(91% 0.012 220)',    color: 'oklch(38% 0.014 222)',     border: 'oklch(76% 0.018 222)' },
    evento:        { bg: 'oklch(93% 0.04 200)',     color: 'oklch(30% 0.08 200)',      border: 'oklch(68% 0.10 200)'  },
  } as Record<string, { bg: string; color: string; border: string }>)[reservation.state] : null

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
        aria-label={reservation ? `${reservation.clientName}` : 'Detalle'}
        style={{
          position:        'fixed',
          top:             0,
          right:           0,
          height:          '100vh',
          width:           380,
          backgroundColor: t.superficieContenido.val,
          borderLeft:      `1px solid ${t.bordeNeutral.val}`,
          zIndex:          400,
          display:         'flex',
          flexDirection:   'column',
          transform:       isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition:      'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow:       isOpen ? '-8px 0 32px oklch(0% 0 0 / 0.06)' : 'none',
          overflowY:       'auto',
        }}
      >
        {reservation && statePalette && (
          <>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div style={{
              display:      'flex',
              alignItems:   'flex-start',
              padding:      '20px 24px 16px',
              borderBottom: `1px solid ${t.divisor.val}`,
              gap:          12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  margin:        0,
                  fontSize:      18,
                  fontWeight:    600,
                  color:         t.textoNav.val,
                  letterSpacing: '-0.01em',
                  lineHeight:    1.2,
                  whiteSpace:    'nowrap',
                  overflow:      'hidden',
                  textOverflow:  'ellipsis',
                }}>
                  {reservation.clientName}
                </h2>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    display:         'inline-flex',
                    alignItems:      'center',
                    padding:         '3px 10px',
                    borderRadius:    9999,
                    fontSize:        11,
                    fontWeight:      600,
                    letterSpacing:   '0.04em',
                    textTransform:   'uppercase',
                    backgroundColor: statePalette.bg,
                    color:           statePalette.color,
                    border:          `1px solid ${statePalette.border}`,
                    lineHeight:      1.4,
                  }}>
                    {STATE_LABEL[reservation.state]}
                  </span>
                </div>
              </div>
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
                  flexShrink:      0,
                  fontFamily:      'inherit',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* ── Body ───────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flex: 1 }}>

              {/* Info rows */}
              <div style={{ padding: '16px 24px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reservation.date && (
                  <DetailRow
                    icon={<CalendarDays size={14} strokeWidth={2} color={t.textoMuted.val} />}
                    label="Fecha"
                    value={fmtDate(reservation.date)}
                  />
                )}
                <DetailRow
                  icon={<Clock size={14} strokeWidth={2} color={t.textoMuted.val} />}
                  label="Horario"
                  value={`${minutesToTime(reservation.startTime)} – ${minutesToTime(reservation.endTime)} · ${fmtDuration(durationMins)}`}
                />
                <DetailRow
                  icon={<MapPin size={14} strokeWidth={2} color={t.textoMuted.val} />}
                  label="Cancha"
                  value={court?.name ?? '—'}
                />
                {reservation.phone && (
                  <DetailRow
                    icon={<Phone size={14} strokeWidth={2} color={t.textoMuted.val} />}
                    label="Teléfono"
                    value={reservation.phone}
                  />
                )}

                {/* ── Monto contextual por estado ─────────────────────────── */}
                {(() => {
                  const dep = reservation.depositAmount ?? 0
                  const hasDeposit = dep > 0
                  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`

                  // Señado y En cancha con seña: mostrar seña + saldo
                  if (
                    (reservation.state === 'señado' || reservation.state === 'en-cancha') &&
                    hasDeposit
                  ) {
                    return (
                      <>
                        <DetailRow
                          icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                          label="Seña pagada"
                          value={fmt(dep)}
                        />
                        <DetailRow
                          icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                          label="Saldo pendiente"
                          value={fmt(pendingBalance)}
                          valueWeight={600}
                        />
                      </>
                    )
                  }

                  // En cancha sin seña
                  if (reservation.state === 'en-cancha' && !hasDeposit && reservation.amount > 0) {
                    return (
                      <DetailRow
                        icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                        label="A cobrar"
                        value={fmt(reservation.amount)}
                        valueWeight={600}
                      />
                    )
                  }

                  // Jugado: saldo si tiene seña, o total si no
                  if (reservation.state === 'jugado') {
                    if (hasDeposit && pendingBalance > 0) {
                      return (
                        <>
                          <DetailRow
                            icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                            label="Seña pagada"
                            value={fmt(dep)}
                          />
                          <DetailRow
                            icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                            label="Saldo pendiente"
                            value={fmt(pendingBalance)}
                            valueWeight={600}
                          />
                        </>
                      )
                    }
                    if (reservation.amount > 0) {
                      return (
                        <DetailRow
                          icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                          label="A cobrar"
                          value={fmt(reservation.amount)}
                          valueWeight={600}
                        />
                      )
                    }
                    return null
                  }

                  // Pendiente: a cobrar al llegar
                  if (reservation.state === 'pendiente' && reservation.amount > 0) {
                    return (
                      <DetailRow
                        icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                        label="A cobrar al llegar"
                        value={fmt(reservation.amount)}
                        valueWeight={600}
                      />
                    )
                  }

                  // Ausente: seña retenida si la había, nada si no
                  if (reservation.state === 'ausente') {
                    if (hasDeposit) {
                      return (
                        <DetailRow
                          icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                          label="Seña retenida"
                          value={fmt(dep)}
                        />
                      )
                    }
                    return null
                  }

                  // Recurrente: por turno
                  if (reservation.state === 'recurrente' && reservation.amount > 0) {
                    return (
                      <DetailRow
                        icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                        label="Por turno"
                        value={fmt(reservation.amount)}
                        valueWeight={600}
                      />
                    )
                  }

                  // Pagado y resto: total estándar
                  if (reservation.amount > 0) {
                    return (
                      <DetailRow
                        icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                        label="Total"
                        value={fmt(reservation.amount)}
                        valueWeight={600}
                      />
                    )
                  }

                  return null
                })()}

                {reservation.notes && (
                  <DetailRow
                    icon={<FileText size={14} strokeWidth={2} color={t.textoMuted.val} />}
                    label="Nota"
                    value={reservation.notes}
                  />
                )}
              </div>

              {/* En cancha: progress bar */}
              {reservation.state === 'en-cancha' && (
                <div style={{ padding: '8px 24px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500 }}>Transcurrido</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: t.textoNav.val, marginTop: 2 }}>{fmtDuration(elapsed)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500 }}>Restante</div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: t.textoNav.val, marginTop: 2 }}>{fmtDuration(remaining)}</div>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: t.fondoHover.val, overflow: 'hidden' }}>
                    <div style={{
                      height:          '100%',
                      width:           `${Math.min(100, durationMins > 0 ? (elapsed / durationMins) * 100 : 0)}%`,
                      backgroundColor: t.verdeCancha.val,
                      borderRadius:    3,
                    }} />
                  </div>
                </div>
              )}

              {/* ── Actions ──────────────────────────────────────────────────── */}
              <div style={{ padding: '16px 24px 28px', borderTop: `1px solid ${t.divisor.val}`, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ── Edit form ────────────────────────────────────────────────── */}
                {isEditing && (
                  <EditForm
                    reservation={reservation}
                    fields={editFields}
                    onChange={setEditFields}
                    onConfirm={() => {
                      onUpdate?.(reservation.id, editFields)
                      setIsEditing(false)
                      setEditFields({})
                    }}
                    onCancel={() => {
                      setIsEditing(false)
                      setEditFields({})
                    }}
                  />
                )}

                {/* ── Delete confirmation ──────────────────────────────────────── */}
                {deleteConfirm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 13, color: t.textoMuted.val, lineHeight: 1.4 }}>
                      ¿Confirmás la eliminación? Esta acción no se puede deshacer.
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton
                        label="Confirmar eliminación"
                        onClick={() => { onDelete?.(reservation.id); onClose() }}
                        variant="danger"
                      />
                      <ActionButton
                        label="Cancelar"
                        onClick={() => setDeleteConfirm(false)}
                        variant="secondary"
                        compact
                      />
                    </div>
                  </div>
                )}

                {/* Pendiente */}
                {reservation.state === 'pendiente' && !isEditing && !deleteConfirm && (
                  <>
                    <SectionLabel>Cobro</SectionLabel>
                    <PaymentInput
                      pendingBalance={pendingBalance}
                      cashAmount={cashAmount}
                      onlineAmount={onlineAmount}
                      paymentReady={paymentReady}
                      onChange={(cash, online) => { setCashAmount(cash); setOnlineAmount(online) }}
                    />
                    <ActionButton
                      label={isConfirmingPayment ? 'Procesando...' : `Confirmar cobro · $${pendingBalance.toLocaleString('es-AR')}`}
                      onClick={async () => {
                        if (!onUpdateStatus) return
                        setIsConfirmingPayment(true)
                        setPaymentError(null)
                        try {
                          await onUpdateStatus(reservation.id, 'paid', cashAmount, onlineAmount)
                          onClose()
                        } catch (err) {
                          setPaymentError(getPaymentErrorMessage(err))
                        } finally {
                          setIsConfirmingPayment(false)
                        }
                      }}
                      variant="primary"
                      disabled={!paymentReady || isConfirmingPayment}
                    />
                    {paymentError && (
                      <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', marginTop: 6 }}>
                        {paymentError}
                      </div>
                    )}
                    <ActionButton
                      label={isConfirmingPayment ? 'Procesando...' : 'Marcar ausente'}
                      onClick={async () => {
                        if (!onUpdateStatus) return
                        setIsConfirmingPayment(true)
                        setPaymentError(null)
                        try {
                          await onUpdateStatus(reservation.id, 'absent')
                          onClose()
                        } catch (err) {
                          setPaymentError(getPaymentErrorMessage(err))
                        } finally {
                          setIsConfirmingPayment(false)
                        }
                      }}
                      variant="danger"
                      disabled={isConfirmingPayment}
                    />
                    <ActionButton
                      label="Editar"
                      onClick={() => setIsEditing(true)}
                      variant="secondary"
                      compact
                    />
                  </>
                )}

                {/* Señado */}
                {reservation.state === 'señado' && !isEditing && !deleteConfirm && !cancelDepositConfirm && (
                  <>
                    <SectionLabel>Cobro</SectionLabel>
                    {depositCoversTotal ? (
                      <>
                        <ActionButton
                          label={isConfirmingPayment ? 'Procesando...' : 'Confirmar como pagado'}
                          onClick={async () => {
                            if (!onUpdateStatus) return
                            setIsConfirmingPayment(true)
                            setPaymentError(null)
                            try {
                              await onUpdateStatus(reservation.id, 'paid', 0, 0)
                              onClose()
                            } catch (err) {
                              setPaymentError(getPaymentErrorMessage(err))
                            } finally {
                              setIsConfirmingPayment(false)
                            }
                          }}
                          variant="primary"
                          disabled={isConfirmingPayment}
                        />
                        {paymentError && (
                          <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', marginTop: 6 }}>
                            {paymentError}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <PaymentInput
                          pendingBalance={pendingBalance}
                          cashAmount={cashAmount}
                          onlineAmount={onlineAmount}
                          paymentReady={paymentReady}
                          onChange={(cash, online) => { setCashAmount(cash); setOnlineAmount(online) }}
                        />
                        <ActionButton
                          label={isConfirmingPayment ? 'Procesando...' : `Confirmar cobro · $${pendingBalance.toLocaleString('es-AR')}`}
                          onClick={async () => {
                            if (!onUpdateStatus) return
                            setIsConfirmingPayment(true)
                            setPaymentError(null)
                            try {
                              await onUpdateStatus(reservation.id, 'paid', cashAmount, onlineAmount)
                              onClose()
                            } catch (err) {
                              setPaymentError(getPaymentErrorMessage(err))
                            } finally {
                              setIsConfirmingPayment(false)
                            }
                          }}
                          variant="primary"
                          disabled={!paymentReady || isConfirmingPayment}
                        />
                        {paymentError && (
                          <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', marginTop: 6 }}>
                            {paymentError}
                          </div>
                        )}
                      </>
                    )}
                    <ActionButton
                      label="Cancelar y retener seña"
                      onClick={() => setCancelDepositConfirm(true)}
                      variant="danger"
                    />
                    <ActionButton
                      label="Editar"
                      onClick={() => setIsEditing(true)}
                      variant="secondary"
                      compact
                    />
                  </>
                )}

                {/* Señado — confirmación de cancelación */}
                {reservation.state === 'señado' && cancelDepositConfirm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 13, color: t.textoMuted.val, lineHeight: 1.4 }}>
                      Se marcará como ausente y se retendrá la seña. ¿Confirmás la cancelación?
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton
                        label={isConfirmingPayment ? 'Procesando...' : 'Confirmar cancelación'}
                        onClick={async () => {
                          if (!onUpdateStatus) return
                          setIsConfirmingPayment(true)
                          setPaymentError(null)
                          try {
                            await onUpdateStatus(reservation.id, 'absent')
                            onClose()
                          } catch (err) {
                            setPaymentError(getPaymentErrorMessage(err))
                          } finally {
                            setIsConfirmingPayment(false)
                          }
                        }}
                        variant="danger"
                        disabled={isConfirmingPayment}
                      />
                      <ActionButton
                        label="Volver"
                        onClick={() => setCancelDepositConfirm(false)}
                        variant="secondary"
                        compact
                      />
                    </div>
                  </div>
                )}

                {/* En cancha */}
                {reservation.state === 'en-cancha' && !isEditing && !deleteConfirm && (
                  <>
                    <SectionLabel>Extender reserva</SectionLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ExtendButton label="+30 min" available={can30} active={extendMins === 30} onClick={() => setExtendMins(extendMins === 30 ? 0 : 30)} />
                      <ExtendButton label="+60 min" available={can60} active={extendMins === 60} onClick={() => setExtendMins(extendMins === 60 ? 0 : 60)} />
                    </div>

                    {extendMins > 0 && (
                      <div style={{
                        marginTop:       2,
                        padding:         '14px 16px',
                        borderRadius:    8,
                        border:          `1px solid ${overrideConfirmPending ? 'oklch(75% 0.10 42)' : t.bordeNeutral.val}`,
                        backgroundColor: overrideConfirmPending ? 'oklch(97% 0.03 42)' : t.superficie.val,
                        display:         'flex',
                        flexDirection:   'column',
                        gap:             10,
                        transition:      'border-color 150ms ease-out, background-color 150ms ease-out',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, color: t.textoMuted.val }}>Nuevo horario</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val }}>
                            {minutesToTime(reservation.startTime)} – {newEndTime}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, color: t.textoMuted.val }}>Cargo adicional</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: t.verdeCanchaProfundo.val }}>
                            ${extraCharge.toLocaleString('es-AR')}
                          </span>
                        </div>

                        {hasNightRateSplit && (
                          <div style={{
                            display:         'inline-flex',
                            alignSelf:       'flex-start',
                            alignItems:      'center',
                            gap:             5,
                            padding:         '4px 9px',
                            borderRadius:    9999,
                            backgroundColor: 'oklch(93% 0.025 42)',
                            border:          '1px solid oklch(84% 0.07 42)',
                          }}>
                            <Moon size={11} strokeWidth={2} color="oklch(44% 0.11 42)" />
                            <span style={{ fontSize: 11, fontWeight: 500, color: 'oklch(44% 0.11 42)', lineHeight: 1 }}>
                              Incluye tarifa nocturna
                            </span>
                          </div>
                        )}

                        {overrideConfirmPending ? (
                          <>
                            <p style={{ margin: 0, fontSize: 12, color: 'oklch(42% 0.12 42)', lineHeight: 1.4 }}>
                              Esta extensión supera el horario de cierre de la sede. ¿Confirmás de todas formas?
                            </p>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <ActionButton
                                label="Confirmar de todas formas"
                                onClick={async () => {
                                  await onExtend?.(reservation.id, extendMins as 30 | 60, true)
                                  setExtendMins(0)
                                  setOverrideConfirmPending(false)
                                }}
                                variant="secondary"
                              />
                              <ActionButton
                                label="Cancelar"
                                onClick={() => setOverrideConfirmPending(false)}
                                variant="secondary"
                                compact
                              />
                            </div>
                          </>
                        ) : (
                          <ActionButton
                            label="Confirmar extensión"
                            onClick={async () => {
                              try {
                                await onExtend?.(reservation.id, extendMins as 30 | 60)
                                setExtendMins(0)
                              } catch (err: unknown) {
                                const data = (err as { data?: { code?: string } }).data
                                if (data?.code === 'outside_schedule_override_required') {
                                  setOverrideConfirmPending(true)
                                }
                              }
                            }}
                            variant="secondary"
                          />
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* En cancha — cobro (solo si hay saldo pendiente; pagado ya está saldado) */}
                {reservation.state === 'en-cancha' && pendingBalance > 0 && (
                  <>
                    <div style={{ height: 1, backgroundColor: t.divisor.val, margin: '14px 0 8px' }} />
                    <SectionLabel>Cobro</SectionLabel>
                    <PaymentInput
                      pendingBalance={pendingBalance}
                      cashAmount={cashAmount}
                      onlineAmount={onlineAmount}
                      paymentReady={paymentReady}
                      onChange={(cash, online) => { setCashAmount(cash); setOnlineAmount(online) }}
                    />
                    <ActionButton
                      label={isConfirmingPayment ? 'Procesando...' : `${(reservation.depositAmount != null || reservation.wasFullyPaid) ? 'Cobrar saldo' : 'Cobrar total'} · $${pendingBalance.toLocaleString('es-AR')}`}
                      onClick={async () => {
                        if (!onUpdateStatus) return
                        setIsConfirmingPayment(true)
                        setPaymentError(null)
                        try {
                          await onUpdateStatus(reservation.id, 'paid', cashAmount, onlineAmount)
                          onClose()
                        } catch (err) {
                          setPaymentError(getPaymentErrorMessage(err))
                        } finally {
                          setIsConfirmingPayment(false)
                        }
                      }}
                      variant="primary"
                      disabled={!paymentReady || isConfirmingPayment}
                    />
                    {paymentError && (
                      <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', marginTop: 6 }}>
                        {paymentError}
                      </div>
                    )}
                  </>
                )}

                {/* Ausente */}
                {reservation.state === 'ausente' && !isEditing && !deleteConfirm && (
                  <>
                    <span style={{ fontSize: 13, color: t.textoInactivo.val }}>
                      Cancha liberada.
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton
                        label="Editar"
                        onClick={() => setIsEditing(true)}
                        variant="secondary"
                        compact
                      />
                      <ActionButton
                        label="Eliminar reserva"
                        onClick={() => setDeleteConfirm(true)}
                        variant="danger"
                      />
                    </div>
                  </>
                )}

                {/* Pagado */}
                {reservation.state === 'pagado' && !isEditing && !cancelPaidConfirm && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: t.verdeCanchaProfundo.val }}>
                      <CheckCircle2 size={15} strokeWidth={2} />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Cobrada en su totalidad</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton
                        label="Editar"
                        onClick={() => setIsEditing(true)}
                        variant="secondary"
                        compact
                      />
                      <ActionButton
                        label="Cancelar reserva"
                        onClick={() => setCancelPaidConfirm(true)}
                        variant="danger"
                        compact
                      />
                    </div>
                  </>
                )}

                {/* Pagado — confirmación de cancelación */}
                {reservation.state === 'pagado' && cancelPaidConfirm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 13, color: t.textoMuted.val, lineHeight: 1.4 }}>
                      Esta reserva está cobrada en su totalidad. ¿Confirmás la cancelación y liberación del turno?
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton
                        label={isConfirmingPayment ? 'Procesando...' : 'Confirmar cancelación'}
                        onClick={async () => {
                          if (!onUpdateStatus) return
                          setIsConfirmingPayment(true)
                          setPaymentError(null)
                          try {
                            await onUpdateStatus(reservation.id, 'absent')
                            onClose()
                          } catch (err) {
                            setPaymentError(getPaymentErrorMessage(err))
                          } finally {
                            setIsConfirmingPayment(false)
                          }
                        }}
                        variant="danger"
                        disabled={isConfirmingPayment}
                      />
                      <ActionButton
                        label="Volver"
                        onClick={() => setCancelPaidConfirm(false)}
                        variant="secondary"
                        compact
                      />
                    </div>
                  </div>
                )}

                {/* Mantenimiento */}
                {reservation.state === 'mantenimiento' && (
                  <ActionButton
                    label={isConfirmingPayment ? 'Procesando...' : 'Liberar cancha'}
                    onClick={async () => {
                      if (!onUpdateStatus) return
                      setIsConfirmingPayment(true)
                      setPaymentError(null)
                      try {
                        await onUpdateStatus(reservation.id, 'absent')
                        onClose()
                      } catch (err) {
                        setPaymentError(getPaymentErrorMessage(err))
                      } finally {
                        setIsConfirmingPayment(false)
                      }
                    }}
                    variant="primary"
                    disabled={isConfirmingPayment}
                  />
                )}

                {/* Recurrente — editar serie */}
                {reservation.state === 'recurrente' && isEditingSeries && (
                  <SeriesEditForm
                    reservation={reservation}
                    onConfirm={(fields) => {
                      onModifySeries?.(reservation.seriesId!, fields)
                      onClose()
                    }}
                    onCancel={() => setIsEditingSeries(false)}
                  />
                )}

                {/* Recurrente */}
                {reservation.state === 'recurrente' && !cancelSeriesConfirm && !isEditingSeries && (() => {
                  const paidSoFar = reservation.depositAmount != null
                    ? reservation.depositAmount
                    : reservation.wasFullyPaid ? reservation.amount : 0
                  const localBalance = Math.max(0, customAmount - paidSoFar)
                  const localPaymentReady = localBalance > 0 && (cashAmount + onlineAmount) === localBalance
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <SectionLabel>Cobrar turno</SectionLabel>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 500, color: t.textoMuted.val, marginBottom: 4, display: 'block' }}>
                          Monto a cobrar ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={customAmountStr}
                          onChange={(e) => setCustomAmountStr(e.target.value)}
                          style={{
                            width: '100%', padding: '7px 10px', borderRadius: 6,
                            border: `1px solid ${t.bordeNeutral.val}`,
                            backgroundColor: t.superficie.val, color: t.textoPrimario.val,
                            fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <PaymentInput
                        pendingBalance={localBalance}
                        cashAmount={cashAmount}
                        onlineAmount={onlineAmount}
                        paymentReady={localPaymentReady}
                        onChange={(cash, online) => { setCashAmount(cash); setOnlineAmount(online) }}
                      />
                      <ActionButton
                        label={isConfirmingPayment ? 'Procesando...' : `Confirmar cobro · $${localBalance.toLocaleString('es-AR')}`}
                        onClick={async () => {
                          if (!onUpdateStatus) return
                          setIsConfirmingPayment(true)
                          setPaymentError(null)
                          try {
                            await onUpdateStatus(reservation.id, 'paid', cashAmount, onlineAmount, customAmount)
                            onClose()
                          } catch (err) {
                            setPaymentError(getPaymentErrorMessage(err))
                          } finally {
                            setIsConfirmingPayment(false)
                          }
                        }}
                        variant="primary"
                        disabled={customAmount <= 0 || !localPaymentReady || isConfirmingPayment}
                      />
                      {paymentError && (
                        <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', marginTop: 6 }}>
                          {paymentError}
                        </div>
                      )}
                      <div style={{ height: 1, backgroundColor: t.divisor.val, margin: '14px 0 8px' }} />
                      {reservation.seriesId && (
                        <ActionButton
                          label="Editar serie"
                          onClick={() => setIsEditingSeries(true)}
                          variant="secondary"
                          compact
                        />
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionButton
                          label={isConfirmingPayment ? 'Procesando...' : 'Cancelar este turno'}
                          onClick={async () => {
                            if (!onUpdateStatus) return
                            setIsConfirmingPayment(true)
                            setPaymentError(null)
                            try {
                              await onUpdateStatus(reservation.id, 'absent')
                              onClose()
                            } catch (err) {
                              setPaymentError(getPaymentErrorMessage(err))
                            } finally {
                              setIsConfirmingPayment(false)
                            }
                          }}
                          variant="danger"
                          disabled={isConfirmingPayment}
                        />
                        {reservation.seriesId && (
                          <ActionButton
                            label="Cancelar serie"
                            onClick={() => setCancelSeriesConfirm(true)}
                            variant="danger"
                          />
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Recurrente — confirmación de cancelación de serie */}
                {reservation.state === 'recurrente' && cancelSeriesConfirm && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 13, color: t.textoMuted.val, lineHeight: 1.4 }}>
                      Esta acción cancelará todos los turnos futuros de la serie. ¿Confirmás?
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton
                        label="Confirmar cancelación de serie"
                        onClick={() => { onCancelSeries?.(reservation.seriesId!); onClose() }}
                        variant="danger"
                      />
                      <ActionButton
                        label="Volver"
                        onClick={() => setCancelSeriesConfirm(false)}
                        variant="secondary"
                        compact
                      />
                    </div>
                  </div>
                )}

                {/* Evento */}
                {reservation.state === 'evento' && (
                  <>
                    {reservation.eventId && onChargeEvent && (
                      <>
                        <ActionButton
                          label={isCharging ? 'Procesando...' : 'Cobrar evento'}
                          onClick={async () => {
                            if (!reservation.eventId || !onChargeEvent) return
                            setIsCharging(true)
                            setChargeError(null)
                            try {
                              await onChargeEvent(reservation.eventId, 'cash')
                              onClose()
                            } catch (err) {
                              setChargeError(
                                err instanceof Error && err.message === 'EVENT_NOT_FOUND'
                                  ? 'No se encontró el evento. Actualizá la vista.'
                                  : 'No se pudo cobrar el evento. Intentá de nuevo.'
                              )
                            } finally {
                              setIsCharging(false)
                            }
                          }}
                          variant="primary"
                          disabled={isCharging}
                        />
                        {chargeError && (
                          <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', lineHeight: 1.4, padding: '0 4px' }}>
                            {chargeError}
                          </div>
                        )}
                      </>
                    )}
                    <ActionButton
                      label={isConfirmingPayment ? 'Procesando...' : 'Cancelar evento'}
                      onClick={async () => {
                        if (!onUpdateStatus) return
                        setIsConfirmingPayment(true)
                        setPaymentError(null)
                        try {
                          await onUpdateStatus(reservation.id, 'absent')
                          onClose()
                        } catch (err) {
                          setPaymentError(getPaymentErrorMessage(err))
                        } finally {
                          setIsConfirmingPayment(false)
                        }
                      }}
                      variant="danger"
                      disabled={isConfirmingPayment}
                    />
                  </>
                )}

                {/* Jugado */}
                {reservation.state === 'jugado' && (() => {
                  const paidSoFar = reservation.depositAmount != null
                    ? reservation.depositAmount
                    : reservation.wasFullyPaid ? reservation.amount : 0
                  const localBalance = Math.max(0, customAmount - paidSoFar)
                  const localPaymentReady = localBalance > 0 && (cashAmount + onlineAmount) === localBalance
                  return (
                    <>
                      <SectionLabel>Cobro</SectionLabel>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 500, color: t.textoMuted.val, marginBottom: 4, display: 'block' }}>
                          Monto a cobrar ($)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={customAmountStr}
                          onChange={(e) => setCustomAmountStr(e.target.value)}
                          style={{
                            width: '100%', padding: '7px 10px', borderRadius: 6,
                            border: `1px solid ${t.bordeNeutral.val}`,
                            backgroundColor: t.superficie.val, color: t.textoPrimario.val,
                            fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <PaymentInput
                        pendingBalance={localBalance}
                        cashAmount={cashAmount}
                        onlineAmount={onlineAmount}
                        paymentReady={localPaymentReady}
                        onChange={(cash, online) => { setCashAmount(cash); setOnlineAmount(online) }}
                      />
                      <ActionButton
                        label={isConfirmingPayment ? 'Procesando...' : `Confirmar cobro · $${localBalance.toLocaleString('es-AR')}`}
                        onClick={async () => {
                          if (!onUpdateStatus) return
                          setIsConfirmingPayment(true)
                          setPaymentError(null)
                          try {
                            await onUpdateStatus(reservation.id, 'paid', cashAmount, onlineAmount, customAmount)
                            onClose()
                          } catch (err) {
                            setPaymentError(getPaymentErrorMessage(err))
                          } finally {
                            setIsConfirmingPayment(false)
                          }
                        }}
                        variant="primary"
                        disabled={!localPaymentReady || customAmount <= 0 || isConfirmingPayment}
                      />
                      {paymentError && (
                        <div style={{ fontSize: 12, color: 'oklch(50% 0.18 25)', marginTop: 6 }}>
                          {paymentError}
                        </div>
                      )}
                    </>
                  )
                })()}

              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
