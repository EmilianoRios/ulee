'use client'

import { useTheme } from 'tamagui'
import { Moon } from 'lucide-react'
import type { CalendarReservation } from '@/components/atoms/reservation-card'
import { minutesToTime } from '../helpers'
import { SectionLabel } from '../SectionLabel'
import { ActionButton } from '../ActionButton'
import { ExtendButton } from '../ExtendButton'

// Extend-reservation controls only. The "cobro" (payment) sub-section for
// en-cancha lives in EnCanchaCobro because in the original layout it has no
// isEditing/deleteConfirm guard (it can render alongside the edit form).
export function EnCanchaActions({
  reservation, extendMins, setExtendMins, can30, can60, newEndTime, extraCharge, hasNightRateSplit,
  overrideConfirmPending, setOverrideConfirmPending, onExtend,
}: {
  reservation:                CalendarReservation
  extendMins:                 0 | 30 | 60
  setExtendMins:              (v: 0 | 30 | 60) => void
  can30:                      boolean
  can60:                      boolean
  newEndTime:                 string
  extraCharge:                number
  hasNightRateSplit:          boolean
  overrideConfirmPending:     boolean
  setOverrideConfirmPending:  (v: boolean) => void
  onExtend?:                  (reservationId: string, additionalMinutes: 30 | 60, overrideSchedule?: boolean) => Promise<void>
}) {
  const t = useTheme()

  return (
    <>
      <SectionLabel>Extender reserva</SectionLabel>
      <div style={{ display: 'flex', gap: 8 }}>
        <ExtendButton label="+30 min" available={can30} active={extendMins === 30} onClick={() => setExtendMins(extendMins === 30 ? 0 : 30)} />
        <ExtendButton label="+60 min" available={can60} active={extendMins === 60} onClick={() => setExtendMins(extendMins === 60 ? 0 : 60)} />
      </div>

      {extendMins > 0 && (
        <div style={{
          marginTop:       2,
          padding:         '14px 16px',
          borderRadius:    8,
          border:          `1px solid ${overrideConfirmPending ? 'oklch(75% 0.10 42)' : t.bordeNeutral.val}`,
          backgroundColor: overrideConfirmPending ? 'oklch(97% 0.03 42)' : t.superficie.val,
          display:         'flex',
          flexDirection:   'column',
          gap:             10,
          transition:      'border-color 150ms ease-out, background-color 150ms ease-out',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: t.textoMuted.val }}>Nuevo horario</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: t.textoNav.val }}>
              {minutesToTime(reservation.startTime)} – {newEndTime}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 12, color: t.textoMuted.val }}>Cargo adicional</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: t.verdeCanchaProfundo.val }}>
              ${extraCharge.toLocaleString('es-AR')}
            </span>
          </div>

          {hasNightRateSplit && (
            <div style={{
              display:         'inline-flex',
              alignSelf:       'flex-start',
              alignItems:      'center',
              gap:             5,
              padding:         '4px 9px',
              borderRadius:    9999,
              backgroundColor: 'oklch(93% 0.025 42)',
              border:          '1px solid oklch(84% 0.07 42)',
            }}>
              <Moon size={11} strokeWidth={2} color="oklch(44% 0.11 42)" />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'oklch(44% 0.11 42)', lineHeight: 1 }}>
                Incluye tarifa nocturna
              </span>
            </div>
          )}

          {overrideConfirmPending ? (
            <>
              <p style={{ margin: 0, fontSize: 12, color: 'oklch(42% 0.12 42)', lineHeight: 1.4 }}>
                Esta extensión supera el horario de cierre de la sede. ¿Confirmás de todas formas?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionButton
                  label="Confirmar de todas formas"
                  onClick={async () => {
                    await onExtend?.(reservation.id, extendMins as 30 | 60, true)
                    setExtendMins(0)
                    setOverrideConfirmPending(false)
                  }}
                  variant="secondary"
                />
                <ActionButton
                  label="Cancelar"
                  onClick={() => setOverrideConfirmPending(false)}
                  variant="secondary"
                  compact
                />
              </div>
            </>
          ) : (
            <ActionButton
              label="Confirmar extensión"
              onClick={async () => {
                try {
                  await onExtend?.(reservation.id, extendMins as 30 | 60)
                  setExtendMins(0)
                } catch (err: unknown) {
                  const data = (err as { data?: { code?: string } }).data
                  if (data?.code === 'outside_schedule_override_required') {
                    setOverrideConfirmPending(true)
                  }
                }
              }}
              variant="secondary"
            />
          )}
        </div>
      )}
    </>
  )
}
