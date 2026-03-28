import { useEffect, useMemo, useState } from 'react'
import { Link } from 'expo-router'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { createEmptyWeeklyRoutine, loadRoutine } from '@/lib/routineRepo'
import type { WeeklyRoutine } from '@/lib/routineTypes'
import { DAYS } from '@/lib/routineTypes'

function getTodayDayOfWeek() {
  const jsDay = new Date().getDay()
  return DAYS[jsDay === 0 ? 6 : jsDay - 1]
}

function toISODateString(date = new Date()) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
}

export default function HomeTabScreen() {
  const insets = useSafeAreaInsets()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [weeklyRoutine, setWeeklyRoutine] = useState<WeeklyRoutine>(createEmptyWeeklyRoutine)
  const [error, setError] = useState<string | null>(null)
  const today = useMemo(() => getTodayDayOfWeek(), [])
  const todayDate = useMemo(() => toISODateString(), [])

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
        setError(e instanceof Error ? e.message : 'Failed to load home')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useFocusEffect(
    useMemo(
      () => () => {
        let cancelled = false
        ;(async () => {
          try {
            setError(null)
            const data = await loadRoutine()
            if (cancelled) return
            setWeeklyRoutine(data.weeklyRoutine)
            setStatus('ready')
          } catch (e) {
            if (cancelled) return
            setStatus('error')
            setError(e instanceof Error ? e.message : 'Failed to refresh home')
          }
        })()
        return () => {
          cancelled = true
        }
      },
      []
    )
  )

  const day = weeklyRoutine[today]

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0b0b', paddingTop: Math.max(insets.top, 10) }}>
      <View style={{ flex: 1, paddingHorizontal: 16, gap: 12 }}>
        <View>
          <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700' }}>GYM TRACKER</Text>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '800', marginTop: 2 }}>Your training week</Text>
          <Text style={{ color: '#9ca3af', marginTop: 4 }}>Plan your weekly routine and log what you actually did.</Text>
        </View>

        {status === 'loading' ? <ActivityIndicator /> : null}
        {status === 'error' ? <Text style={{ color: '#fb7185' }}>{error}</Text> : null}

        {status === 'ready' && (
          <>
            <View
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#2a2a2a',
                backgroundColor: '#0b1220',
                padding: 14,
                gap: 6,
              }}
            >
              <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 12 }}>TODAY · {today}</Text>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 22 }}>
                {day.restDay ? 'Rest day' : day.workoutName || 'Workout'}
              </Text>
              {!day.restDay ? (
                <Text style={{ color: '#9ca3af', fontSize: 13 }}>
                  {day.exercises.length} exercise{day.exercises.length === 1 ? '' : 's'} planned
                </Text>
              ) : (
                <Text style={{ color: '#9ca3af', fontSize: 13 }}>Recovery day. Stay active and stretch.</Text>
              )}
              <Link href={{ pathname: '/log/[date]', params: { date: todayDate } }} asChild>
                <Pressable
                  style={{
                    marginTop: 6,
                    alignSelf: 'flex-start',
                    borderRadius: 10,
                    backgroundColor: '#fff',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: '800', fontSize: 12 }}>Log today</Text>
                </Pressable>
              </Link>
            </View>

            <View
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#2a2a2a',
                backgroundColor: '#0b1220',
                padding: 12,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>This week</Text>
                <Link href="/(tabs)/history" asChild>
                  <Pressable>
                    <Text style={{ color: '#9ca3af', fontSize: 12 }}>History</Text>
                  </Pressable>
                </Link>
              </View>
              {DAYS.map((d) => {
                const entry = weeklyRoutine[d]
                return (
                  <View
                    key={d}
                    style={{
                      borderWidth: 1,
                      borderColor: '#222833',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: d === today ? '#101827' : '#0a1222',
                    }}
                  >
                    <Text style={{ color: '#d1d5db', fontSize: 12, fontWeight: '700' }}>{d.slice(0, 3)}</Text>
                    <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                      {entry.restDay ? 'Rest day' : entry.workoutName || 'Workout'}
                    </Text>
                  </View>
                )
              })}
            </View>
          </>
        )}
      </View>
    </View>
    )
}
