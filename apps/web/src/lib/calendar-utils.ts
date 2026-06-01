export function getMonthGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)

  // Monday-first: Monday=0 … Sunday=6
  const startOffset = (firstDay.getDay() + 6) % 7

  const cells: Date[] = []

  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push(new Date(year, month, -i))
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(year, month, d))
  }

  // Pad to exactly 6 rows (42 cells)
  const target = 42
  let next = 1
  while (cells.length < target) {
    cells.push(new Date(year, month + 1, next++))
  }

  const weeks: Date[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

// ─── Court color palettes ─────────────────────────────────────────────────────

export const COURT_PALETTES = [
  { bg: 'oklch(92% 0.04 275)', border: 'oklch(70% 0.09 275)', text: 'oklch(28% 0.08 275)' },
  { bg: 'oklch(92% 0.06 42)',  border: 'oklch(78% 0.10 42)',  text: 'oklch(32% 0.09 42)'  },
  { bg: 'oklch(93% 0.04 200)', border: 'oklch(68% 0.10 200)', text: 'oklch(30% 0.08 200)' },
  { bg: 'oklch(93% 0.05 130)', border: 'oklch(68% 0.12 130)', text: 'oklch(28% 0.10 130)' },
  { bg: 'oklch(93% 0.05 350)', border: 'oklch(70% 0.10 350)', text: 'oklch(30% 0.09 350)' },
  { bg: 'oklch(93% 0.04 60)',  border: 'oklch(72% 0.12 60)',  text: 'oklch(30% 0.09 60)'  },
] as const

// ─── Overlap layout ───────────────────────────────────────────────────────────

export interface OverlapLayout {
  leftFraction:  number   // 0–1
  widthFraction: number   // 0–1, < 1 when concurrent reservations exist
}

function intervalsOverlap(
  a: { startTime: number; endTime: number },
  b: { startTime: number; endTime: number },
): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime
}

/**
 * Computes horizontal tiling positions for reservations that overlap in time.
 * Non-overlapping reservations keep full width. Concurrent ones share the column
 * equally, ordered by lane assignment.
 */
export function computeOverlapLayout<T extends { id: string; startTime: number; endTime: number }>(
  reservations: T[],
): Map<string, OverlapLayout> {
  if (reservations.length === 0) return new Map()
  if (reservations.length === 1) {
    return new Map([[reservations[0]!.id, { leftFraction: 0, widthFraction: 1 }]])
  }

  const sorted = [...reservations].sort((a, b) =>
    a.startTime !== b.startTime
      ? a.startTime - b.startTime
      : (b.endTime - b.startTime) - (a.endTime - a.startTime),
  )

  // Build connected components of the overlap graph via BFS
  const components: T[][] = []
  const seen = new Set<string>()

  for (const res of sorted) {
    if (seen.has(res.id)) continue
    const component: T[] = []
    const queue: T[]     = [res]
    while (queue.length > 0) {
      const curr = queue.shift()!
      if (seen.has(curr.id)) continue
      seen.add(curr.id)
      component.push(curr)
      for (const other of sorted) {
        if (!seen.has(other.id) && intervalsOverlap(curr, other)) {
          queue.push(other)
        }
      }
    }
    components.push(component)
  }

  const result = new Map<string, OverlapLayout>()

  for (const component of components) {
    if (component.length === 1) {
      result.set(component[0]!.id, { leftFraction: 0, widthFraction: 1 })
      continue
    }

    const compSorted = [...component].sort((a, b) => a.startTime - b.startTime)

    // Max concurrent within the component (max-clique of this interval graph)
    const events: { time: number; isStart: boolean }[] = []
    for (const r of compSorted) {
      events.push({ time: r.startTime, isStart: true  })
      events.push({ time: r.endTime,   isStart: false })
    }
    // End events before start events at the same timestamp so adjacent
    // reservations (A ends at 10:00, B starts at 10:00) are not counted concurrent
    events.sort((a, b) =>
      a.time !== b.time ? a.time - b.time : (a.isStart ? 1 : -1),
    )

    let maxConcurrent = 0
    let active        = 0
    for (const e of events) {
      if (e.isStart) active++
      else           active--
      maxConcurrent = Math.max(maxConcurrent, active)
    }

    // Greedy lane assignment: assign each reservation to the first free lane
    const laneEndTimes: number[]        = []
    const laneMap       = new Map<string, number>()

    for (const res of compSorted) {
      const lane    = laneEndTimes.findIndex((end) => end <= res.startTime)
      const laneIdx = lane >= 0 ? lane : laneEndTimes.length
      laneEndTimes[laneIdx] = res.endTime
      laneMap.set(res.id, laneIdx)
    }

    for (const res of compSorted) {
      const laneIdx = laneMap.get(res.id)!
      result.set(res.id, {
        leftFraction:  laneIdx / maxConcurrent,
        widthFraction: 1       / maxConcurrent,
      })
    }
  }

  return result
}
