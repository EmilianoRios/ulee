import { describe, it, expect } from 'vitest'
import { hasConflict } from './conflicts'

describe('hasConflict', () => {
  it('returns false for empty existing array', () => {
    expect(hasConflict([], '10:00', '11:00')).toBe(false)
  })

  it('returns true for overlapping slots', () => {
    const existing = [{ startTime: '10:00', endTime: '11:00' }]
    expect(hasConflict(existing, '10:30', '11:30')).toBe(true)
  })

  it('returns false for adjacent slots (end === start of another)', () => {
    const existing = [{ startTime: '10:00', endTime: '11:00' }]
    expect(hasConflict(existing, '11:00', '12:00')).toBe(false)
  })

  it('returns false for slot ending exactly when existing starts', () => {
    const existing = [{ startTime: '11:00', endTime: '12:00' }]
    expect(hasConflict(existing, '10:00', '11:00')).toBe(false)
  })

  it('returns true for exact same slot', () => {
    const existing = [{ startTime: '10:00', endTime: '11:00' }]
    expect(hasConflict(existing, '10:00', '11:00')).toBe(true)
  })

  it('returns true for new slot fully inside existing', () => {
    const existing = [{ startTime: '09:00', endTime: '12:00' }]
    expect(hasConflict(existing, '10:00', '11:00')).toBe(true)
  })

  it('returns true for new slot fully containing existing', () => {
    const existing = [{ startTime: '10:00', endTime: '11:00' }]
    expect(hasConflict(existing, '09:00', '12:00')).toBe(true)
  })
})
