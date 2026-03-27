import { createDefaultRoutineSettings, createEmptyWeeklyRoutine } from './defaults'
import type { RoutineSettings, WeeklyRoutine } from './types'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type RoutineRow = {
  user_id: string
  weekly_routine: WeeklyRoutine
  settings: RoutineSettings
  updated_at: string
}

const TABLE = 'routines'

export async function loadRoutineFromSupabase(): Promise<{
  weeklyRoutine: WeeklyRoutine
  settings: RoutineSettings
  updatedAt: string | null
}> {
  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from(TABLE)
    .select('user_id, weekly_routine, settings, updated_at')
    .eq('user_id', user.id)
    .maybeSingle<RoutineRow>()

  if (error) throw error

  if (!data) {
    return {
      weeklyRoutine: createEmptyWeeklyRoutine(),
      settings: createDefaultRoutineSettings(),
      updatedAt: null,
    }
  }

  return {
    weeklyRoutine: data.weekly_routine ?? createEmptyWeeklyRoutine(),
    settings: { ...createDefaultRoutineSettings(), ...(data.settings ?? {}) },
    updatedAt: data.updated_at ?? null,
  }
}

export async function saveRoutineToSupabase(params: {
  weeklyRoutine: WeeklyRoutine
  settings: RoutineSettings
}): Promise<void> {
  const supabase = createSupabaseBrowserClient()
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

