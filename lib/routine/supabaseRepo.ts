import { supabase } from '@/lib/supabase'
import { createDefaultRoutineSettings, createEmptyWeeklyRoutine } from './defaults'
import type { RoutineSettings, WeeklyRoutine } from './types'

type RoutineRow = {
  routine_id: string
  weekly_routine: WeeklyRoutine
  settings: RoutineSettings
  updated_at: string
}

const TABLE = 'routines'

export async function loadRoutineFromSupabase(routineId: string): Promise<{
  weeklyRoutine: WeeklyRoutine
  settings: RoutineSettings
}> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('routine_id, weekly_routine, settings, updated_at')
    .eq('routine_id', routineId)
    .maybeSingle<RoutineRow>()

  if (error) throw error

  if (!data) {
    return {
      weeklyRoutine: createEmptyWeeklyRoutine(),
      settings: createDefaultRoutineSettings(),
    }
  }

  return {
    weeklyRoutine: data.weekly_routine ?? createEmptyWeeklyRoutine(),
    settings: { ...createDefaultRoutineSettings(), ...(data.settings ?? {}) },
  }
}

export async function saveRoutineToSupabase(params: {
  routineId: string
  weeklyRoutine: WeeklyRoutine
  settings: RoutineSettings
}): Promise<void> {
  const { error } = await supabase.from(TABLE).upsert(
    {
      routine_id: params.routineId,
      weekly_routine: params.weeklyRoutine,
      settings: params.settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'routine_id' }
  )

  if (error) throw error
}

