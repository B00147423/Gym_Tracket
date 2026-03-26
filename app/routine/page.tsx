'use client'

import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from '@/app/components/routine/DayPicker'
import { RoutineEditor } from '@/app/components/routine/RoutineEditor'
import { ReminderToggle } from '@/app/components/routine/ReminderToggle'
import { Button } from '@/app/components/ui/Button'
import type { DayOfWeek } from '@/lib/routine/types'
import { DAYS } from '@/lib/routine/types'
import { getTodayDayOfWeek } from '@/lib/routine/date'
import { maybeNotifyToday } from '@/lib/routine/notifications'
import { useWeeklyRoutine } from '@/lib/routine/useWeeklyRoutine'

export default function RoutineBuilderPage() {
  const routine = useWeeklyRoutine()
  const today = useMemo(() => getTodayDayOfWeek(), [])

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday')
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle')

  useEffect(() => {
    // On first load, default to today for better UX.
    setSelectedDay(today)
  }, [today])

  useEffect(() => {
    maybeNotifyToday({
      today,
      todayRoutine: routine.weeklyRoutine[today],
      settings: routine.settings,
      onSettingsChange: routine.setSettings,
    })
  }, [today, routine.weeklyRoutine, routine.settings, routine.setSettings])

  useEffect(() => {
    if (routine.lastSavedAt == null) return
    setSaveState('saved')
    const t = window.setTimeout(() => setSaveState('idle'), 1500)
    return () => window.clearTimeout(t)
  }, [routine.lastSavedAt])

  const dayValue = routine.weeklyRoutine[selectedDay]

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-foreground/60">ROUTINE</div>
          <h1 className="mt-1 text-2xl font-semibold">Weekly workout planner</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Create your plan for each day. Mark rest days, add exercises, then save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => setSelectedDay(today)}>
            Jump to today
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-4">
          <DayPicker selected={selectedDay} onSelect={setSelectedDay} />
          <ReminderToggle value={routine.settings} onChange={routine.setSettings} />
          <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 text-xs text-foreground/60">
            Tip: You can keep workout name empty if you just want exercises (sets/reps/notes).
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <RoutineEditor
            day={selectedDay}
            value={dayValue}
            onChange={(next) => routine.updateDay(selectedDay, next)}
            onSave={() => {
              routine.saveAll()
              setSaveState('saved')
            }}
            saveState={saveState}
          />

          <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
            <div className="text-xs font-semibold tracking-wide text-foreground/60">QUICK NAV</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <Button key={d} type="button" variant={d === selectedDay ? 'primary' : 'secondary'} onClick={() => setSelectedDay(d)}>
                  {d.slice(0, 3)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

