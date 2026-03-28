import { Alert } from 'react-native'
import type { DayOfWeek, DayRoutine, RoutineSettings } from './routineTypes'

function toISODateString(date = new Date()) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
}

export function maybeNotifyToday(params: {
  today: DayOfWeek
  todayRoutine: DayRoutine
  settings: RoutineSettings
  onSettingsChange: (next: RoutineSettings) => void
  now?: Date
}) {
  const { today, todayRoutine, settings, onSettingsChange, now = new Date() } = params
  if (!settings.remindersEnabled) return

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

  Alert.alert(title, body)
  onSettingsChange({ ...settings, lastNotifiedISODate: iso })
}
