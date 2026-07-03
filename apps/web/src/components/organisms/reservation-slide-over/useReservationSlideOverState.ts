import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'
import type { CalendarReservation, Court } from '@/components/atoms/reservation-card'
import { addMins, isSlotFree, minutesToTime } from './helpers'
import type { ReservationUpdateFields } from './types'

// All local UI state + derived values for ReservationSlideOver, extracted
// verbatim so the component itself only handles layout/dispatch.
export function useReservationSlideOverState({
  reservation, courts, reservations, nowProp, venuePricePerHour, venueNightRatePrice, venueNightRateStart, onClose,
}: {
  reservation:          CalendarReservation | null
  courts:               Court[]
  reservations:         CalendarReservation[]
  nowProp?:             Date
  venuePricePerHour?:   number
  venueNightRatePrice?: number
  venueNightRateStart?: number
  onClose:              () => void
}) {
  const t = useTheme()

  const [extendMins,           setExtendMins]           = useState<0 | 30 | 60>(0)
  const [cashAmount,           setCashAmount]           = useState<number>(0)
  const [onlineAmount,         setOnlineAmount]         = useState<number>(0)
  const [customAmountStr,      setCustomAmountStr]      = useState<string>('0')
  const [isEditing,            setIsEditing]            = useState(false)
  const [editFields,           setEditFields]           = useState<ReservationUpdateFields>({})
  const [deleteConfirm,        setDeleteConfirm]        = useState(false)
  const [cancelPaidConfirm,    setCancelPaidConfirm]    = useState(false)
  const [cancelDepositConfirm, setCancelDepositConfirm] = useState(false)
  const [cancelSeriesConfirm,  setCancelSeriesConfirm]  = useState(false)
  const [isEditingSeries,      setIsEditingSeries]      = useState(false)
  const [overrideConfirmPending, setOverrideConfirmPending] = useState(false)
  const [isConfirmingPayment,   setIsConfirmingPayment]   = useState(false)
  const [paymentError,          setPaymentError]          = useState<string | null>(null)
  const [isCharging,            setIsCharging]            = useState(false)
  const [chargeError,           setChargeError]           = useState<string | null>(null)

  useEffect(() => {
    if (!reservation) return
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [reservation, onClose])

  // Reset all state when reservation changes
  useEffect(() => {
    const newBalance = reservation
      ? Math.max(0, (reservation.depositAmount != null && reservation.depositAmount > 0)
          ? reservation.amount - reservation.depositAmount
          : reservation.wasFullyPaid
            ? 0
            : reservation.amount)
      : 0
    setExtendMins(0)
    setCashAmount(newBalance)
    setOnlineAmount(0)
    setCustomAmountStr(String(newBalance))
    setIsEditing(false)
    setEditFields({})
    setDeleteConfirm(false)
    setCancelPaidConfirm(false)
    setCancelDepositConfirm(false)
    setCancelSeriesConfirm(false)
    setIsEditingSeries(false)
    setOverrideConfirmPending(false)
    setIsConfirmingPayment(false)
    setPaymentError(null)
    setIsCharging(false)
    setChargeError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation?.id])

  const isOpen = reservation !== null
  const court  = reservation ? courts.find((c) => c.id === reservation.courtId) : null

  const _now         = nowProp ?? new Date()
  const nowMins      = _now.getHours() * 60 + _now.getMinutes()
  const startMins    = reservation ? reservation.startTime : 0
  const endMins      = reservation ? reservation.endTime   : 0
  const durationMins = endMins - startMins
  const elapsed      = Math.max(0, nowMins - startMins)
  const remaining    = Math.max(0, endMins - nowMins)

  const can30 = reservation ? isSlotFree(reservation.courtId, endMins, endMins + 30, reservations, reservation.id) : false
  const can60 = reservation ? isSlotFree(reservation.courtId, endMins, endMins + 60, reservations, reservation.id) : false

  const extraCharge = (() => {
    if (!reservation || extendMins === 0) return 0
    const basePrice  = court?.priceOverride ?? venuePricePerHour ?? 0
    const nightPrice = court?.nightRatePriceOverride ?? venueNightRatePrice
    const extStart   = reservation.endTime
    const extEnd     = extStart + extendMins
    if (nightPrice && venueNightRateStart != null) {
      const dayPart   = Math.max(0, Math.min(extEnd, venueNightRateStart) - extStart)
      const nightPart = Math.max(0, extEnd - Math.max(extStart, venueNightRateStart))
      return Math.round(basePrice * dayPart / 60 + nightPrice * nightPart / 60)
    }
    return Math.round(basePrice * extendMins / 60)
  })()
  const newEndTime = reservation && extendMins > 0 ? minutesToTime(addMins(reservation.endTime, extendMins)) : ''

  const hasNightRateSplit = (() => {
    if (!reservation || extendMins === 0) return false
    const nightPrice = court?.nightRatePriceOverride ?? venueNightRatePrice
    if (!nightPrice || venueNightRateStart == null) return false
    const extStart  = reservation.endTime
    const extEnd    = extStart + extendMins
    return Math.max(0, extEnd - Math.max(extStart, venueNightRateStart)) > 0
  })()

  const pendingBalance = reservation
    ? Math.max(0, reservation.depositAmount != null
        ? reservation.amount - reservation.depositAmount
        : reservation.wasFullyPaid
          ? 0
          : reservation.amount)
    : 0

  const customAmount = Math.max(0, Number(customAmountStr) || 0)

  const totalAssigned      = cashAmount + onlineAmount
  const paymentReady       = pendingBalance > 0 && totalAssigned === pendingBalance
  const depositCoversTotal = pendingBalance === 0 && ((reservation?.depositAmount ?? 0) > 0 || reservation?.wasFullyPaid === true)

  const statePalette = reservation ? ({
    pendiente:     { bg: 'oklch(95% 0.05 55)',      color: 'oklch(52% 0.15 55)',       border: 'oklch(80% 0.10 55)'  },
    señado:        { bg: t.acentoTerrazaClaro.val, color: t.acentoTerraza.val,       border: 'oklch(84% 0.07 42)'  },
    'en-cancha':   { bg: t.verdeCanchaActivo.val,  color: t.verdeCanchaProfundo.val,  border: t.verdeCancha.val     },
    ausente:       { bg: t.fondoHover.val,          color: t.textoInactivo.val,        border: t.divisor.val         },
    pagado:        { bg: t.verdeCanchaFondo.val,    color: t.verdeCanchaProfundo.val,  border: t.verdeCanchaActivo.val },
    mantenimiento: { bg: 'oklch(94% 0.06 88)',      color: 'oklch(32% 0.10 85)',       border: 'oklch(76% 0.13 88)'  },
    recurrente:    { bg: 'oklch(92% 0.04 275)',     color: 'oklch(28% 0.08 275)',      border: 'oklch(70% 0.09 275)' },
    jugado:        { bg: 'oklch(91% 0.012 220)',    color: 'oklch(38% 0.014 222)',     border: 'oklch(76% 0.018 222)' },
    evento:        { bg: 'oklch(93% 0.04 200)',     color: 'oklch(30% 0.08 200)',      border: 'oklch(68% 0.10 200)'  },
  } as Record<string, { bg: string; color: string; border: string }>)[reservation.state] : null

  const onPaymentChange = (cash: number, online: number) => { setCashAmount(cash); setOnlineAmount(online) }

  return {
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
  }
}
