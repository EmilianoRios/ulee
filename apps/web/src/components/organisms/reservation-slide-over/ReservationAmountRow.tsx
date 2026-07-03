'use client'

import { useTheme } from 'tamagui'
import { Banknote } from 'lucide-react'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { DetailRow } from './DetailRow'

// Contextual "amount" detail row(s) — what to show depends on reservation.state
// and whether a deposit was paid. Moved verbatim out of ReservationSlideOver.
export function ReservationAmountRow({ reservation, pendingBalance }: {
  reservation:    CalendarReservation
  pendingBalance: number
}) {
  const t = useTheme()
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
}
