'use client'

import { useTheme } from 'tamagui'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { getPaymentErrorMessage } from '../helpers'
import { SectionLabel } from '../SectionLabel'
import { ActionButton } from '../ActionButton'
import { PaymentInput } from '../PaymentInput'
import type { ReservationBackendStatus } from '../types'

// En-cancha payment ("cobro") section. Intentionally NOT gated by
// isEditing/deleteConfirm at the call site — matches the original
// layout where this block could render alongside the edit form.
export function EnCanchaCobro({
  reservation, pendingBalance, cashAmount, onlineAmount, paymentReady,
  isConfirmingPayment, paymentError, onUpdateStatus, onClose, onPaymentChange,
  setIsConfirmingPayment, setPaymentError,
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
}) {
  const t = useTheme()
  return (
    <>
      <div style={{ height: 1, backgroundColor: t.divisor.val, margin: '14px 0 8px' }} />
      <SectionLabel>Cobro</SectionLabel>
      <PaymentInput
        pendingBalance={pendingBalance}
        cashAmount={cashAmount}
        onlineAmount={onlineAmount}
        paymentReady={paymentReady}
        onChange={onPaymentChange}
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
  )
}
