import type { Id } from '../_generated/dataModel'

export interface DaySchedule {
  dayOfWeek: number   // ISO 8601: 1=Monday … 7=Sunday
  active:    boolean
  openTime:  number   // minutes since midnight (0–1439)
  closeTime: number   // minutes since midnight; > 1440 when overnight (INV-5)
}

interface TimeSlot {
  _id:       Id<'reservations'>
  startTime: number
  endTime:   number
}

/**
 * Returns true if [newStart, newEnd) overlaps any existing slot.
 * Pass excludeReservationId to skip the slot being updated (self-overlap guard).
 */
export function hasConflict(
  existing:              TimeSlot[],
  newStart:              number,
  newEnd:                number,
  excludeReservationId?: Id<'reservations'>,
): boolean {
  return existing
    .filter((r) => r._id !== excludeReservationId)
    .some((r) => newStart < r.endTime && newEnd > r.startTime)
}

/**
 * Returns true if the [startTime, endTime) window fits within the
 * active schedule entry for dayOfWeek. Returns false if the day is
 * inactive or has no schedule entry.
 * closeTime must already be normalized (> 1440 for overnight venues — INV-5).
 */
export function isWithinSchedule(
  schedule:  DaySchedule[],
  dayOfWeek: number,
  startTime: number,
  endTime:   number,
): boolean {
  const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek)
  if (!entry || !entry.active) return false
  return startTime >= entry.openTime && endTime <= entry.closeTime
}

// ---------------------------------------------------------------------------
// Overnight helpers — cross-day conflict detection
// ---------------------------------------------------------------------------

function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

/**
 * Projects a reservation's time interval to the absolute-minute axis of baseDate.
 * date-1 → offset -1440, date → offset 0, date+1 → offset +1440.
 * Returns null if the projected interval does not touch [0, 2880).
 */
export function projectToCommonAxis(
  reservation: { date: string; startTime: number; endTime: number },
  baseDate:    string,
): { start: number; end: number } | null {
  let offset: number
  if (reservation.date === baseDate) {
    offset = 0
  } else if (reservation.date === shiftDate(baseDate, -1)) {
    offset = -1440
  } else if (reservation.date === shiftDate(baseDate, 1)) {
    offset = +1440
  } else {
    return null
  }
  const start = reservation.startTime + offset
  const end   = reservation.endTime   + offset
  if (end <= 0 || start >= 2880) return null
  return { start, end }
}

/**
 * Builds the conflict-detection window for a given court and base date.
 * Replaces the old `existing.filter(r => r.date === date)` pattern.
 * Projects reservations from [date-1, date, date+1] to the axis of baseDate.
 */
export function buildConflictWindow(
  existing: Array<{ _id: Id<'reservations'>; date: string; startTime: number; endTime: number }>,
  baseDate: string,
): TimeSlot[] {
  return existing
    .map((r) => {
      const proj = projectToCommonAxis(r, baseDate)
      return proj ? { _id: r._id, startTime: proj.start, endTime: proj.end } : null
    })
    .filter((s): s is TimeSlot => s !== null)
}
