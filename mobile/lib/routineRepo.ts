import { supabase } from './supabase'
import type { RoutineSettings, WeeklyRoutine } from './routineTypes'

const TABLE = 'routines'

export function createEmptyWeeklyRoutine(): WeeklyRoutine {
  return {
    Monday: { workoutName: '', exercises: [], restDay: false },
    Tuesday: { workoutName: '', exercises: [], restDay: false },
    Wednesday: { workoutName: '', exercises: [], restDay: false },
    Thursday: { workoutName: '', exercises: [], restDay: false },
    Friday: { workoutName: '', exercises: [], restDay: false },
    Saturday: { workoutName: '', exercises: [], restDay: false },
    Sunday: { workoutName: '', exercises: [], restDay: false },
  }
}

export function createDefaultRoutineSettings(): RoutineSettings {
  return { remindersEnabled: false, lastNotifiedISODate: null }
}

export async function loadRoutine() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from(TABLE)
    .select('weekly_routine, settings, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  return {
    weeklyRoutine: (data?.weekly_routine as WeeklyRoutine) ?? createEmptyWeeklyRoutine(),
    settings: { ...createDefaultRoutineSettings(), ...((data?.settings as RoutineSettings) ?? {}) },
    updatedAt: (data?.updated_at as string | null) ?? null,
  }
}

export async function saveRoutine(params: { weeklyRoutine: WeeklyRoutine; settings: RoutineSettings }) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: user.id,
      weekly_routine: params.weeklyRoutine,
      settings: params.settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) throw error
}

