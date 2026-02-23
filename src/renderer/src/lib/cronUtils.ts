export function getNextRunTime(schedule: string): string {
  const fields = schedule.trim().split(/\s+/)
  if (fields.length !== 5) return 'Invalid schedule'
  const [minField, hourField, domField, monField, dowField] = fields

  function matches(field: string, value: number): boolean {
    if (field === '*') return true
    for (const part of field.split(',')) {
      if (part.startsWith('*/')) {
        const step = parseInt(part.slice(2))
        if (step > 0 && value % step === 0) return true
      } else if (part.includes('-')) {
        const [lo, hi] = part.split('-').map(Number)
        if (value >= lo && value <= hi) return true
      } else {
        if (parseInt(part) === value) return true
      }
    }
    return false
  }

  const now = new Date()
  const test = new Date(now.getTime() + 60_000)
  test.setSeconds(0, 0)

  const limit = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000)

  while (test < limit) {
    if (
      matches(monField, test.getMonth() + 1) &&
      matches(domField, test.getDate()) &&
      matches(dowField, test.getDay()) &&
      matches(hourField, test.getHours()) &&
      matches(minField, test.getMinutes())
    ) {
      return formatRelative(test, now)
    }
    test.setTime(test.getTime() + 60_000)
  }

  return 'No upcoming run'
}

function formatRelative(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime()
  const diffMin = Math.round(diffMs / 60_000)

  if (diffMin < 60) return `in ${diffMin}m`

  const diffHours = Math.floor(diffMin / 60)
  const remMin = diffMin % 60

  if (diffHours < 24) {
    return remMin > 0 ? `in ${diffHours}h ${remMin}m` : `in ${diffHours}h`
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (diffHours < 7 * 24) {
    return `${days[target.getDay()]} at ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return `${months[target.getMonth()]} ${target.getDate()}`
}
