import { useEffect, useState } from 'react'
import { Link, useLocalSearchParams } from 'expo-router'
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { listExerciseHistory } from '@/lib/logRepo'
import { summarizeExerciseLogDetailed, persistedExerciseSkipped } from '@/lib/performedSets'

export default function ExerciseHistoryScreen() {
  const params = useLocalSearchParams<{ exerciseId?: string }>()
  const exerciseId = params.exerciseId ?? ''
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<
    Array<{
      workoutDate: string
      workoutName: string
      setsLine: string
      notesLine: string
      skipped: boolean
    }>
  >([])

  useEffect(() => {
    if (!exerciseId) {
      setStatus('error')
      setError('Missing exercise id')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        const rows = await listExerciseHistory({ exerciseId, limit: 30 })
        if (cancelled) return
        setItems(
          rows.map((r) => {
            const det = r.entry ? summarizeExerciseLogDetailed(r.entry) : { setsLine: '', notesLine: '' }
            const skipped = r.entry ? persistedExerciseSkipped(r.entry) : false
            return {
              workoutDate: r.workoutDate,
              workoutName: r.workoutName,
              setsLine: det.setsLine,
              notesLine: det.notesLine,
              skipped,
            }
          })
        )
        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Failed to load exercise history')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [exerciseId])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0b0b0b' }} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12 }}>HISTORY</Text>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: '800' }}>Exercise history</Text>

      {status === 'loading' ? <ActivityIndicator /> : null}
      {status === 'error' ? <Text style={{ color: '#fb7185' }}>{error}</Text> : null}

      {status === 'ready' &&
        (items.length === 0 ? (
          <Text style={{ color: '#9ca3af' }}>No history yet for this exercise.</Text>
        ) : (
          items.map((it) => (
            <View
              key={`${it.workoutDate}-${it.workoutName}`}
              style={{ borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, backgroundColor: '#0b1220', padding: 10, gap: 4 }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>
                {it.workoutDate} · {it.workoutName || 'Workout'}
              </Text>
              {it.skipped ? (
                <Text style={{ color: '#a8a29e', fontSize: 13, fontWeight: '600' }}>Skipped</Text>
              ) : it.setsLine ? (
                <Text style={{ color: '#e5e7eb', fontSize: 13 }}>{it.setsLine}</Text>
              ) : null}
              {it.notesLine ? <Text style={{ color: '#9ca3af', fontSize: 12 }}>{it.notesLine}</Text> : null}
              {!it.skipped && !it.setsLine && !it.notesLine ? (
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>No logged sets or notes.</Text>
              ) : null}
            </View>
          ))
        ))}

      <Link href="/(tabs)/history" asChild>
        <Pressable style={{ paddingVertical: 8 }}>
          <Text style={{ color: '#9ca3af' }}>Back to history</Text>
        </Pressable>
      </Link>
    </ScrollView>
  )
}
