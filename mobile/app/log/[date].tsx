import { useEffect, useRef, useState } from 'react'
import { Link, useLocalSearchParams } from 'expo-router'
import { View, Text, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import {
  buildDefaultLogForDate,
  loadLastPerformancesBeforeDate,
  loadWorkoutLogByDate,
  saveWorkoutLog,
  listExerciseHistory,
} from '@/lib/logRepo'
import { loadRoutine } from '@/lib/routineRepo'
import type { LoggedExercise } from '@/lib/logTypes'
import { DAYS } from '@/lib/routineTypes'
import {
  summarizeExerciseLog,
  summarizeExerciseLogDetailed,
  weightProgressVsLast,
  hasValidLoggedSet,
  exerciseLogUiState,
  persistedExerciseSkipped,
} from '@/lib/performedSets'
import { PerformedSetsEditor } from '@/components/log/PerformedSetsEditor'

function isISODate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export default function DayLogScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{ date?: string }>()
  const workoutDate = params.date ?? ''
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [saveUi, setSaveUi] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [historyFor, setHistoryFor] = useState<string | null>(null)
  const [historyItems, setHistoryItems] = useState<
    Array<{ workoutDate: string; workoutName: string; setsLine: string; notesLine: string }>
  >([])
  const [lastByExerciseId, setLastByExerciseId] = useState<Record<string, LoggedExercise | null>>({})
  /** True after load from server or successful save — then `completed` on each exercise is authoritative. */
  const [workoutPersisted, setWorkoutPersisted] = useState(false)
  /** After a successful save, briefly delay revealing Skipped so "Saved" reads first. */
  const revealStatusesAfterSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveUiIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [log, setLog] = useState<{
    workoutDate: string
    dayOfWeek: (typeof DAYS)[number]
    workoutName: string
    restDay: boolean
    exercises: LoggedExercise[]
  } | null>(null)

  useEffect(() => {
    if (!isISODate(workoutDate)) {
      setStatus('error')
      setError('Invalid date format')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setError(null)
        const existing = await loadWorkoutLogByDate(workoutDate)
        if (cancelled) return
        if (existing) {
          setWorkoutPersisted(true)
          setLog({
            workoutDate: existing.workoutDate,
            dayOfWeek: existing.dayOfWeek,
            workoutName: existing.workoutName,
            restDay: existing.restDay,
            exercises: existing.exercises,
          })
          setStatus('ready')
          return
        }
        setWorkoutPersisted(false)
        const routine = await loadRoutine()
        if (cancelled) return
        setLog(buildDefaultLogForDate({ workoutDate, weeklyRoutine: routine.weeklyRoutine }))
        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Failed to load workout day')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workoutDate])

  useEffect(() => {
    return () => {
      if (revealStatusesAfterSaveRef.current) clearTimeout(revealStatusesAfterSaveRef.current)
      if (saveUiIdleTimerRef.current) clearTimeout(saveUiIdleTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!log || log.restDay || log.exercises.length === 0) return
    let cancelled = false
    const ids = log.exercises.map((e) => e.exerciseId)
    loadLastPerformancesBeforeDate({ workoutDate, exerciseIds: ids })
      .then((m) => {
        if (!cancelled) setLastByExerciseId(m)
      })
      .catch(() => {
        if (!cancelled) setLastByExerciseId({})
      })
    return () => {
      cancelled = true
    }
  }, [log?.workoutDate, log?.restDay, log?.exercises.length])

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', padding: 16 }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (status === 'error' || !log) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b0b0b', padding: 16, gap: 12 }}>
        <Text style={{ color: '#fb7185' }}>{error ?? 'Failed to load'}</Text>
        <Link href="/(tabs)/two" asChild>
          <Pressable style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#9ca3af' }}>Back to week log</Text>
          </Pressable>
        </Link>
      </View>
    )
  }

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: '#0b0b0b' }}
      bottomOffset={Platform.OS === 'ios' ? 72 : 32}
      extraKeyboardSpace={24}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16) + 120,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View>
          <Text style={{ color: '#9ca3af', fontSize: 12 }}>{log.workoutDate}</Text>
          <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>Workout log</Text>
          <Text style={{ color: '#9ca3af', marginTop: 3 }}>{log.dayOfWeek}</Text>
        </View>
        <Pressable
          onPress={async () => {
            try {
              if (revealStatusesAfterSaveRef.current) clearTimeout(revealStatusesAfterSaveRef.current)
              if (saveUiIdleTimerRef.current) clearTimeout(saveUiIdleTimerRef.current)
              setSaveUi('saving')
              await saveWorkoutLog(log)
              setLog((prev) => {
                if (!prev) return prev
                return {
                  ...prev,
                  exercises: prev.exercises.map((e) => ({
                    ...e,
                    completed: hasValidLoggedSet(e),
                  })),
                }
              })
              setSaveUi('saved')
              if (!workoutPersisted) {
                revealStatusesAfterSaveRef.current = setTimeout(() => {
                  setWorkoutPersisted(true)
                  revealStatusesAfterSaveRef.current = null
                }, 700)
              }
              saveUiIdleTimerRef.current = setTimeout(() => {
                setSaveUi('idle')
                saveUiIdleTimerRef.current = null
              }, 2600)
            } catch {
              setSaveUi('error')
            }
          }}
          style={{ borderRadius: 10, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0 }}
        >
          <Text style={{ color: '#000', fontWeight: '800' }}>{saveUi === 'saving' ? 'Saving…' : 'Save workout'}</Text>
        </Pressable>
      </View>

      {saveUi === 'saved' ? (
        <View
          style={{
            marginBottom: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 1,
            borderColor: 'rgba(52, 211, 153, 0.35)',
          }}
        >
          <Text style={{ color: '#34d399', fontSize: 15, fontWeight: '800' }}>Saved</Text>
          <Text style={{ color: '#6ee7b7', fontSize: 12, marginTop: 4, opacity: 0.9, lineHeight: 17 }}>
            Exercise statuses update below in a moment.
          </Text>
        </View>
      ) : null}
      {saveUi === 'error' ? <Text style={{ color: '#fb7185', fontSize: 12, marginBottom: 8 }}>Save failed</Text> : null}

      {!log.restDay && workoutPersisted && log.exercises.length > 0 ? (
        <View style={{ marginBottom: 6 }}>
          {log.exercises.some(hasValidLoggedSet) ? (
            <Text style={{ color: '#34d399', fontSize: 14, fontWeight: '800' }}>Completed</Text>
          ) : (
            <Text style={{ color: '#78716c', fontSize: 13, fontWeight: '600' }}>Skipped</Text>
          )}
        </View>
      ) : null}

      {!log.restDay &&
      workoutPersisted &&
      log.exercises.length > 0 &&
      log.exercises.some(persistedExerciseSkipped) ? (
        <Text style={{ color: '#6b7280', fontSize: 11, lineHeight: 16, marginBottom: 12 }}>
          Unfilled exercises are marked as skipped.
        </Text>
      ) : null}

      {!log.restDay &&
        log.exercises.map((ex, idx) => {
          const last = lastByExerciseId[ex.exerciseId]
          const lastLine = last ? summarizeExerciseLog(last) : ''
          const progressHint = weightProgressVsLast(ex, last ?? null)
          const uiState = exerciseLogUiState(ex, workoutPersisted)
          const cardBorder =
            uiState === 'done'
              ? '#22c55e'
              : uiState === 'skipped'
                ? '#3f3f46'
                : '#2a2a2a'
          const cardBg =
            uiState === 'done'
              ? 'rgba(16, 185, 129, 0.08)'
              : uiState === 'skipped'
                ? 'rgba(113, 113, 122, 0.06)'
                : '#0b1220'
          const statusPill =
            uiState === 'done'
              ? { label: 'Done', fg: '#86efac', bg: '#14532d', border: '#22c55e', weight: '800' as const }
              : uiState === 'skipped'
                ? {
                    label: 'Skipped',
                    fg: '#a1a1aa',
                    bg: '#18181b',
                    border: '#3f3f46',
                    weight: '600' as const,
                  }
                : { label: 'Not started', fg: '#9ca3af', bg: '#1f2937', border: '#4b5563', weight: '700' as const }
          return (
            <View
              key={`${ex.exerciseId}-${idx}`}
              style={{
                borderWidth: 1,
                borderColor: cardBorder,
                borderRadius: 14,
                backgroundColor: cardBg,
                padding: 12,
                marginBottom: 16,
                overflow: 'hidden',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ minWidth: 0, flex: 1, paddingRight: 4 }}>
                  <Text style={{ color: 'white', fontWeight: '800' }} numberOfLines={1}>
                    {ex.name || `Exercise ${idx + 1}`}
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>
                    Planned: {ex.plannedSets || '—'} × {ex.plannedReps || '—'}
                  </Text>
                  {lastLine ? (
                    <Text style={{ color: '#c4b5fd', fontSize: 13, marginTop: 6, fontWeight: '600' }} numberOfLines={3}>
                      <Text style={{ color: '#9ca3af', fontWeight: '600' }}>Last: </Text>
                      {lastLine}
                    </Text>
                  ) : (
                    <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 4 }}>No earlier log for this lift.</Text>
                  )}
                  {progressHint ? (
                    <Text style={{ color: '#34d399', fontSize: 12, marginTop: 4, fontWeight: '700' }}>{progressHint}</Text>
                  ) : null}
                </View>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: statusPill.border,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor: statusPill.bg,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ color: statusPill.fg, fontSize: 11, fontWeight: statusPill.weight }}>{statusPill.label}</Text>
                </View>
              </View>

              <View style={{ marginTop: 4 }}>
                <PerformedSetsEditor
                  sets={ex.performedSets}
                  onChange={(sets) =>
                    setLog((prev) => {
                      if (!prev) return prev
                      const next = [...prev.exercises]
                      next[idx] = { ...next[idx], performedSets: sets }
                      return { ...prev, exercises: next }
                    })
                  }
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Link href={{ pathname: '/log/exercise/[exerciseId]', params: { exerciseId: ex.exerciseId } }} asChild>
                  <Pressable>
                    <Text style={{ color: '#9ca3af', fontSize: 12, textDecorationLine: 'underline' }}>View full history</Text>
                  </Pressable>
                </Link>
                <Pressable
                  onPress={async () => {
                    const opening = historyFor !== ex.exerciseId
                    setHistoryFor(opening ? ex.exerciseId : null)
                    if (!opening) return
                    const items = await listExerciseHistory({ exerciseId: ex.exerciseId, limit: 5 })
                    setHistoryItems(
                      items.map((it) => {
                        const det = it.entry ? summarizeExerciseLogDetailed(it.entry) : { setsLine: '', notesLine: '' }
                        return {
                          workoutDate: it.workoutDate,
                          workoutName: it.workoutName,
                          setsLine: det.setsLine,
                          notesLine: det.notesLine,
                        }
                      })
                    )
                  }}
                >
                  <Text style={{ color: '#9ca3af', fontSize: 12 }}>Quick history</Text>
                </Pressable>
              </View>

              {historyFor === ex.exerciseId && (
                <View style={{ borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10, padding: 8, gap: 6 }}>
                  {historyItems.length === 0 ? (
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>No history yet.</Text>
                  ) : (
                    historyItems.map((h) => (
                      <View key={`${ex.exerciseId}-${h.workoutDate}`}>
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                          {h.workoutDate} · {h.workoutName || 'Workout'}
                        </Text>
                        {h.setsLine ? <Text style={{ color: '#e5e7eb', fontSize: 12 }}>{h.setsLine}</Text> : null}
                        {h.notesLine ? <Text style={{ color: '#9ca3af', fontSize: 11 }}>{h.notesLine}</Text> : null}
                        {!h.setsLine && !h.notesLine ? (
                          <Text style={{ color: '#9ca3af', fontSize: 12 }}>No data.</Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              )}

              <View>
                <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>Session notes (optional)</Text>
                <TextInput
                  multiline
                  value={ex.performedText}
                  onChangeText={(t) =>
                    setLog((prev) => {
                      if (!prev) return prev
                      const next = [...prev.exercises]
                      next[idx] = { ...next[idx], performedText: t }
                      return { ...prev, exercises: next }
                    })
                  }
                  placeholder="Anything else about this exercise…"
                  placeholderTextColor="#6b7280"
                  scrollEnabled={false}
                  style={{
                    minHeight: 72,
                    maxHeight: 140,
                    textAlignVertical: 'top',
                    borderWidth: 1,
                    borderColor: '#2a2a2a',
                    borderRadius: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    color: 'white',
                    fontSize: 13,
                  }}
                />
              </View>
            </View>
          )
        })}
    </KeyboardAwareScrollView>
  )
}
