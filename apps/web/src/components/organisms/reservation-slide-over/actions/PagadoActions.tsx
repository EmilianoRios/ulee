'use client'

import { useTheme } from 'tamagui'
import { CheckCircle2 } from 'lucide-react'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { getPaymentErrorMessage } from '../helpers'
import { ActionButton } from '../ActionButton'
import type { ReservationBackendStatus } from '../types'

export function PagadoActions({
  reservation, cancelPaidConfirm, isConfirmingPayment, onUpdateStatus, onClose,
  setIsConfirmingPayment, setPaymentError, setCancelPaidConfirm, onEdit,
}: {
  reservation:             CalendarReservation
  cancelPaidConfirm:       boolean
  isConfirmingPayment:     boolean
  onUpdateStatus?:         (reservationId: string, status: ReservationBackendStatus, cashAmount?: number, onlineAmount?: number, amountOverride?: number) => Promise<void>
  onClose:                 () => void
  setIsConfirmingPayment:  (v: boolean) => void
  setPaymentError:         (v: string | null) => void
  setCancelPaidConfirm:    (v: boolean) => void
  onEdit:                  () => void
}) {
  const t = useTheme()

  if (cancelPaidConfirm) {
    return (
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
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: t.verdeCanchaProfundo.val }}>
        <CheckCircle2 size={15} strokeWidth={2} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>Cobrada en su totalidad</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <ActionButton
          label="Editar"
          onClick={onEdit}
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
  )
}
