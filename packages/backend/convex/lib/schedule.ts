import type { DaySchedule } from './conflicts'

export interface ScheduleVersion {
  validFrom: string    // "YYYY-MM-DD" inclusive
  validTo?:  string    // "YYYY-MM-DD" exclusive; undefined = currently active
  schedule:  DaySchedule[]
}

/**
 * Adds n days to a "YYYY-MM-DD" date string using UTC arithmetic.
 * n may be any integer (positive or negative).
 */
export function addDays(dateStr: string, n: number): string {
  // T12:00:00Z anchors to noon UTC so that DST transitions (±1h) never shift the date
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Returns the DaySchedule[] that was active on `date`.
 *
 * Matching rule:
 *   entry.validFrom <= date AND (entry.validTo === undefined OR date < entry.validTo)
 *
 * Tie-break: when multiple entries match (e.g. two saves on the same day),
 * the last one in the array wins (entries are always appended, so last = newest).
 *
 * Falls back to currentSchedule when history is empty, undefined, or has no match.
 * This preserves backward compatibility for venues without history.
 *
 * NOTE: a same-day double-save produces a zero-width entry (validFrom === validTo).
 * The condition `date < entry.validTo` correctly excludes it.
 */
/**
 * Normalizes a DaySchedule so closeTime uses absolute minutes.
 * If closeTime <= openTime, the venue closes past midnight → closeTime += 1440 (INV-5).
 */
export function normalizeDaySchedule(d: DaySchedule): DaySchedule {
  return d.closeTime <= d.openTime ? { ...d, closeTime: d.closeTime + 1440 } : d
}

export function resolveScheduleForDate(
  history:         ScheduleVersion[] | undefined,
  currentSchedule: DaySchedule[],
  date:            string,
): DaySchedule[] {
  if (!history || history.length === 0) return currentSchedule

  // Iterate in reverse; first match wins (= latest validFrom wins on tie)
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i]!
    const afterStart = entry.validFrom <= date
    const beforeEnd  = entry.validTo === undefined || date < entry.validTo
    if (afterStart && beforeEnd) return entry.schedule
  }

  return currentSchedule
}
