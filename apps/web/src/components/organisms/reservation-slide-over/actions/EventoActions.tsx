'use client'

import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { getPaymentErrorMessage } from '../helpers'
import { ActionButton } from '../ActionButton'
import type { ReservationBackendStatus } from '../types'

export function EventoActions({
  reservation, isCharging, chargeError, isConfirmingPayment,
  onUpdateStatus, onChargeEvent, onClose,
  setIsCharging, setChargeError, setIsConfirmingPayment, setPaymentError,
}: {
  reservation:             CalendarReservation
  isCharging:              boolean
  chargeError:             string | null
  isConfirmingPayment:     boolean
  onUpdateStatus?:         (reservationId: string, status: ReservationBackendStatus, cashAmount?: number, onlineAmount?: number, amountOverride?: number) => Promise<void>
  onChargeEvent?:          (eventId: string, paymentMethod: 'cash' | 'online') => Promise<void>
  onClose:                 () => void
  setIsCharging:           (v: boolean) => void
  setChargeError:          (v: string | null) => void
  setIsConfirmingPayment:  (v: boolean) => void
  setPaymentError:         (v: string | null) => void
}) {
  return (
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
  )
}
