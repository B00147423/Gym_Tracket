'use client'

import type { DayRoutine, DayOfWeek } from '@/lib/routine/types'

export function TodayBanner(props: { today: DayOfWeek; routine: DayRoutine }) {
  const { today, routine } = props
  const title = routine.restDay
    ? `Today (${today}) is a rest day`
    : routine.workoutName
      ? `Today (${today}): ${routine.workoutName}`
      : `Today (${today}): workout`

  const detail = routine.restDay
    ? 'Recovery day. Stretch, walk, and hydrate.'
    : routine.exercises.length
      ? `${routine.exercises.length} exercise${routine.exercises.length === 1 ? '' : 's'} planned.`
      : 'No exercises added yet.'

  return (
    <div className="rounded-xl border border-foreground/10 bg-gradient-to-br from-foreground/10 to-foreground/5 p-5">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-1 text-sm text-foreground/70">{detail}</div>
    </div>
  )
}

