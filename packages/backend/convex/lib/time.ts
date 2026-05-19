/** Returns today's date as "YYYY-MM-DD" in Argentina (UTC-3). */
export function todayInAR(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
