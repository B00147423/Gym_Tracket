'use client'

import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from '@/app/components/routine/DayPicker'
import { RoutineEditor } from '@/app/components/routine/RoutineEditor'
import { ReminderToggle } from '@/app/components/routine/ReminderToggle'
import { Button } from '@/app/components/ui/Button'
import type { DayOfWeek } from '@/lib/routine/types'
import { getTodayDayOfWeek } from '@/lib/routine/date'
import { maybeNotifyToday } from '@/lib/routine/notifications'
import { useWeeklyRoutine } from '@/lib/routine/useWeeklyRoutine'

export default function RoutineBuilderPage() {
  const routine = useWeeklyRoutine()
  const today = useMemo(() => getTodayDayOfWeek(), [])

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Monday')

  useEffect(() => {
    // On first load, default to today for better UX.
    setSelectedDay(today)
  }, [today])

  useEffect(() => {
    if (routine.status !== 'ready') return
    maybeNotifyToday({
      today,
      todayRoutine: routine.weeklyRoutine[today],
      settings: routine.settings,
      onSettingsChange: routine.setSettings,
    })
  }, [today, routine.weeklyRoutine, routine.settings, routine.setSettings, routine.status])

  const dayValue = routine.weeklyRoutine[selectedDay]

  if (routine.status !== 'ready') {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/60">
          {routine.status === 'loading'
            ? 'Loading…'
            : routine.error
              ? `Error: ${routine.error}`
              : 'Please log in to edit your routine.'}
        </div>
      </main>
    )
  }

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
          <Button
            type="button"
            variant={routine.isDirty ? 'primary' : 'secondary'}
            disabled={!routine.isDirty}
            onClick={() => routine.saveAll()}
          >
            Save all
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
            onSave={() => routine.saveAll()}
            hasUnsavedChanges={routine.isDirty}
            lastSavedAtMs={routine.lastSavedAt}
          />
        </div>
      </div>
    </main>
  )
}

