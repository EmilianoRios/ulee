/**
 * Pure series expansion helper — no Convex ctx dependency.
 *
 * See spec RULE-E1 through RULE-E7 for full behavior contract.
 *
 * RULE-E7 (biweekly multi-day): When diasSemana = [1, 3] (Mon+Wed) and
 * weekInterval = 2, BOTH days emit in the SAME active week; the week cursor
 * then advances weekInterval weeks. Days are NOT interleaved across separate weeks.
 */

// ---------------------------------------------------------------------------
// Internal date helpers (UTC noon arithmetic — safe for AR UTC-3 strings)
// ---------------------------------------------------------------------------

function dateToStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * Shifts a "YYYY-MM-DD" string by `days` (positive or negative).
 * Uses UTC noon to avoid DST / timezone shifts.
 */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return dateToStr(d)
}

/**
 * Returns the ISO 8601 weekday of a "YYYY-MM-DD" string.
 * 1 = Monday … 7 = Sunday.
 */
function isoWeekdayOf(dateStr: string): number {
  const d  = new Date(`${dateStr}T12:00:00Z`)
  const js = d.getUTCDay() // 0 = Sunday … 6 = Saturday
  return js === 0 ? 7 : js
}

/**
 * Returns the Monday of the ISO week that contains `dateStr`.
 */
function mondayOf(dateStr: string): string {
  const dow = isoWeekdayOf(dateStr) // 1 = Mon … 7 = Sun
  return shiftDate(dateStr, 1 - dow)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Expands a recurring series into a sorted array of "YYYY-MM-DD" date strings.
 *
 * @param startDate      "YYYY-MM-DD" — first possible occurrence (inclusive)
 * @param diasSemana     ISO 8601 weekday numbers (1=Mon…7=Sun); sorted internally
 * @param weekInterval   1 = weekly, 2 = biweekly
 * @param endDate        "YYYY-MM-DD" optional — last possible occurrence (inclusive)
 * @param maxOccurrences Hard cap on total output length (default: 52)
 * @returns              Sorted "YYYY-MM-DD" array
 */
export function expandSeries(
  startDate:       string,
  diasSemana:      number[],
  weekInterval:    1 | 2,
  endDate?:        string,
  maxOccurrences?: number,
): string[] {
  // Guards
  if (diasSemana.length === 0) return []
  if (endDate && endDate < startDate) return []

  const cap    = maxOccurrences ?? 52
  const sorted = [...diasSemana].sort((a, b) => a - b)
  const results: string[] = []

  // Start at the Monday of the ISO week that contains startDate.
  // This ensures we consider all target days in startDate's week (some may be
  // before startDate — those are skipped via the `date < startDate` guard below).
  let weekMonday = mondayOf(startDate)

  while (results.length < cap) {
    // Early exit: the earliest possible day this week is already past endDate
    const firstDayThisWeek = shiftDate(weekMonday, sorted[0]! - 1)
    if (endDate && firstDayThisWeek > endDate) break

    for (const dow of sorted) {
      // dow offset from Monday: Mon=0, Tue=1, … Sun=6
      const date = shiftDate(weekMonday, dow - 1)

      if (date < startDate) continue              // skip pre-startDate days in first week
      if (endDate && date > endDate) return results // past end — done

      results.push(date)
      if (results.length >= cap) return results
    }

    // Advance active week by weekInterval weeks (RULE-E2, RULE-E7).
    // Both days in the same week are emitted BEFORE the cursor advances.
    weekMonday = shiftDate(weekMonday, weekInterval * 7)
  }

  return results
}
