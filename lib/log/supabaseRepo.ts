import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { LoggedExercise, WorkoutLog } from './types'
import { getTodayDayOfWeek, toISODateString } from '@/lib/routine/date'
import type { WeeklyRoutine } from '@/lib/routine/types'
import { fromPlannedExercise } from './types'

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

export async function getAuthedUserId() {
  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) throw error
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function loadWorkoutLogByDate(workoutDate: string): Promise<WorkoutLog | null> {
  const supabase = createSupabaseBrowserClient()
  const userId = await getAuthedUserId()

  const { data, error } = await supabase
    .from(TABLE)
    .select('user_id, workout_date, day_of_week, workout_name, rest_day, exercises, updated_at')
    .eq('user_id', userId)
    .eq('workout_date', workoutDate)
    .maybeSingle<WorkoutLogRow>()

  if (error) throw error
  if (!data) return null

  return {
    userId: data.user_id,
    workoutDate: data.workout_date,
    dayOfWeek: data.day_of_week as WorkoutLog['dayOfWeek'],
    workoutName: data.workout_name,
    restDay: data.rest_day,
    exercises: (data.exercises as WorkoutLog['exercises']) ?? [],
    updatedAt: data.updated_at,
  }
}

export async function listWorkoutLogsInRange(params: { startDate: string; endDate: string }) {
  const supabase = createSupabaseBrowserClient()
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
    exercises: (r.exercises as WorkoutLog['exercises']) ?? [],
    updatedAt: r.updated_at,
  })) satisfies WorkoutLog[]
}

export async function saveWorkoutLog(log: Omit<WorkoutLog, 'userId' | 'updatedAt'>): Promise<void> {
  const supabase = createSupabaseBrowserClient()
  const userId = await getAuthedUserId()

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      workout_date: log.workoutDate,
      day_of_week: log.dayOfWeek,
      workout_name: log.workoutName,
      rest_day: log.restDay,
      exercises: log.exercises,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,workout_date' }
  )

  if (error) throw error
}

export async function listExerciseHistory(params: { exerciseId: string; limit?: number }) {
  const supabase = createSupabaseBrowserClient()
  const userId = await getAuthedUserId()
  const limit = params.limit ?? 20
  // Don't use .contains() on JSON arrays — PostgREST matching is brittle for partial objects.
  // Fetch recent logs and filter in code (reliable for typical user volumes).
  const scanLimit = 150

  const { data, error } = await supabase
    .from(TABLE)
    .select('workout_date, workout_name, exercises')
    .eq('user_id', userId)
    .order('workout_date', { ascending: false })
    .limit(scanLimit)

  if (error) throw error

  type HistoryRow = { workout_date: string; workout_name: string; exercises: unknown }

  const out: Array<{ workoutDate: string; workoutName: string; entry: LoggedExercise | null }> = []
  for (const row of (data ?? []) as HistoryRow[]) {
    const exercises = row.exercises as unknown
    if (!Array.isArray(exercises)) continue
    const match = exercises.find(
      (e) => (e as { exerciseId?: string } | null)?.exerciseId === params.exerciseId
    ) as LoggedExercise | undefined
    if (match) {
      out.push({ workoutDate: row.workout_date, workoutName: row.workout_name, entry: match })
      if (out.length >= limit) break
    }
  }

  return out
}

export function buildDefaultLogForDate(params: {
  workoutDate?: string
  weeklyRoutine: WeeklyRoutine
}) {
  const workoutDate = params.workoutDate ?? toISODateString()
  const dayOfWeek = getTodayDayOfWeek(new Date(`${workoutDate}T12:00:00`))
  const day = params.weeklyRoutine[dayOfWeek]

  return {
    workoutDate,
    dayOfWeek,
    workoutName: day.workoutName,
    restDay: day.restDay,
    exercises: day.exercises.map(fromPlannedExercise),
  }
}

