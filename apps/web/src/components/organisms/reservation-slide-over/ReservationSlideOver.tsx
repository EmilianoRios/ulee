'use client'

import { Phone, Clock, MapPin, FileText, CalendarDays } from 'lucide-react'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { fmtDate, fmtDuration, minutesToTime } from './helpers'
import { useReservationSlideOverState } from './useReservationSlideOverState'
import { DetailRow } from './DetailRow'
import { ActionButton } from './ActionButton'
import { EditForm } from './EditForm'
import { ReservationSlideOverHeader } from './ReservationSlideOverHeader'
import { ReservationAmountRow } from './ReservationAmountRow'
import { EnCanchaProgress } from './EnCanchaProgress'
import { PendienteActions } from './actions/PendienteActions'
import { SenadoActions } from './actions/SenadoActions'
import { EnCanchaActions } from './actions/EnCanchaActions'
import { EnCanchaCobro } from './actions/EnCanchaCobro'
import { AusenteActions } from './actions/AusenteActions'
import { PagadoActions } from './actions/PagadoActions'
import { RecurrenteActions } from './actions/RecurrenteActions'
import { EventoActions } from './actions/EventoActions'
import { JugadoActions } from './actions/JugadoActions'
import type { ReservationBackendStatus, ReservationUpdateFields, SeriesUpdateFields } from './types'

export type { ReservationBackendStatus, ReservationUpdateFields, SeriesUpdateFields } from './types'

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

export function ReservationSlideOver({ reservation, courts, reservations = [], now: nowProp, venuePricePerHour, venueNightRatePrice, venueNightRateStart, onClose, onUpdateStatus, onExtend, onUpdate, onDelete, onCancelSeries, onModifySeries, onChargeEvent }: ReservationSlideOverProps) {
  const {
    t, court, isOpen, durationMins, elapsed, remaining, can30, can60,
    extraCharge, newEndTime, hasNightRateSplit, pendingBalance, customAmount,
    paymentReady, depositCoversTotal, statePalette, onPaymentChange,
    extendMins, setExtendMins,
    cashAmount, onlineAmount,
    customAmountStr, setCustomAmountStr,
    isEditing, setIsEditing,
    editFields, setEditFields,
    deleteConfirm, setDeleteConfirm,
    cancelPaidConfirm, setCancelPaidConfirm,
    cancelDepositConfirm, setCancelDepositConfirm,
    cancelSeriesConfirm, setCancelSeriesConfirm,
    isEditingSeries, setIsEditingSeries,
    overrideConfirmPending, setOverrideConfirmPending,
    isConfirmingPayment, setIsConfirmingPayment,
    paymentError, setPaymentError,
    isCharging, setIsCharging,
    chargeError, setChargeError,
  } = useReservationSlideOverState({
    reservation, courts, reservations, nowProp, venuePricePerHour, venueNightRatePrice, venueNightRateStart, onClose,
  })

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
            <ReservationSlideOverHeader
              clientName={reservation.clientName}
              state={reservation.state}
              statePalette={statePalette}
              onClose={onClose}
            />

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

                <ReservationAmountRow reservation={reservation} pendingBalance={pendingBalance} />

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
                <EnCanchaProgress elapsed={elapsed} remaining={remaining} durationMins={durationMins} />
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
                  <PendienteActions
                    reservation={reservation}
                    pendingBalance={pendingBalance}
                    cashAmount={cashAmount}
                    onlineAmount={onlineAmount}
                    paymentReady={paymentReady}
                    isConfirmingPayment={isConfirmingPayment}
                    paymentError={paymentError}
                    onUpdateStatus={onUpdateStatus}
                    onClose={onClose}
                    onPaymentChange={onPaymentChange}
                    setIsConfirmingPayment={setIsConfirmingPayment}
                    setPaymentError={setPaymentError}
                    onEdit={() => setIsEditing(true)}
                  />
                )}

                {/* Señado */}
                {reservation.state === 'señado' && !isEditing && !deleteConfirm && (
                  <SenadoActions
                    reservation={reservation}
                    pendingBalance={pendingBalance}
                    cashAmount={cashAmount}
                    onlineAmount={onlineAmount}
                    paymentReady={paymentReady}
                    depositCoversTotal={depositCoversTotal}
                    isConfirmingPayment={isConfirmingPayment}
                    paymentError={paymentError}
                    cancelDepositConfirm={cancelDepositConfirm}
                    onUpdateStatus={onUpdateStatus}
                    onClose={onClose}
                    onPaymentChange={onPaymentChange}
                    setIsConfirmingPayment={setIsConfirmingPayment}
                    setPaymentError={setPaymentError}
                    setCancelDepositConfirm={setCancelDepositConfirm}
                    onEdit={() => setIsEditing(true)}
                  />
                )}

                {/* En cancha — extender reserva */}
                {reservation.state === 'en-cancha' && !isEditing && !deleteConfirm && (
                  <EnCanchaActions
                    reservation={reservation}
                    extendMins={extendMins}
                    setExtendMins={setExtendMins}
                    can30={can30}
                    can60={can60}
                    newEndTime={newEndTime}
                    extraCharge={extraCharge}
                    hasNightRateSplit={hasNightRateSplit}
                    overrideConfirmPending={overrideConfirmPending}
                    setOverrideConfirmPending={setOverrideConfirmPending}
                    onExtend={onExtend}
                  />
                )}

                {/* En cancha — cobro (solo si hay saldo pendiente; no depende de isEditing/deleteConfirm, igual que el original) */}
                {reservation.state === 'en-cancha' && pendingBalance > 0 && (
                  <EnCanchaCobro
                    reservation={reservation}
                    pendingBalance={pendingBalance}
                    cashAmount={cashAmount}
                    onlineAmount={onlineAmount}
                    paymentReady={paymentReady}
                    isConfirmingPayment={isConfirmingPayment}
                    paymentError={paymentError}
                    onUpdateStatus={onUpdateStatus}
                    onClose={onClose}
                    onPaymentChange={onPaymentChange}
                    setIsConfirmingPayment={setIsConfirmingPayment}
                    setPaymentError={setPaymentError}
                  />
                )}

                {/* Ausente */}
                {reservation.state === 'ausente' && !isEditing && !deleteConfirm && (
                  <AusenteActions
                    onEdit={() => setIsEditing(true)}
                    onDeleteRequest={() => setDeleteConfirm(true)}
                  />
                )}

                {/* Pagado */}
                {reservation.state === 'pagado' && !isEditing && (
                  <PagadoActions
                    reservation={reservation}
                    cancelPaidConfirm={cancelPaidConfirm}
                    isConfirmingPayment={isConfirmingPayment}
                    onUpdateStatus={onUpdateStatus}
                    onClose={onClose}
                    setIsConfirmingPayment={setIsConfirmingPayment}
                    setPaymentError={setPaymentError}
                    setCancelPaidConfirm={setCancelPaidConfirm}
                    onEdit={() => setIsEditing(true)}
                  />
                )}

                {/* Mantenimiento */}
                {reservation.state === 'mantenimiento' && (
                  <ActionButton
                    label="Liberar cancha"
                    onClick={() => {
                      onDelete?.(reservation.id)
                      onClose()
                    }}
                    variant="primary"
                  />
                )}

                {/* Recurrente */}
                {reservation.state === 'recurrente' && (
                  <RecurrenteActions
                    reservation={reservation}
                    isEditingSeries={isEditingSeries}
                    cancelSeriesConfirm={cancelSeriesConfirm}
                    customAmount={customAmount}
                    customAmountStr={customAmountStr}
                    setCustomAmountStr={setCustomAmountStr}
                    cashAmount={cashAmount}
                    onlineAmount={onlineAmount}
                    isConfirmingPayment={isConfirmingPayment}
                    paymentError={paymentError}
                    onUpdateStatus={onUpdateStatus}
                    onClose={onClose}
                    onPaymentChange={onPaymentChange}
                    setIsConfirmingPayment={setIsConfirmingPayment}
                    setPaymentError={setPaymentError}
                    setIsEditingSeries={setIsEditingSeries}
                    setCancelSeriesConfirm={setCancelSeriesConfirm}
                    onModifySeries={onModifySeries}
                    onCancelSeries={onCancelSeries}
                  />
                )}

                {/* Evento */}
                {reservation.state === 'evento' && (
                  <EventoActions
                    reservation={reservation}
                    isCharging={isCharging}
                    chargeError={chargeError}
                    isConfirmingPayment={isConfirmingPayment}
                    onUpdateStatus={onUpdateStatus}
                    onChargeEvent={onChargeEvent}
                    onClose={onClose}
                    setIsCharging={setIsCharging}
                    setChargeError={setChargeError}
                    setIsConfirmingPayment={setIsConfirmingPayment}
                    setPaymentError={setPaymentError}
                  />
                )}

                {/* Jugado */}
                {reservation.state === 'jugado' && (
                  <JugadoActions
                    reservation={reservation}
                    customAmount={customAmount}
                    customAmountStr={customAmountStr}
                    setCustomAmountStr={setCustomAmountStr}
                    cashAmount={cashAmount}
                    onlineAmount={onlineAmount}
                    isConfirmingPayment={isConfirmingPayment}
                    paymentError={paymentError}
                    onUpdateStatus={onUpdateStatus}
                    onClose={onClose}
                    onPaymentChange={onPaymentChange}
                    setIsConfirmingPayment={setIsConfirmingPayment}
                    setPaymentError={setPaymentError}
                  />
                )}

              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
