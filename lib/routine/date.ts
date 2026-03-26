import type { DayOfWeek } from './types'

const JS_DAY_INDEX_TO_DAY: Record<number, DayOfWeek> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

export function getTodayDayOfWeek(now = new Date()): DayOfWeek {
  return JS_DAY_INDEX_TO_DAY[now.getDay()]
}

export function toISODateString(now = new Date()): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

