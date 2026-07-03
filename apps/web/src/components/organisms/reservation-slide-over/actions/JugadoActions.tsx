'use client'

import { useTheme } from 'tamagui'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { getPaymentErrorMessage } from '../helpers'
import { SectionLabel } from '../SectionLabel'
import { ActionButton } from '../ActionButton'
import { PaymentInput } from '../PaymentInput'
import type { ReservationBackendStatus } from '../types'

export function JugadoActions({
  reservation, customAmount, customAmountStr, setCustomAmountStr,
  cashAmount, onlineAmount, isConfirmingPayment, paymentError,
  onUpdateStatus, onClose, onPaymentChange, setIsConfirmingPayment, setPaymentError,
}: {
  reservation:             CalendarReservation
  customAmount:            number
  customAmountStr:         string
  setCustomAmountStr:      (v: string) => void
  cashAmount:              number
  onlineAmount:            number
  isConfirmingPayment:     boolean
  paymentError:            string | null
  onUpdateStatus?:         (reservationId: string, status: ReservationBackendStatus, cashAmount?: number, onlineAmount?: number, amountOverride?: number) => Promise<void>
  onClose:                 () => void
  onPaymentChange:         (cash: number, online: number) => void
  setIsConfirmingPayment:  (v: boolean) => void
  setPaymentError:         (v: string | null) => void
}) {
  const t = useTheme()
  const localBalance = Math.max(0, customAmount)
  const localPaymentReady = localBalance > 0 && (cashAmount + onlineAmount) === localBalance

  return (
    <>
      <SectionLabel>Cobro</SectionLabel>
      <div>
        <label style={{ fontSize: 11, fontWeight: 500, color: t.textoMuted.val, marginBottom: 4, display: 'block' }}>
          Saldo a cobrar ($)
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
        onChange={onPaymentChange}
      />
      <ActionButton
        label={isConfirmingPayment ? 'Procesando...' : `Confirmar cobro · $${localBalance.toLocaleString('es-AR')}`}
        onClick={async () => {
          if (!onUpdateStatus) return
          setIsConfirmingPayment(true)
          setPaymentError(null)
          try {
            // Only pass totalAmountOverride when there is no deposit; with a deposit the backend
            // derives pendingBalance from the existing totalAmount and would corrupt it otherwise.
            const hasDeposit = (reservation.depositAmount ?? 0) > 0
            await onUpdateStatus(reservation.id, 'paid', cashAmount, onlineAmount, hasDeposit ? undefined : customAmount)
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
}
