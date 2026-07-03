'use client'

import { Activity } from 'lucide-react'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { getPaymentErrorMessage } from '../helpers'
import { SectionLabel } from '../SectionLabel'
import { ActionButton } from '../ActionButton'
import { PaymentInput } from '../PaymentInput'
import type { ReservationBackendStatus } from '../types'

export function PendienteActions({
  reservation, pendingBalance, cashAmount, onlineAmount, paymentReady,
  isConfirmingPayment, paymentError, onUpdateStatus, onClose,
  onPaymentChange, setIsConfirmingPayment, setPaymentError, onEdit,
}: {
  reservation:             CalendarReservation
  pendingBalance:          number
  cashAmount:              number
  onlineAmount:            number
  paymentReady:            boolean
  isConfirmingPayment:     boolean
  paymentError:            string | null
  onUpdateStatus?:         (reservationId: string, status: ReservationBackendStatus, cashAmount?: number, onlineAmount?: number, amountOverride?: number) => Promise<void>
  onClose:                 () => void
  onPaymentChange:         (cash: number, online: number) => void
  setIsConfirmingPayment:  (v: boolean) => void
  setPaymentError:         (v: string | null) => void
  onEdit:                  () => void
}) {
  return (
    <>
      <SectionLabel>Cobro</SectionLabel>
      <PaymentInput
        pendingBalance={pendingBalance}
        cashAmount={cashAmount}
        onlineAmount={onlineAmount}
        paymentReady={paymentReady}
        onChange={onPaymentChange}
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
        label={isConfirmingPayment ? 'Procesando...' : 'Marcar en cancha'}
        onClick={async () => {
          if (!onUpdateStatus) return
          setIsConfirmingPayment(true)
          setPaymentError(null)
          try {
            await onUpdateStatus(reservation.id, 'on_court')
            onClose()
          } catch (err) {
            setPaymentError(getPaymentErrorMessage(err))
          } finally {
            setIsConfirmingPayment(false)
          }
        }}
        variant="secondary"
        icon={<Activity size={16} />}
        disabled={isConfirmingPayment}
      />
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
        onClick={onEdit}
        variant="secondary"
        compact
      />
    </>
  )
}
