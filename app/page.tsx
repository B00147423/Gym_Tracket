'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { Button } from '@/app/components/ui/Button'
import { TodayBanner } from '@/app/components/routine/TodayBanner'
import { getTodayDayOfWeek, toISODateString } from '@/lib/routine/date'
import { maybeNotifyToday } from '@/lib/routine/notifications'
import { useWeeklyRoutine } from '@/lib/routine/useWeeklyRoutine'

export default function Home() {
  const routine = useWeeklyRoutine()
  const today = useMemo(() => getTodayDayOfWeek(), [])
  const todayDate = useMemo(() => toISODateString(), [])

  useEffect(() => {
    if (routine.status !== 'ready') return
    maybeNotifyToday({
      today,
      todayRoutine: routine.weeklyRoutine[today],
      settings: routine.settings,
      onSettingsChange: routine.setSettings,
    })
  }, [today, routine.weeklyRoutine, routine.settings, routine.setSettings, routine.status])

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-foreground/60">GYM TRACKER</div>
          <h1 className="mt-1 text-3xl font-semibold">Your training week</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Plan your weekly routine and get a reminder when you open the app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/planner">
            <Button variant="primary">Planner</Button>
          </Link>
          <Link href="/log">
            <Button variant="secondary">Log</Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4">
        {routine.status === 'ready' ? (
          <TodayBanner today={today} routine={routine.weeklyRoutine[today]} />
        ) : (
          <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/60">
            {routine.status === 'loading'
              ? 'Loading your routine…'
              : routine.error
                ? `Error: ${routine.error}`
                : 'Log in to view your routine.'}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-foreground/10 bg-foreground/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="mt-1 text-xs text-foreground/60">
              Build your plan day-by-day (push/pull/legs, etc.) and save it.
            </div>
          </div>
          <Link href={`/log/${todayDate}`}>
            <Button>Log today</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}