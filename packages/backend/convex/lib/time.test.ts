import { describe, it, expect, vi, afterEach } from 'vitest'
import { todayInAR } from './time'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('todayInAR', () => {
  it('returns a string matching YYYY-MM-DD format', () => {
    expect(todayInAR()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('at UTC midnight (00:00 UTC) returns previous day in AR (UTC-3)', () => {
    // 2024-03-15T00:00:00.000Z is midnight UTC
    // UTC-3 = 2024-03-14T21:00:00 → should return '2024-03-14'
    const utcMidnight = new Date('2024-03-15T00:00:00.000Z').getTime()
    vi.spyOn(Date, 'now').mockReturnValue(utcMidnight)
    expect(todayInAR()).toBe('2024-03-14')
  })

  it('returns the correct date for a nominal AR daytime moment', () => {
    // 2024-06-10T15:00:00.000Z = 12:00 AR (UTC-3) → should return '2024-06-10'
    const noonAR = new Date('2024-06-10T15:00:00.000Z').getTime()
    vi.spyOn(Date, 'now').mockReturnValue(noonAR)
    expect(todayInAR()).toBe('2024-06-10')
  })
})
