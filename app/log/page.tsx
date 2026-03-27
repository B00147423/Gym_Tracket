'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/app/components/ui/Button'
import { toISODateString } from '@/lib/routine/date'
import { getWeekDaysFor } from '@/lib/log/date'
import { useWeeklyRoutine } from '@/lib/routine/useWeeklyRoutine'
import { listWorkoutLogsInRange } from '@/lib/log/supabaseRepo'

export default function WorkoutLogIndexPage() {
  const today = useMemo(() => toISODateString(), [])
  const routine = useWeeklyRoutine()
  const week = useMemo(() => getWeekDaysFor(), [])
  const [logsByDate, setLogsByDate] = useState<Record<string, { hasLog: boolean }>>({})
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (routine.status !== 'ready') return
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setError(null)
        const startDate = week[0].date
        const endDate = week[week.length - 1].date
        const logs = await listWorkoutLogsInRange({ startDate, endDate })
        if (cancelled) return
        const map: Record<string, { hasLog: boolean }> = {}
        logs.forEach((l) => {
          map[l.workoutDate] = { hasLog: true }
        })
        setLogsByDate(map)
        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Failed to load logs')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [routine.status, week])

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-foreground/60">WORKOUT LOG</div>
          <h1 className="mt-1 text-2xl font-semibold">Day-by-day training</h1>
          <p className="mt-2 text-sm text-foreground/60">
            See the full week plan, open any day, and record what you actually did.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/log/history">
            <Button variant="secondary">Exercise history</Button>
          </Link>
          <Link href={`/log/${today}`}>
            <Button variant="primary">Log today</Button>
          </Link>
        </div>
      </div>

      {routine.status !== 'ready' ? (
        <div className="mt-6 rounded-xl border border-foreground/10 bg-foreground/5 p-6 text-sm text-foreground/70">
          {routine.status === 'loading' ? 'Loading…' : routine.error ? `Error: ${routine.error}` : 'Please log in.'}
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5">
            <div className="text-xs font-semibold tracking-wide text-foreground/60">THIS WEEK</div>
            <div className="mt-3 grid gap-3">
              {week.map((d) => {
                const planned = routine.weeklyRoutine[d.dayOfWeek]
                const title = planned.restDay ? 'Rest day' : planned.workoutName || 'Workout'
                const subtitle = planned.restDay
                  ? 'Recovery'
                  : `${planned.exercises.length} exercise${planned.exercises.length === 1 ? '' : 's'}`
                const hasLog = !!logsByDate[d.date]?.hasLog
                return (
                  <div
                    key={d.date}
                    className={`rounded-xl border border-foreground/10 bg-background/40 p-5 ${
                      d.isToday ? 'outline outline-1 outline-foreground/20' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-semibold tracking-wide text-foreground/60">
                            {d.label} · {d.date}
                          </div>
                          {hasLog ? (
                            <div className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs text-foreground/70">
                              Logged
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-1 text-lg font-semibold">{title}</div>
                        <div className="mt-1 text-sm text-foreground/60">{subtitle}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/log/${d.date}`}>
                          <Button variant={d.isToday ? 'primary' : 'secondary'}>
                            {hasLog ? 'View log' : 'View workout'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {status === 'error' && (
            <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

