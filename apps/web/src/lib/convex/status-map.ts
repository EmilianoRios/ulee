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
