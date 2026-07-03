import type { CalendarReservation } from '@/components/atoms/reservation-card'

export function getPaymentErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.includes('invalid_split_amounts'))
    return 'Los montos ingresados no coinciden con el saldo pendiente.'
  return 'No se pudo registrar el cobro. Intentá de nuevo.'
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60) % 24
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function fmtDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const raw = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function addMins(totalMins: number, mins: number): number {
  return totalMins + mins
}

export function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

export function isSlotFree(
  courtId:      string,
  startMins:    number,
  endMins:      number,
  reservations: CalendarReservation[],
  excludeId:    string,
): boolean {
  return !reservations.some((r) => {
    if (r.id === excludeId || r.courtId !== courtId) return false
    return r.startTime < endMins && r.endTime > startMins
  })
}

export const STATE_LABEL: Record<string, string> = {
  pendiente:     'Pendiente · a cobrar',
  señado:        'Señado · cobra al llegar',
  'en-cancha':   'En cancha',
  ausente:       'Ausente',
  pagado:        'Pagado',
  mantenimiento: 'Mantenimiento',
  recurrente:    'Turno recurrente',
  jugado:        'Jugado · cobro pendiente',
  evento:        'Evento',
}
