'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'
import { X, Phone, Clock, Banknote, CreditCard } from 'lucide-react'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'

export type ReservationBackendStatus =
  | 'deposit_paid'
  | 'on_court'
  | 'absent'
  | 'paid'
  | 'maintenance'
  | 'recurring'
  | 'played'
  | 'event'

interface ReservationSlideOverProps {
  reservation:     CalendarReservation | null
  courts:          Court[]
  reservations?:   CalendarReservation[]
  now?:            Date
  onClose:         () => void
  onUpdateStatus?: (reservationId: string, status: ReservationBackendStatus, paymentMethod?: 'cash' | 'online', amount?: number) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function addMins(time: string, mins: number): string {
  const total = parseMins(time) + mins
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
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
  if (endMins > 24 * 60) return false
  return !reservations.some((r) => {
    if (r.id === excludeId || r.courtId !== courtId) return false
    const rS = parseMins(r.startTime)
    const rE = parseMins(r.endTime)
    return rS < endMins && rE > startMins
  })
}

const STATE_LABEL: Record<string, string> = {
  señado:        'Señado — cobra en cancha',
  'en-cancha':   'En cancha',
  ausente:       'Ausente',
  pagado:        'Pagado',
  mantenimiento: 'Mantenimiento',
  recurrente:    'Evento recurrente',
  jugado:        'Jugado — cobro pendiente',
  evento:        'Evento especial',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionButton({ label, onClick, variant = 'secondary', icon, disabled }: {
  label:     string
  onClick:   () => void
  variant?:  'primary' | 'secondary' | 'danger'
  icon?:     React.ReactNode
  disabled?: boolean
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
        padding:         '9px 16px',
        borderRadius:    7,
        border:          `1px solid ${palette.border}`,
        backgroundColor: palette.bg,
        color:           palette.text,
        fontSize:        13,
        fontWeight:      500,
        fontFamily:      'inherit',
        cursor:          disabled ? 'not-allowed' : 'pointer',
        flex:            1,
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
    <span style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, letterSpacing: '0.02em' }}>
      {children}
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ReservationSlideOver({ reservation, courts, reservations = [], now: nowProp, onClose, onUpdateStatus }: ReservationSlideOverProps) {
  const t = useTheme()

  const [extendMins,      setExtendMins]      = useState<0 | 30 | 60>(0)
  const [selectedPayment, setSelectedPayment] = useState<'cash' | 'online' | null>(null)

  useEffect(() => {
    if (!reservation) return
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [reservation, onClose])

  // Reset selections when reservation changes
  useEffect(() => {
    setExtendMins(0)
    setSelectedPayment(null)
  }, [reservation?.id])

  const isOpen = reservation !== null
  const court  = reservation ? courts.find((c) => c.id === reservation.courtId) : null

  const _now         = nowProp ?? new Date()
  const nowMins      = _now.getHours() * 60 + _now.getMinutes()
  const startMins    = reservation ? parseMins(reservation.startTime) : 0
  const endMins      = reservation ? parseMins(reservation.endTime)   : 0
  const durationMins = endMins - startMins
  const elapsed      = Math.max(0, nowMins - startMins)
  const remaining    = Math.max(0, endMins - nowMins)

  const can30 = reservation ? isSlotFree(reservation.courtId, endMins, endMins + 30, reservations, reservation.id) : false
  const can60 = reservation ? isSlotFree(reservation.courtId, endMins, endMins + 60, reservations, reservation.id) : false

  const extraCharge  = reservation && durationMins > 0 ? Math.round(reservation.amount / durationMins * extendMins) : 0
  const newEndTime   = reservation && extendMins > 0 ? addMins(reservation.endTime, extendMins) : ''

  const statePalette = reservation ? ({
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
              <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <DetailRow
                  icon={<Clock size={14} strokeWidth={2} color={t.textoMuted.val} />}
                  label="Horario"
                  value={`${reservation.startTime} – ${reservation.endTime} · ${fmtDuration(durationMins)}`}
                />
                <DetailRow
                  icon={<span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🏟</span>}
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
                {reservation.amount > 0 && (
                  <DetailRow
                    icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                    label="Total"
                    value={`$${reservation.amount.toLocaleString('es-AR')}`}
                    valueWeight={600}
                  />
                )}
                {reservation.notes && (
                  <div style={{ paddingTop: 4 }}>
                    <span style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500 }}>Nota</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: t.textoPrimario.val, lineHeight: 1.5 }}>
                      {reservation.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* En cancha: progress bar */}
              {reservation.state === 'en-cancha' && (
                <div style={{ padding: '0 24px 4px' }}>
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
              <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                {/* Señado */}
                {reservation.state === 'señado' && (
                  <>
                    <SectionLabel>Método de cobro</SectionLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <PaymentMethodButton label="Efectivo"     icon={<Banknote size={14} strokeWidth={2} />}    selected={selectedPayment === 'cash'}    onClick={() => setSelectedPayment(p => p === 'cash'    ? null : 'cash')}    />
                      <PaymentMethodButton label="Mercado Pago" icon={<CreditCard size={14} strokeWidth={2} />}  selected={selectedPayment === 'online'} onClick={() => setSelectedPayment(p => p === 'online' ? null : 'online')} />
                    </div>
                    {selectedPayment && (() => {
                      const pendingBalance = reservation.depositAmount != null
                        ? reservation.amount - reservation.depositAmount
                        : reservation.amount
                      return (
                        <ActionButton
                          label={`Confirmar cobro · $${pendingBalance.toLocaleString('es-AR')}`}
                          onClick={() => { onUpdateStatus?.(reservation.id, 'paid', selectedPayment ?? undefined, pendingBalance); onClose() }}
                          variant="primary"
                        />
                      )
                    })()}
                    <ActionButton
                      label="Cancelar y retener seña"
                      onClick={() => { onUpdateStatus?.(reservation.id, 'absent'); onClose() }}
                      variant="danger"
                    />
                  </>
                )}

                {/* En cancha */}
                {reservation.state === 'en-cancha' && (
                  <>
                    <div style={{ marginBottom: 4 }}>
                      <SectionLabel>Extender reserva</SectionLabel>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ExtendButton label="+30 min" available={can30} active={extendMins === 30} onClick={() => setExtendMins(extendMins === 30 ? 0 : 30)} />
                      <ExtendButton label="+60 min" available={can60} active={extendMins === 60} onClick={() => setExtendMins(extendMins === 60 ? 0 : 60)} />
                    </div>

                    {extendMins > 0 && (
                      <div style={{
                        marginTop:       2,
                        padding:         '14px 16px',
                        borderRadius:    8,
                        border:          `1px solid ${t.bordeNeutral.val}`,
                        backgroundColor: t.superficie.val,
                        display:         'flex',
                        flexDirection:   'column',
                        gap:             10,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, color: t.textoMuted.val }}>Nuevo horario</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val }}>
                            {reservation.startTime} – {newEndTime}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: 12, color: t.textoMuted.val }}>Cargo adicional</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: t.verdeCanchaProfundo.val }}>
                            ${extraCharge.toLocaleString('es-AR')}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: t.textoMuted.val, lineHeight: 1.4 }}>
                          El cargo se cobra al finalizar el turno extendido.
                        </p>
                        <ActionButton label="Confirmar extensión" onClick={() => setExtendMins(0)} variant="secondary" />
                      </div>
                    )}
                  </>
                )}

                {/* Ausente — estado final, sin acciones adicionales */}
                {reservation.state === 'ausente' && (
                  <div style={{
                    padding:         '10px 14px',
                    backgroundColor: t.fondoHover.val,
                    borderRadius:    7,
                    fontSize:        13,
                    color:           t.textoInactivo.val,
                    textAlign:       'center',
                  }}>
                    La cancha fue liberada
                  </div>
                )}

                {/* Pagado */}
                {reservation.state === 'pagado' && (
                  <div style={{
                    padding:         '10px 14px',
                    backgroundColor: t.verdeCanchaFondo.val,
                    borderRadius:    7,
                    fontSize:        13,
                    color:           t.verdeCanchaProfundo.val,
                    fontWeight:      500,
                    textAlign:       'center',
                  }}>
                    Reserva cobrada en su totalidad
                  </div>
                )}

                {/* Mantenimiento */}
                {reservation.state === 'mantenimiento' && (
                  <ActionButton
                    label="Liberar cancha"
                    onClick={() => { onUpdateStatus?.(reservation.id, 'absent'); onClose() }}
                    variant="danger"
                  />
                )}

                {/* Recurrente */}
                {reservation.state === 'recurrente' && (
                  <ActionButton
                    label="Cancelar este turno"
                    onClick={() => { onUpdateStatus?.(reservation.id, 'absent'); onClose() }}
                    variant="danger"
                  />
                )}

                {/* Evento */}
                {reservation.state === 'evento' && (
                  <ActionButton
                    label="Cancelar evento"
                    onClick={() => { onUpdateStatus?.(reservation.id, 'absent'); onClose() }}
                    variant="danger"
                  />
                )}

                {/* Jugado */}
                {reservation.state === 'jugado' && (
                  <>
                    <SectionLabel>Método de cobro</SectionLabel>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <PaymentMethodButton label="Efectivo"     icon={<Banknote size={14} strokeWidth={2} />}   selected={selectedPayment === 'cash'}    onClick={() => setSelectedPayment(p => p === 'cash'    ? null : 'cash')}    />
                      <PaymentMethodButton label="Mercado Pago" icon={<CreditCard size={14} strokeWidth={2} />} selected={selectedPayment === 'online'} onClick={() => setSelectedPayment(p => p === 'online' ? null : 'online')} />
                    </div>
                    {selectedPayment && (
                      <ActionButton
                        label="Confirmar cobro"
                        onClick={() => { onUpdateStatus?.(reservation.id, 'paid', selectedPayment ?? undefined, reservation.amount); onClose() }}
                        variant="primary"
                      />
                    )}
                  </>
                )}

              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
