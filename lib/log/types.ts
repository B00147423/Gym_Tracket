import type { DayOfWeek, Exercise } from '@/lib/routine/types'

export type PerformedSet = {
  reps: string
  weight: string
  notes: string
}

export type LoggedExercise = {
  exerciseId: string
  name: string
  plannedSets: string
  plannedReps: string
  plannedComments: string
  completed: boolean
  performedSets: PerformedSet[]
  performedText: string
}

export type WorkoutLog = {
  userId: string
  workoutDate: string // YYYY-MM-DD
  dayOfWeek: DayOfWeek
  workoutName: string
  restDay: boolean
  exercises: LoggedExercise[]
  updatedAt: string
}

export function fromPlannedExercise(ex: Exercise): LoggedExercise {
  return {
    exerciseId: ex.id,
    name: ex.name,
    plannedSets: ex.sets,
    plannedReps: ex.reps,
    plannedComments: ex.comments,
    completed: false,
    performedSets: [],
    performedText: '',
  }
}

