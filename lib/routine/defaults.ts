import type { DayRoutine, RoutineSettings, WeeklyRoutine } from './types'
import { DAYS } from './types'

export function createEmptyDayRoutine(): DayRoutine {
  return {
    workoutName: '',
    exercises: [],
    restDay: false,
  }
}

export function createEmptyWeeklyRoutine(): WeeklyRoutine {
  return Object.fromEntries(DAYS.map((d) => [d, createEmptyDayRoutine()])) as WeeklyRoutine
}

export function createDefaultRoutineSettings(): RoutineSettings {
  return {
    remindersEnabled: false,
    lastNotifiedISODate: null,
  }
}

