'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DayOfWeek, DayRoutine, RoutineSettings, WeeklyRoutine } from './types'
import { createDefaultRoutineSettings, createEmptyWeeklyRoutine } from './defaults'
import { loadRoutineFromSupabase, saveRoutineToSupabase } from './supabaseRepo'

export function useWeeklyRoutine() {
  const [routineId, setRoutineId] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const [weeklyRoutine, setWeeklyRoutine] = useState<WeeklyRoutine>(() => createEmptyWeeklyRoutine())
  const [settings, setSettings] = useState<RoutineSettings>(() => createDefaultRoutineSettings())
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)

  const ensureIdentityAndLoad = useCallback(async () => {
    try {
      setStatus('loading')
      setError(null)
      const res = await fetch('/api/routine/identity', { method: 'GET' })
      if (!res.ok) throw new Error(`Failed to get identity (${res.status})`)
      const json = (await res.json()) as { routineId: string }
      setRoutineId(json.routineId)

      const loaded = await loadRoutineFromSupabase(json.routineId)
      setWeeklyRoutine(loaded.weeklyRoutine)
      setSettings(loaded.settings)
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to load routine')
    }
  }, [])

  useEffect(() => {
    void ensureIdentityAndLoad()
  }, [ensureIdentityAndLoad])

  const saveAll = useCallback(async () => {
    if (!routineId) return
    await saveRoutineToSupabase({ routineId, weeklyRoutine, settings })
    setLastSavedAt(Date.now())
  }, [routineId, weeklyRoutine, settings])

  const persistSettings = useCallback((next: RoutineSettings) => setSettings(next), [])

  const updateDay = useCallback((day: DayOfWeek, nextDay: DayRoutine) => {
    setWeeklyRoutine((prev) => ({ ...prev, [day]: nextDay }))
  }, [])

  const getDay = useCallback((day: DayOfWeek) => weeklyRoutine[day], [weeklyRoutine])

  const api = useMemo(
    () => ({
      routineId,
      status,
      error,
      weeklyRoutine,
      settings,
      lastSavedAt,
      updateDay,
      getDay,
      setWeeklyRoutine,
      setSettings: persistSettings,
      saveAll,
      reload: ensureIdentityAndLoad,
    }),
    [
      routineId,
      status,
      error,
      weeklyRoutine,
      settings,
      lastSavedAt,
      updateDay,
      getDay,
      persistSettings,
      saveAll,
      ensureIdentityAndLoad,
    ]
  )

  return api
}

