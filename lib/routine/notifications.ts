import type { DayRoutine, DayOfWeek, RoutineSettings } from './types'
import { toISODateString } from './date'

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'denied'
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission !== 'default') return Notification.permission
  return await Notification.requestPermission()
}

export function maybeNotifyToday(params: {
  today: DayOfWeek
  todayRoutine: DayRoutine
  settings: RoutineSettings
  onSettingsChange: (next: RoutineSettings) => void
  now?: Date
}): void {
  const { today, todayRoutine, settings, onSettingsChange, now = new Date() } = params

  if (!settings.remindersEnabled) return
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const iso = toISODateString(now)
  if (settings.lastNotifiedISODate === iso) return

  const title = todayRoutine.restDay
    ? `Rest day (${today})`
    : todayRoutine.workoutName
      ? `Workout today: ${todayRoutine.workoutName}`
      : `Workout reminder (${today})`

  const body = todayRoutine.restDay
    ? 'Recovery day. Take it easy.'
    : todayRoutine.exercises.length
      ? `${todayRoutine.exercises.length} exercise${todayRoutine.exercises.length === 1 ? '' : 's'} planned.`
      : 'Open the app to view your routine.'

  new Notification(title, { body })
  onSettingsChange({ ...settings, lastNotifiedISODate: iso })
}

