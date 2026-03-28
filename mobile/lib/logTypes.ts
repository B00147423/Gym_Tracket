import type { DayOfWeek, Exercise } from './routineTypes'
import { plannedSetCount } from './plannedSetCount'

/** Structured set log (same JSON shape as web `lib/log/types`). */
export type PerformedSet = {
  reps: number | null
  weight: number | null
  completed: boolean
  rpe?: number | null
  notes?: string
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
  workoutDate: string
  dayOfWeek: DayOfWeek
  workoutName: string
  restDay: boolean
  exercises: LoggedExercise[]
  updatedAt: string
}

function seedPerformedSetsFromPlanner(plannedSets: string): PerformedSet[] {
  const n = plannedSetCount(plannedSets)
  return Array.from({ length: n }, () => ({
    reps: null,
    weight: null,
    completed: false,
    rpe: null,
    notes: '',
  }))
}

export function fromPlannedExercise(ex: Exercise): LoggedExercise {
  return {
    exerciseId: ex.id,
    name: ex.name,
    plannedSets: ex.sets,
    plannedReps: ex.reps,
    plannedComments: ex.comments,
    completed: false,
    performedSets: seedPerformedSetsFromPlanner(ex.sets),
    performedText: '',
  }
}
