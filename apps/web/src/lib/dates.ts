// ─── Date utilities (UTC-3 timezone) ─────────────────────────────────────────
//
// All functions operate in UTC-3 (Argentina timezone) by subtracting the offset
// before calling toISOString(), which always returns UTC.

const TZ_OFFSET_MS = 3 * 60 * 60 * 1000

export type DateFilter = 'hoy' | 'manana' | 'semana'

/** Returns today's date as "YYYY-MM-DD" in UTC-3. */
export function todayUTC3(): string {
  return new Date(Date.now() - TZ_OFFSET_MS).toISOString().slice(0, 10)
}

/** Returns tomorrow's date as "YYYY-MM-DD" in UTC-3. */
export function tomorrowUTC3(): string {
  const d = new Date(Date.now() - TZ_OFFSET_MS)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

/** Returns the Monday of the current ISO week as "YYYY-MM-DD" in UTC-3. */
export function weekStartUTC3(): string {
  const now = new Date(Date.now() - TZ_OFFSET_MS)
  const dow = now.getUTCDay() === 0 ? 7 : now.getUTCDay()
  const mon = new Date(now)
  mon.setUTCDate(now.getUTCDate() - (dow - 1))
  return mon.toISOString().slice(0, 10)
}

/** Returns the Sunday of the current ISO week as "YYYY-MM-DD" in UTC-3. */
export function weekEndUTC3(): string {
  const now = new Date(Date.now() - TZ_OFFSET_MS)
  const dow = now.getUTCDay() === 0 ? 7 : now.getUTCDay()
  const sun = new Date(now)
  sun.setUTCDate(now.getUTCDate() + (7 - dow))
  return sun.toISOString().slice(0, 10)
}

/**
 * Resolves a DateFilter to a date range and a filterStartDate.
 *
 * - dateFrom / dateTo: inclusive range for the query
 * - filterStartDate: the canonical "start" date for the filter (used to seed
 *   the NewEntrySlideOver initialDate)
 */
export function resolveDateFilter(filter: DateFilter): {
  dateFrom:        string
  dateTo:          string
  filterStartDate: string
} {
  switch (filter) {
    case 'hoy': {
      const today = todayUTC3()
      return { dateFrom: today, dateTo: today, filterStartDate: today }
    }
    case 'manana': {
      const tomorrow = tomorrowUTC3()
      return { dateFrom: tomorrow, dateTo: tomorrow, filterStartDate: tomorrow }
    }
    case 'semana': {
      return {
        dateFrom:        weekStartUTC3(),
        dateTo:          weekEndUTC3(),
        filterStartDate: weekStartUTC3(),
      }
    }
  }
}
