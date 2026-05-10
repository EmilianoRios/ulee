'use client'

import { useEffect } from 'react'
import { useTheme } from 'tamagui'
import { X, Phone, Clock, Banknote, CreditCard } from 'lucide-react'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'

interface ReservationSlideOverProps {
  reservation: CalendarReservation | null
  courts: Court[]
  onClose: () => void
}

const STATE_LABEL: Record<string, string> = {
  señado:      'Señado — cobra en cancha',
  'en-cancha': 'En cancha',
  ausente:     'Ausente',
  pagado:      'Pagado',
}

function parseMins(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

function ActionButton({ label, onClick, variant = 'secondary', icon }: {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  icon?: React.ReactNode
}) {
  const t = useTheme()
  const palette = {
    primary:   { bg: t.verdeCancha.val,          text: 'oklch(98% 0.004 155)', border: t.verdeCancha.val },
    secondary: { bg: 'transparent',               text: t.textoPrimario.val,    border: t.bordeNeutral.val },
    danger:    { bg: 'oklch(97% 0.01 25)',        text: 'oklch(40% 0.18 25)',   border: 'oklch(88% 0.06 25)' },
  }[variant]

  return (
    <button
      onClick={onClick}
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
        cursor:          'pointer',
        flex:            1,
        justifyContent:  'center',
        lineHeight:      1.3,
      }}
      onMouseEnter={(e) => {
        if (variant === 'primary') (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.verdeCanchaProfundo.val
      }}
      onMouseLeave={(e) => {
        if (variant === 'primary') (e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.bg
      }}
    >
      {icon}
      {label}
    </button>
  )
}

export function ReservationSlideOver({ reservation, courts, onClose }: ReservationSlideOverProps) {
  const t = useTheme()

  useEffect(() => {
    if (!reservation) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [reservation, onClose])

  const isOpen = reservation !== null
  const court  = reservation ? courts.find((c) => c.id === reservation.courtId) : null

  const nowMins        = new Date().getHours() * 60 + new Date().getMinutes()
  const startMins      = reservation ? parseMins(reservation.startTime) : 0
  const endMins        = reservation ? parseMins(reservation.endTime)   : 0
  const durationMins   = endMins - startMins
  const elapsed        = Math.max(0, nowMins - startMins)
  const remaining      = Math.max(0, endMins - nowMins)

  const statePalette = reservation ? {
    señado:      { bg: t.acentoTerrazaClaro.val, color: t.acentoTerraza.val,     border: 'oklch(84% 0.07 42)' },
    'en-cancha': { bg: t.verdeCanchaActivo.val,  color: t.verdeCanchaProfundo.val, border: t.verdeCancha.val },
    ausente:     { bg: t.fondoHover.val,           color: t.textoInactivo.val,      border: t.divisor.val },
    pagado:      { bg: t.verdeCanchaFondo.val,    color: t.verdeCanchaProfundo.val, border: t.verdeCanchaActivo.val },
  }[reservation.state] : null

  return (
    <>
      {/* Overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position:   'fixed',
          inset:      0,
          background: 'oklch(12% 0.01 222 / 0.18)',
          zIndex:     300,
          opacity:    isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 220ms ease-out',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={reservation ? `Reserva de ${reservation.clientName}` : 'Detalle de reserva'}
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
            {/* Header */}
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
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = t.fondoHover.val }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* Details */}
            <div style={{
              display:       'flex',
              flexDirection: 'column',
              gap:           0,
              flex:          1,
            }}>
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
                <DetailRow
                  icon={<Banknote size={14} strokeWidth={2} color={t.textoMuted.val} />}
                  label="Total"
                  value={`$${reservation.amount.toLocaleString('es-AR')}`}
                  valueWeight={600}
                />
                {reservation.notes && (
                  <div style={{ paddingTop: 4 }}>
                    <span style={{ fontSize: 11, color: t.textoMuted.val, fontWeight: 500 }}>Nota</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: t.textoPrimario.val, lineHeight: 1.5 }}>
                      {reservation.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* En cancha: time indicator */}
              {reservation.state === 'en-cancha' && (
                <div style={{
                  margin:          '0 24px',
                  padding:         '12px 14px',
                  backgroundColor: t.verdeCanchaActivo.val,
                  borderRadius:    8,
                  border:          `1px solid ${t.verdeCancha.val}`,
                  display:         'flex',
                  gap:             24,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: t.verdeCanchaProfundo.val, fontWeight: 500, opacity: 0.8 }}>Transcurrido</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: t.verdeCanchaProfundo.val, marginTop: 2 }}>{fmtDuration(elapsed)}</div>
                  </div>
                  <div style={{ width: 1, backgroundColor: t.verdeCancha.val, opacity: 0.3 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: t.verdeCanchaProfundo.val, fontWeight: 500, opacity: 0.8 }}>Restante</div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: t.verdeCanchaProfundo.val, marginTop: 2 }}>{fmtDuration(remaining)}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reservation.state === 'señado' && (
                  <>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: t.textoMuted.val, letterSpacing: '0.02em' }}>
                        Confirmar cobro
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <ActionButton
                        label="Efectivo"
                        onClick={() => {}}
                        variant="primary"
                        icon={<Banknote size={14} strokeWidth={2} />}
                      />
                      <ActionButton
                        label="Mercado Pago"
                        onClick={() => {}}
                        variant="secondary"
                        icon={<CreditCard size={14} strokeWidth={2} />}
                      />
                    </div>
                    <ActionButton
                      label="Cancelar y retener seña"
                      onClick={() => {}}
                      variant="danger"
                    />
                  </>
                )}

                {reservation.state === 'en-cancha' && (
                  <ActionButton
                    label="Extender reserva"
                    onClick={() => {}}
                    variant="primary"
                    icon={<Clock size={14} strokeWidth={2} />}
                  />
                )}

                {reservation.state === 'ausente' && (
                  <ActionButton
                    label="Marcar como ausente y liberar"
                    onClick={() => {}}
                    variant="danger"
                  />
                )}

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
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function DetailRow({ icon, label, value, valueWeight = 400 }: {
  icon: React.ReactNode
  label: string
  value: string
  valueWeight?: number
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
