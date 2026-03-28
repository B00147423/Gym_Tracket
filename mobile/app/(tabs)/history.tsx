import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DAYS } from '@/lib/routineTypes'
import type { WeeklyRoutine } from '@/lib/routineTypes'
import { createEmptyWeeklyRoutine, loadRoutine } from '@/lib/routineRepo'
import { loadExercisePerformanceSummaries, type ExercisePerformanceSummary } from '@/lib/logRepo'
import { exerciseDisplayName } from '@/lib/performedSets'

/** e.g. "28 Mar 2026" */
function formatLogDate(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00`)
    const day = d.getDate()
    const month = d.toLocaleDateString(undefined, { month: 'short' })
    const year = d.getFullYear()
    return `${day} ${month} ${year}`
  } catch {
    return iso
  }
}

const C = {
  cardBg: '#0b1220',
  border: '#2a2a2a',
  white: '#ffffff',
  muted: '#9ca3af',
  dim: '#6b7280',
  error: '#fb7185',
} as const

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0b0b',
    paddingHorizontal: 16,
  },
  header: {
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.white,
  },
  headerSub: {
    color: C.muted,
    marginTop: 6,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 4,
  },
  /** One card = one tappable row, full width */
  card: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  name: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  date: {
    color: C.muted,
    fontSize: 12,
    marginTop: 8,
  },
  lineLast: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  lineBest: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  labelPrefix: {
    color: C.muted,
    fontWeight: '600',
  },
  valueLast: {
    color: C.white,
    fontWeight: '600',
  },
  valueBest: {
    color: C.muted,
  },
  subtle: {
    color: C.dim,
    fontSize: 12,
    marginTop: 10,
  },
  err: {
    color: C.error,
    fontSize: 12,
    marginTop: 10,
  },
  emptyCard: {
    alignSelf: 'stretch',
    backgroundColor: C.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
})

function HistoryCard(props: {
  exerciseId: string
  displayName: string
  perfStatus: 'idle' | 'loading' | 'ready' | 'error'
  summ: ExercisePerformanceSummary | undefined
}) {
  const router = useRouter()
  const { exerciseId, displayName, perfStatus, summ } = props

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${displayName}, open exercise history`}
      onPress={() =>
        router.push({ pathname: '/log/exercise/[exerciseId]', params: { exerciseId } })
      }
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      android_ripple={{ color: 'rgba(255,255,255,0.12)', borderless: false }}
    >
      <Text style={styles.name} numberOfLines={2}>
        {displayName}
      </Text>

      {perfStatus === 'loading' || perfStatus === 'idle' ? (
        <Text style={styles.subtle}>Loading…</Text>
      ) : perfStatus === 'error' || summ == null ? (
        <Text style={styles.err}>Couldn’t load performance</Text>
      ) : !summ.lastWorkoutDate ? (
        <Text style={styles.subtle}>No data yet</Text>
      ) : (
        <>
          <Text style={styles.date}>{formatLogDate(summ.lastWorkoutDate)}</Text>
          <Text style={styles.lineLast}>
            <Text style={styles.labelPrefix}>Last: </Text>
            <Text style={summ.lastSessionSkipped ? { color: '#a8a29e', fontWeight: '600' } : styles.valueLast}>
              {summ.lastSessionSkipped ? 'Skipped' : summ.lastPerformance || '—'}
            </Text>
          </Text>
          {summ.bestSet ? (
            <Text style={styles.lineBest}>
              <Text style={styles.labelPrefix}>Best: </Text>
              <Text style={styles.valueBest}>{summ.bestSet}</Text>
            </Text>
          ) : null}
        </>
      )}
    </Pressable>
  )
}

export default function HistoryTabScreen() {
  const insets = useSafeAreaInsets()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [weeklyRoutine, setWeeklyRoutine] = useState<WeeklyRoutine>(createEmptyWeeklyRoutine)
  const [summaries, setSummaries] = useState<Record<string, ExercisePerformanceSummary> | null>(null)
  const [perfStatus, setPerfStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setError(null)
        const data = await loadRoutine()
        if (cancelled) return
        setWeeklyRoutine(data.weeklyRoutine)
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

  const exercises = useMemo(() => {
    const items: Array<{ id: string; name: string; day: (typeof DAYS)[number] }> = []
    for (const d of DAYS) {
      const day = weeklyRoutine[d]
      if (day.restDay) continue
      for (const ex of day.exercises) {
        items.push({
          id: ex.id,
          name: ex.name,
          day: d,
        })
      }
    }
    return items
  }, [weeklyRoutine])

  useEffect(() => {
    if (status !== 'ready') return
    const ids = exercises.map((e) => e.id)
    if (ids.length === 0) {
      setSummaries({})
      setPerfStatus('ready')
      return
    }
    let cancelled = false
    setPerfStatus('loading')
    loadExercisePerformanceSummaries(ids)
      .then((data) => {
        if (!cancelled) {
          setSummaries(data)
          setPerfStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSummaries(null)
          setPerfStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [status, exercises])

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top + 4, 12) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>Recent performance at a glance</Text>
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      {status === 'loading' ? (
        <View style={{ paddingTop: 28 }}>
          <ActivityIndicator color={C.muted} />
        </View>
      ) : status === 'error' ? (
        <Text style={styles.err}>Failed to load. Make sure you’re logged in.</Text>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ color: C.muted, fontSize: 13 }}>No exercises in your planner yet.</Text>
            </View>
          ) : (
            exercises.map((ex) => (
              <HistoryCard
                key={`${ex.day}-${ex.id}`}
                exerciseId={ex.id}
                displayName={exerciseDisplayName(ex.name)}
                perfStatus={perfStatus}
                summ={summaries?.[ex.id]}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  )
}
