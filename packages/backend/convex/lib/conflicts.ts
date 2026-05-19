interface TimeSlot { startTime: string; endTime: string }

/** Returns true if [newStart, newEnd) overlaps any slot in existing. */
export function hasConflict(existing: TimeSlot[], newStart: string, newEnd: string): boolean {
  return existing.some(r => newStart < r.endTime && newEnd > r.startTime)
}
