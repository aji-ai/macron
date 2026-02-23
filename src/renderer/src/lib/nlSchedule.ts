import cronstrue from 'cronstrue'

const DAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6
}

function parseTime(input: string): { h: number; m: number } | null {
  const match = input.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
  if (!match) return null
  let h = parseInt(match[1])
  const m = parseInt(match[2] ?? '0')
  const meridiem = match[3]?.toLowerCase()
  if (meridiem === 'pm' && h !== 12) h += 12
  if (meridiem === 'am' && h === 12) h = 0
  return { h, m }
}

export function parseNLSchedule(input: string): string | null {
  const s = input.toLowerCase().trim()
  const time = parseTime(s)
  const h = time?.h ?? 9
  const m = time?.m ?? 0

  // Every N minutes
  const everyNMin = s.match(/every\s+(\d+)\s+min/)
  if (everyNMin) return `*/${everyNMin[1]} * * * *`

  // Every N hours
  const everyNHour = s.match(/every\s+(\d+)\s+hour/)
  if (everyNHour) return `${m} */${everyNHour[1]} * * *`

  // Hourly / every hour
  if (/\b(hourly|every\s+hour)\b/.test(s)) return `${m} * * * *`

  // Every weekday / weekdays
  if (/\b(every\s+weekday|weekdays)\b/.test(s)) return `${m} ${h} * * 1-5`

  // Named day: "every monday", "on friday", "weekly on tuesday"
  for (const [day, num] of Object.entries(DAYS)) {
    if (new RegExp(`\\b${day}\\b`).test(s)) {
      return `${m} ${h} * * ${num}`
    }
  }

  // Weekly (default Monday)
  if (/\bweekly\b/.test(s)) return `${m} ${h} * * 1`

  // Monthly on day N
  const monthlyDay = s.match(/monthly\s+on\s+day\s+(\d+)/)
  if (monthlyDay) return `${m} ${h} ${monthlyDay[1]} * *`

  // Monthly (default 1st)
  if (/\bmonthly\b/.test(s)) return `${m} ${h} 1 * *`

  // Daily / every day
  if (/\b(daily|every\s+day)\b/.test(s)) return `${m} ${h} * * *`

  return null
}

export function cronToHuman(expr: string): string {
  try {
    return cronstrue.toString(expr, { use24HourTimeFormat: false, verbose: false })
  } catch {
    return expr
  }
}
