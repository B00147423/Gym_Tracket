import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { Link } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DAYS } from '@/lib/routineTypes'
import type { WeeklyRoutine } from '@/lib/routineTypes'
import { createEmptyWeeklyRoutine, loadRoutine } from '@/lib/routineRepo'
import { listWorkoutLogsInRange } from '@/lib/logRepo'

type WeekItem = {
  dayOfWeek: (typeof DAYS)[number]
  label: string
  date: string
  isToday: boolean
}

function toISODateString(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
}

function getWeekItems(today = new Date()): WeekItem[] {
  const jsDay = today.getDay()
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay
  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(today.getDate() + mondayOffset)
  const todayISO = toISODateString(today)

  return DAYS.map((dayOfWeek, index) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + index)
    const date = toISODateString(d)
    return {
      dayOfWeek,
      label: dayOfWeek.slice(0, 3),
      date,
      isToday: date === todayISO,
    }
  })
}

export default function LogTabScreen() {
  const insets = useSafeAreaInsets()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [weeklyRoutine, setWeeklyRoutine] = useState<WeeklyRoutine>(createEmptyWeeklyRoutine)
  const [logsByDate, setLogsByDate] = useState<Record<string, { hasLog: boolean }>>({})
  const week = useMemo(() => getWeekItems(), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setError(null)
        const data = await loadRoutine()
        if (cancelled) return
        setWeeklyRoutine(data.weeklyRoutine)
        const logs = await listWorkoutLogsInRange({
          startDate: week[0].date,
          endDate: week[week.length - 1].date,
        })
        if (cancelled) return
        const map: Record<string, { hasLog: boolean }> = {}
        logs.forEach((l) => {
          map[l.workoutDate] = { hasLog: true }
        })
        setLogsByDate(map)
        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Failed to load routine')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [week])

  const plannedSummary = useMemo(() => {
    const count = DAYS.reduce((acc, d) => acc + (weeklyRoutine[d].restDay ? 0 : 1), 0)
    return `${count} workout day${count === 1 ? '' : 's'} this week`
  }, [weeklyRoutine])
  const todayDate = useMemo(() => toISODateString(new Date()), [])

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: Math.max(insets.top + 4, 12),
        gap: 12,
      }}
    >
      <View>
        <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700' }}>WORKOUT LOG</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: 'white' }}>Log</Text>
        <Text style={{ color: '#9ca3af', marginTop: 4 }}>Day-by-day training</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Link href="/(tabs)/history" asChild>
          <Pressable
            style={{
              borderRadius: 10,
              backgroundColor: '#1f2937',
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>Exercise history</Text>
          </Pressable>
        </Link>
        <Link href={{ pathname: '/log/[date]', params: { date: todayDate } }} asChild>
          <Pressable
            style={{
              borderRadius: 10,
              backgroundColor: '#ffffff',
              paddingVertical: 8,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '800', fontSize: 12 }}>Log today</Text>
          </Pressable>
        </Link>
      </View>

      {error ? <Text style={{ color: '#fb7185' }}>{error}</Text> : null}

      {status === 'loading' ? (
        <View style={{ paddingTop: 24 }}>
          <ActivityIndicator />
        </View>
      ) : status === 'error' ? (
        <Text style={{ color: '#fb7185' }}>Failed to load. Make sure you’re logged in.</Text>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 24 }}>
          {week.map((d) => {
            const planned = weeklyRoutine[d.dayOfWeek]
            const title = planned.restDay ? 'Rest day' : planned.workoutName || 'Workout'
            const subtitle = planned.restDay
              ? 'Recovery'
              : `${planned.exercises.length} exercise${planned.exercises.length === 1 ? '' : 's'}`
            const hasLog = !!logsByDate[d.date]?.hasLog
            return (
              <View
                key={d.date}
                style={{
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: d.isToday ? '#52525b' : '#2a2a2a',
                  backgroundColor: '#0b1220',
                  paddingVertical: 10,
                  paddingHorizontal: 11,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ minWidth: 0, flex: 1 }}>
                    <Text style={{ color: '#9ca3af', fontWeight: '700', fontSize: 10 }}>
                      {d.label} · {d.date}
                    </Text>
                    <Text style={{ color: 'white', fontWeight: '900', fontSize: 15, marginTop: 2 }} numberOfLines={1}>
                      {title}
                    </Text>
                    <Text style={{ color: '#9ca3af', marginTop: 2, fontSize: 12 }}>{subtitle + (hasLog ? ' • Logged' : '')}</Text>
                  </View>
                  <Link href={{ pathname: '/log/[date]', params: { date: d.date } }} asChild>
                    <Pressable
                      style={{
                        backgroundColor: d.isToday ? '#ffffff' : '#1f2937',
                        borderRadius: 9,
                        paddingVertical: 7,
                        paddingHorizontal: 10,
                      }}
                    >
                      <Text style={{ color: d.isToday ? '#000' : '#fff', fontWeight: '800', fontSize: 11 }}>
                        {hasLog ? 'View log' : 'View workout'}
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}
