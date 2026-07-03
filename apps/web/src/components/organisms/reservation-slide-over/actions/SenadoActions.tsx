'use client'

import { useTheme } from 'tamagui'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { getPaymentErrorMessage } from '../helpers'
import { SectionLabel } from '../SectionLabel'
import { ActionButton } from '../ActionButton'
import { PaymentInput } from '../PaymentInput'
import type { ReservationBackendStatus } from '../types'

export function SenadoActions({
  reservation, pendingBalance, cashAmount, onlineAmount, paymentReady, depositCoversTotal,
  isConfirmingPayment, paymentError, cancelDepositConfirm, onUpdateStatus, onClose,
  onPaymentChange, setIsConfirmingPayment, setPaymentError, setCancelDepositConfirm, onEdit,
}: {
  reservation:              CalendarReservation
  pendingBalance:           number
  cashAmount:               number
  onlineAmount:             number
  paymentReady:             boolean
  depositCoversTotal:       boolean
  isConfirmingPayment:      boolean
  paymentError:             string | null
  cancelDepositConfirm:     boolean
  onUpdateStatus?:          (reservationId: string, status: ReservationBackendStatus, cashAmount?: number, onlineAmount?: number, amountOverride?: number) => Promise<void>
  onClose:                  () => void
  onPaymentChange:          (cash: number, online: number) => void
  setIsConfirmingPayment:   (v: boolean) => void
  setPaymentError:          (v: string | null) => void
  setCancelDepositConfirm:  (v: boolean) => void
  onEdit:                   () => void
}) {
  const t = useTheme()

  if (cancelDepositConfirm) {
    return (
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
    )
  }

  return (
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
        </>
      )}
      <ActionButton
        label="Cancelar y retener seña"
        onClick={() => setCancelDepositConfirm(true)}
        variant="danger"
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
