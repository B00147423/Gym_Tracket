import type { DayOfWeek } from '@/lib/routine/types'
import { getTodayDayOfWeek, toISODateString } from '@/lib/routine/date'

export type WeekDayItem = {
  date: string // YYYY-MM-DD
  dayOfWeek: DayOfWeek
  label: string // e.g. Wed
  isToday: boolean
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfWeekMonday(date: Date): Date {
  const day = date.getDay() // 0=Sun
  const diff = (day + 6) % 7 // Mon=0 ... Sun=6
  return addDays(date, -diff)
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

export function getWeekDaysFor(date = new Date()): WeekDayItem[] {
  const todayISO = toISODateString(date)
  const start = startOfWeekMonday(date)
  const items: WeekDayItem[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i)
    const iso = toISODateString(d)
    const dow = getTodayDayOfWeek(d)
    items.push({
      date: iso,
      dayOfWeek: dow,
      label: DAY_SHORT[dow],
      isToday: iso === todayISO,
    })
  }
  return items
}

