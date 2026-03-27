'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DayOfWeek, DayRoutine, RoutineSettings, WeeklyRoutine } from './types'
import { createDefaultRoutineSettings, createEmptyWeeklyRoutine } from './defaults'
import { loadRoutineFromSupabase, saveRoutineToSupabase } from './supabaseRepo'

function stableStringify(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

function routineSnapshot(weeklyRoutine: WeeklyRoutine, settings: RoutineSettings) {
  // Stable across object key insertion order (prevents false "dirty" state).
  return stableStringify({ weeklyRoutine, settings })
}

export function useWeeklyRoutine() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const [weeklyRoutine, setWeeklyRoutine] = useState<WeeklyRoutine>(() => createEmptyWeeklyRoutine())
  const [settings, setSettings] = useState<RoutineSettings>(() => createDefaultRoutineSettings())
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [persistedSnapshot, setPersistedSnapshot] = useState<string | null>(null)

  const [hasStartedLoading, setHasStartedLoading] = useState(false)

  const ensureIdentityAndLoad = useCallback(async () => {
    try {
      setStatus('loading')
      setError(null)
      const loaded = await loadRoutineFromSupabase()
      setWeeklyRoutine(loaded.weeklyRoutine)
      setSettings(loaded.settings)
      setPersistedSnapshot(routineSnapshot(loaded.weeklyRoutine, loaded.settings))
      setLastSavedAt(loaded.updatedAt ? new Date(loaded.updatedAt).getTime() : null)
      setStatus('ready')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Failed to load routine')
    }
  }, [])

  useEffect(() => {
    if (hasStartedLoading) return
    setHasStartedLoading(true)
    void ensureIdentityAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStartedLoading])

  const saveAll = useCallback(async () => {
    await saveRoutineToSupabase({ weeklyRoutine, settings })
    const now = Date.now()
    setLastSavedAt(now)
    setPersistedSnapshot(routineSnapshot(weeklyRoutine, settings))
  }, [weeklyRoutine, settings])

  const persistSettings = useCallback((next: RoutineSettings) => setSettings(next), [])

  const updateDay = useCallback((day: DayOfWeek, nextDay: DayRoutine) => {
    setWeeklyRoutine((prev) => ({ ...prev, [day]: nextDay }))
  }, [])

  const getDay = useCallback((day: DayOfWeek) => weeklyRoutine[day], [weeklyRoutine])

  const isDirty = useMemo(() => {
    if (persistedSnapshot === null) return false
    return routineSnapshot(weeklyRoutine, settings) !== persistedSnapshot
  }, [weeklyRoutine, settings, persistedSnapshot])

  const api = useMemo(
    () => ({
      status,
      error,
      weeklyRoutine,
      settings,
      lastSavedAt,
      isDirty,
      updateDay,
      getDay,
      setWeeklyRoutine,
      setSettings: persistSettings,
      saveAll,
      reload: ensureIdentityAndLoad,
    }),
    [
      status,
      error,
      weeklyRoutine,
      settings,
      lastSavedAt,
      isDirty,
      updateDay,
      getDay,
      persistSettings,
      saveAll,
      ensureIdentityAndLoad,
    ]
  )

  return api
}

