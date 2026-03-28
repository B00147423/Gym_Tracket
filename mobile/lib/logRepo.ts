import { DAYS } from './routineTypes'
import type { WeeklyRoutine } from './routineTypes'
import { getSupabase } from './supabase'
import { fromPlannedExercise } from './logTypes'
import type { LoggedExercise, PerformedSet, WorkoutLog } from './logTypes'
import {
  normalizeLoggedExercise,
  formatCompleteSetsLine,
  bestSetFromPerformedSets,
  hasValidLoggedSet,
  persistedExerciseSkipped,
} from './performedSets'

type WorkoutLogRow = {
  user_id: string
  workout_date: string
  day_of_week: string
  workout_name: string
  rest_day: boolean
  exercises: unknown
  updated_at: string
}

const TABLE = 'workout_logs'

async function getAuthedUserId() {
  const supabase = getSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function loadWorkoutLogByDate(workoutDate: string): Promise<WorkoutLog | null> {
  const supabase = getSupabase()
  const userId = await getAuthedUserId()
  const { data, error } = await supabase
    .from(TABLE)
    .select('user_id, workout_date, day_of_week, workout_name, rest_day, exercises, updated_at')
    .eq('user_id', userId)
    .eq('workout_date', workoutDate)
    .maybeSingle<WorkoutLogRow>()
  if (error) throw error
  if (!data) return null
  const rawEx = (data.exercises as LoggedExercise[] | null | undefined) ?? []
  return {
    userId: data.user_id,
    workoutDate: data.workout_date,
    dayOfWeek: data.day_of_week as WorkoutLog['dayOfWeek'],
    workoutName: data.workout_name,
    restDay: data.rest_day,
    exercises: rawEx.map((e) => normalizeLoggedExercise(e)),
    updatedAt: data.updated_at,
  }
}

export async function listWorkoutLogsInRange(params: { startDate: string; endDate: string }) {
  const supabase = getSupabase()
  const userId = await getAuthedUserId()
  const { data, error } = await supabase
    .from(TABLE)
    .select('user_id, workout_date, day_of_week, workout_name, rest_day, exercises, updated_at')
    .eq('user_id', userId)
    .gte('workout_date', params.startDate)
    .lte('workout_date', params.endDate)
    .order('workout_date', { ascending: true })
  if (error) throw error
  const rows = (data ?? []) as WorkoutLogRow[]
  return rows.map((r) => ({
    userId: r.user_id,
    workoutDate: r.workout_date,
    dayOfWeek: r.day_of_week as WorkoutLog['dayOfWeek'],
    workoutName: r.workout_name,
    restDay: r.rest_day,
    exercises: ((r.exercises as LoggedExercise[] | null | undefined) ?? []).map((e) => normalizeLoggedExercise(e)),
    updatedAt: r.updated_at,
  })) satisfies WorkoutLog[]
}

export async function saveWorkoutLog(log: Omit<WorkoutLog, 'userId' | 'updatedAt'>) {
  const supabase = getSupabase()
  const userId = await getAuthedUserId()
  const exercises = log.exercises.map((e) => ({
    ...e,
    completed: hasValidLoggedSet(e),
  }))
  const payload = {
    user_id: userId,
    workout_date: log.workoutDate,
    day_of_week: log.dayOfWeek,
    workout_name: log.workoutName,
    rest_day: log.restDay,
    exercises,
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase
    .from(TABLE)
    .upsert(payload as never, { onConflict: 'user_id,workout_date' })
  if (error) throw error
}

export async function listExerciseHistory(params: { exerciseId: string; limit?: number }) {
  const supabase = getSupabase()
  const userId = await getAuthedUserId()
  const limit = params.limit ?? 20
  const { data, error } = await supabase
    .from(TABLE)
    .select('workout_date, workout_name, exercises')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false })
    .limit(150)
  if (error) throw error

  type HistoryRow = { workout_date: string; workout_name: string; exercises: unknown }
  const out: Array<{ workoutDate: string; workoutName: string; entry: LoggedExercise | null }> = []
  for (const row of (data ?? []) as HistoryRow[]) {
    const exercises = row.exercises as unknown
    if (!Array.isArray(exercises)) continue
    const match = exercises.find((e) => (e as { exerciseId?: string })?.exerciseId === params.exerciseId)
    if (match) {
      out.push({
        workoutDate: row.workout_date,
        workoutName: row.workout_name,
        entry: normalizeLoggedExercise(match as LoggedExercise),
      })
      if (out.length >= limit) break
    }
  }
  return out
}

export function buildDefaultLogForDate(params: { workoutDate: string; weeklyRoutine: WeeklyRoutine }) {
  const parsed = new Date(`${params.workoutDate}T12:00:00`)
  const jsDay = parsed.getDay()
  const dayOfWeek = DAYS[jsDay === 0 ? 6 : jsDay - 1]
  const day = params.weeklyRoutine[dayOfWeek]
  return {
    workoutDate: params.workoutDate,
    dayOfWeek,
    workoutName: day.workoutName,
    restDay: day.restDay,
    exercises: day.exercises.map(fromPlannedExercise),
  }
}

/** Most recent log per exercise strictly before `workoutDate` (for "Last time" on the day screen). */
export async function loadLastPerformancesBeforeDate(params: {
  workoutDate: string
  exerciseIds: string[]
}): Promise<Record<string, LoggedExercise | null>> {
  const empty: Record<string, LoggedExercise | null> = {}
  for (const id of params.exerciseIds) empty[id] = null
  if (params.exerciseIds.length === 0) return empty

  const supabase = getSupabase()
  const userId = await getAuthedUserId()
  const { data, error } = await supabase
    .from(TABLE)
    .select('workout_date, exercises')
    .eq('user_id', userId)
    .lt('workout_date', params.workoutDate)
    .order('workout_date', { ascending: false })
    .limit(120)

  if (error) throw error

  for (const row of (data ?? []) as { workout_date: string; exercises: unknown }[]) {
    const exercises = row.exercises
    if (!Array.isArray(exercises)) continue
    for (const raw of exercises) {
      const ex = normalizeLoggedExercise(raw as LoggedExercise)
      if (ex.exerciseId && params.exerciseIds.includes(ex.exerciseId) && empty[ex.exerciseId] === null) {
        empty[ex.exerciseId] = ex
      }
    }
  }

  return empty
}

export type ExercisePerformanceSummary = {
  /** Most recent workout date that includes this exercise */
  lastWorkoutDate: string | null
  /** Complete sets only from that session */
  lastPerformance: string
  /** Best single set seen in scanned logs, e.g. "85kg × 5" */
  bestSet: string
  /** Last logged session had no valid sets (completed false on disk). */
  lastSessionSkipped: boolean
}

function mergeBest(
  current: { weight: number; reps: number } | null,
  sets: PerformedSet[]
): { weight: number; reps: number } | null {
  const cand = bestSetFromPerformedSets(sets)
  if (!cand) return current
  if (!current || cand.weight > current.weight || (cand.weight === current.weight && cand.reps > current.reps)) {
    return cand
  }
  return current
}

/** Scan recent logs for last session + best set per exercise (performedSets only). */
export async function loadExercisePerformanceSummaries(
  exerciseIds: string[]
): Promise<Record<string, ExercisePerformanceSummary>> {
  const empty: Record<string, ExercisePerformanceSummary> = {}
  const idSet = new Set(exerciseIds)
  for (const id of exerciseIds) {
    empty[id] = { lastWorkoutDate: null, lastPerformance: '', bestSet: '', lastSessionSkipped: false }
  }
  if (exerciseIds.length === 0) return empty

  const supabase = getSupabase()
  const userId = await getAuthedUserId()
  const { data, error } = await supabase
    .from(TABLE)
    .select('workout_date, exercises')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false })
    .limit(250)

  if (error) throw error

  const bestById: Record<string, { weight: number; reps: number } | null> = {}
  for (const id of exerciseIds) bestById[id] = null

  for (const row of (data ?? []) as { workout_date: string; exercises: unknown }[]) {
    const exercises = row.exercises
    if (!Array.isArray(exercises)) continue
    for (const raw of exercises) {
      const ex = normalizeLoggedExercise(raw as LoggedExercise)
      if (!ex.exerciseId || !idSet.has(ex.exerciseId)) continue
      bestById[ex.exerciseId] = mergeBest(bestById[ex.exerciseId], ex.performedSets)
    }
  }

  for (const row of (data ?? []) as { workout_date: string; exercises: unknown }[]) {
    const exercises = row.exercises
    if (!Array.isArray(exercises)) continue
    for (const raw of exercises) {
      const ex = normalizeLoggedExercise(raw as LoggedExercise)
      if (!ex.exerciseId || !idSet.has(ex.exerciseId)) continue
      const slot = empty[ex.exerciseId]
      if (slot.lastWorkoutDate !== null) continue
      slot.lastWorkoutDate = row.workout_date
      slot.lastPerformance = formatCompleteSetsLine(ex.performedSets)
      slot.lastSessionSkipped = persistedExerciseSkipped(ex)
    }
  }

  for (const id of exerciseIds) {
    const b = bestById[id]
    empty[id].bestSet = b ? `${b.weight}kg × ${b.reps}` : ''
  }

  return empty
}
