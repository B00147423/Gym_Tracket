export const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type DayOfWeek = (typeof DAYS)[number]

export type Exercise = {
  id: string
  name: string
  sets: string
  reps: string
  comments: string
}

export type DayRoutine = {
  workoutName: string
  exercises: Exercise[]
  restDay: boolean
}

export type WeeklyRoutine = Record<DayOfWeek, DayRoutine>

export type RoutineSettings = {
  remindersEnabled: boolean
  lastNotifiedISODate: string | null
}

