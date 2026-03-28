import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import type { DayOfWeek } from '@/lib/routineTypes'
import { DAYS } from '@/lib/routineTypes'
import type { RoutineSettings, WeeklyRoutine } from '@/lib/routineTypes'
import {
  createDefaultRoutineSettings,
  createEmptyWeeklyRoutine,
  loadRoutine,
  saveRoutine,
} from '@/lib/routineRepo'
import { DayPicker } from '@/components/planner/DayPicker'
import { PlannerEditor } from '@/components/planner/PlannerEditor'
import { ReminderToggle } from '@/components/planner/ReminderToggle'
import { maybeNotifyToday } from '@/lib/routineReminders'

function getTodayDayOfWeek(): DayOfWeek {
  const jsDay = new Date().getDay()
  return DAYS[jsDay === 0 ? 6 : jsDay - 1]
}

function stableStringify(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

function routineSnapshot(weeklyRoutine: WeeklyRoutine, settings: RoutineSettings) {
  return stableStringify({ weeklyRoutine, settings })
}

function formatSavedAt(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export default function PlannerTabScreen() {
  const insets = useSafeAreaInsets()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(() => getTodayDayOfWeek())
  const [weeklyRoutine, setWeeklyRoutine] = useState<WeeklyRoutine>(createEmptyWeeklyRoutine)
  const [settings, setSettings] = useState<RoutineSettings>(createDefaultRoutineSettings)
  const [saving, setSaving] = useState(false)
  const [lastSavedAtMs, setLastSavedAtMs] = useState<number | null>(null)
  const [persistedSnapshot, setPersistedSnapshot] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setError(null)
        const data = await loadRoutine()
        if (cancelled) return
        setWeeklyRoutine(data.weeklyRoutine)
        setSettings(data.settings)
        setPersistedSnapshot(routineSnapshot(data.weeklyRoutine, data.settings))
        setLastSavedAtMs(data.updatedAt ? new Date(data.updatedAt).getTime() : null)
        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Failed to load routine')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const day = weeklyRoutine[selectedDay]
  const today = useMemo(() => getTodayDayOfWeek(), [])

  const totalExercises = useMemo(() => {
    return DAYS.reduce((acc, d) => acc + (weeklyRoutine[d].restDay ? 0 : weeklyRoutine[d].exercises.length), 0)
  }, [weeklyRoutine])

  const isDirty = useMemo(() => {
    if (persistedSnapshot === null) return false
    return routineSnapshot(weeklyRoutine, settings) !== persistedSnapshot
  }, [weeklyRoutine, settings, persistedSnapshot])

  const reloadFromServer = useCallback(async () => {
    const data = await loadRoutine()
    setWeeklyRoutine(data.weeklyRoutine)
    setSettings(data.settings)
    setPersistedSnapshot(routineSnapshot(data.weeklyRoutine, data.settings))
    setLastSavedAtMs(data.updatedAt ? new Date(data.updatedAt).getTime() : null)
    setStatus('ready')
  }, [])

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      if (isDirty) return () => {}
      ;(async () => {
        try {
          setError(null)
          await reloadFromServer()
        } catch (e) {
          if (cancelled) return
          setStatus('error')
          setError(e instanceof Error ? e.message : 'Failed to refresh planner')
        }
      })()
      return () => {
        cancelled = true
      }
    }, [isDirty, reloadFromServer])
  )

  useEffect(() => {
    if (status !== 'ready') return
    maybeNotifyToday({
      today,
      todayRoutine: weeklyRoutine[today],
      settings,
      onSettingsChange: setSettings,
    })
  }, [status, today, weeklyRoutine, settings])

  async function onSave() {
    setSaving(true)
    setError(null)
    try {
      await saveRoutine({ weeklyRoutine, settings })
      const now = Date.now()
      setLastSavedAtMs(now)
      setPersistedSnapshot(routineSnapshot(weeklyRoutine, settings))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: Math.max(insets.top + 4, 12),
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: 'white' }}>Planner</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>
            {totalExercises} planned exercise{totalExercises === 1 ? '' : 's'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => setSelectedDay(getTodayDayOfWeek())}
            style={{
              backgroundColor: '#1f2937',
              paddingVertical: 10,
              paddingHorizontal: 10,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Today</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={saving || status !== 'ready' || !isDirty}
            style={{
              backgroundColor: saving ? '#374151' : '#ffffff',
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 12,
              opacity: status !== 'ready' || !isDirty ? 0.6 : 1,
            }}
          >
            <Text style={{ color: saving ? '#e5e7eb' : '#000', fontWeight: '800' }}>
              {saving ? 'Saving…' : 'Save all'}
            </Text>
          </Pressable>
        </View>
      </View>

      {isDirty ? (
        <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>Unsaved changes</Text>
      ) : lastSavedAtMs ? (
        <Text style={{ color: '#34d399', fontSize: 12 }}>All saved · {formatSavedAt(lastSavedAtMs)}</Text>
      ) : (
        <Text style={{ color: '#9ca3af', fontSize: 12 }}>Up to date</Text>
      )}
      {error ? <Text style={{ color: '#fb7185' }}>{error}</Text> : null}

      {status === 'loading' ? (
        <View style={{ paddingTop: 24 }}>
          <ActivityIndicator />
        </View>
      ) : status === 'error' ? (
        <Text style={{ color: '#fb7185' }}>Failed to load. Try logging in again.</Text>
      ) : (
        <View style={{ flex: 1, gap: 8 }}>
          <DayPicker selectedDay={selectedDay} weeklyRoutine={weeklyRoutine} onSelectDay={setSelectedDay} />
          <ReminderToggle value={settings} onChange={setSettings} />

          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            bottomOffset={24}
            extraKeyboardSpace={16}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 28 }}
          >
            <PlannerEditor
              day={day}
              onChangeDay={(nextDay) => {
                setWeeklyRoutine((prev) => ({ ...prev, [selectedDay]: nextDay }))
              }}
            />
          </KeyboardAwareScrollView>
        </View>
      )}
    </View>
  )
}
