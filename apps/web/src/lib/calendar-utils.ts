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
