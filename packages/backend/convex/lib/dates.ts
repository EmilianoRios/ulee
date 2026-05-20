/**
 * Convert "YYYY-MM-DD" to ISO 8601 dayOfWeek (1=Monday … 7=Sunday).
 * Uses UTC noon to avoid timezone shifts — dates in Convex are stored as
 * Argentina-local strings, so parsing as UTC noon is safe.
 */
export function isoWeekday(date: string): number {
  const d = new Date(`${date}T12:00:00Z`)
  const js = d.getUTCDay() // 0=Sun … 6=Sat
  return js === 0 ? 7 : js
}
