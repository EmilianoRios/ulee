/** Returns today's date as "YYYY-MM-DD" in Argentina (UTC-3). */
export function todayInAR(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

/** "HH:MM" → minutes since midnight. "20:00" = 1200. */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Coerces a DB time field that may be a legacy string or already a number. */
export function coerceTime(val: number | string): number {
  return typeof val === 'string' ? timeToMinutes(val) : val
}

/** Minutes since midnight → "HH:MM". 1620 → "03:00". Wraps at 1440 for display. */
export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Pure addition — no modular wrapping. Used for extension past midnight. */
export function addMinutes(base: number, delta: number): number {
  return base + delta
}
