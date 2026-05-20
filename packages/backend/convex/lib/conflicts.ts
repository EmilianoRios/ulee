import type { Id } from '../_generated/dataModel'

export interface DaySchedule {
  dayOfWeek: number   // ISO 8601: 1=Monday … 7=Sunday
  active:    boolean
  openTime:  string   // "HH:MM"
  closeTime: string   // "HH:MM"
}

interface TimeSlot {
  _id:       Id<'reservations'>
  startTime: string
  endTime:   string
}

/**
 * Returns true if [newStart, newEnd) overlaps any existing slot.
 * Pass excludeReservationId to skip the slot being updated (self-overlap guard).
 */
export function hasConflict(
  existing:              TimeSlot[],
  newStart:              string,
  newEnd:                string,
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
 */
export function isWithinSchedule(
  schedule:  DaySchedule[],
  dayOfWeek: number,
  startTime: string,
  endTime:   string,
): boolean {
  const entry = schedule.find((s) => s.dayOfWeek === dayOfWeek)
  if (!entry || !entry.active) return false
  return startTime >= entry.openTime && endTime <= entry.closeTime
}
