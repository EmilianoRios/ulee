import type { Doc } from '@canchero/backend'

export const RESERVATION_STATUS_LABELS: Record<Doc<'reservations'>['status'], string> = {
  deposit_paid: 'Señado',
  on_court:     'Paga en cancha',
  absent:       'Ausente',
  paid:         'Pagado',
  maintenance:  'Mantenimiento',
  recurring:    'Recurrente',
  played:       'Jugado',
  event:        'Evento',
}

export const COURT_STATUS_LABELS: Record<Doc<'courts'>['status'], string> = {
  active:      'Activa',
  maintenance: 'Mantenimiento',
  inactive:    'Inactiva',
}
