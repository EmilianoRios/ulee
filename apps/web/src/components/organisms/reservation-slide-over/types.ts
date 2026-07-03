export type ReservationBackendStatus =
  | 'pending'
  | 'deposit_paid'
  | 'on_court'
  | 'absent'
  | 'paid'
  | 'maintenance'
  | 'recurring'
  | 'played'
  | 'event'

export interface SeriesUpdateFields {
  clientName?:  string
  clientPhone?: string
  totalAmount?: number
  notes?:       string
  startTime?:   number   // minutes since midnight
  endTime?:     number   // minutes since midnight (may be > 1440 for overnight)
  endDate?:     string   // "YYYY-MM-DD" — extension only
}

export interface ReservationUpdateFields {
  startTime?:   number   // absolute minutes since midnight
  endTime?:     number   // absolute minutes; may be > 1440 for overnight
  clientName?:  string
  clientPhone?: string
  totalAmount?: number
  notes?:       string
}
