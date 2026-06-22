import type { Doc } from '@canchero/backend'
import type { CalendarReservationState } from '@/components/atoms/reservation-card'

const STATUS_MAP: Record<Doc<'reservations'>['status'], CalendarReservationState> = {
  pending:      'pendiente',
  deposit_paid: 'señado',
  on_court:     'en-cancha',
  absent:       'ausente',
  paid:         'pagado',
  maintenance:  'mantenimiento',
  recurring:    'recurrente',
  played:       'jugado',
  event:        'evento',
}

export function statusToCalendarState(
  status: Doc<'reservations'>['status']
): CalendarReservationState {
  return STATUS_MAP[status]
}

// ─── Effective status ─────────────────────────────────────────────────────────
// Mirrors the same client-side override logic used in CalendarDayView.
// Once the Convex cron runs, the DB will reflect the correct status and this
// becomes a no-op for already-transitioned rows.

function getArgentinaTime(date: Date): { hours: number; minutes: number } {
  const str = date.toLocaleString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour12:   false,
    hour:     '2-digit',
    minute:   '2-digit',
  })
  const [h, m] = str.split(':').map(Number)
  return { hours: h ?? 0, minutes: m ?? 0 }
}

function getArgentinaDateString(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
}

function timeStrToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function applyEffectiveStatus(
  status:    Doc<'reservations'>['status'],
  date:      string,   // YYYY-MM-DD (Argentina local date)
  startTime: string,   // HH:MM
  endTime:   string,   // HH:MM
  now:       Date,
): Doc<'reservations'>['status'] {
  const todayStr              = getArgentinaDateString(now)
  const { hours: h, minutes: m } = getArgentinaTime(now)
  const nowMins               = h * 60 + m
  const startMins             = timeStrToMins(startTime)
  const endMinsRaw            = timeStrToMins(endTime)
  // minutesToTime wraps at 1440 for overnight slots (endTime > 1440 in DB).
  // Detect overnight by end < start after wrapping, then restore the offset.
  const endMins               = endMinsRaw < startMins ? endMinsRaw + 1440 : endMinsRaw

  const canTransition = status === 'deposit_paid' || status === 'on_court' || status === 'pending'
  const isPastDay     = date < todayStr
  const isToday       = date === todayStr

  if ((isPastDay || (isToday && nowMins > endMins)) && canTransition) return 'played'
  // Note: 'paid' is intentionally excluded here — paid slots stay paid in table/finance views.
  // CalendarDayView applies its own paid→on_court override for the visual timeline.
  if (isToday && nowMins >= startMins && nowMins < endMins &&
      (status === 'deposit_paid' || status === 'pending')) {
    return 'on_court'
  }
  return status
}
