'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Button } from '@/app/components/ui/Button'
import { useWeeklyRoutine } from '@/lib/routine/useWeeklyRoutine'
import { DAYS } from '@/lib/routine/types'

export default function LogHistoryIndexPage() {
  const routine = useWeeklyRoutine()

  const exercises = useMemo(() => {
    if (routine.status !== 'ready') return []
    const items: Array<{ id: string; name: string; day: (typeof DAYS)[number] }> = []
    for (const day of DAYS) {
      const d = routine.weeklyRoutine[day]
      if (d.restDay) continue
      for (const ex of d.exercises) {
        items.push({ id: ex.id, name: ex.name || 'Unnamed', day })
      }
    }
    return items
  }, [routine.status, routine.weeklyRoutine])

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="mb-6">
        <div className="text-xs font-semibold tracking-wide text-foreground/60">HISTORY</div>
        <h1 className="mt-1 text-2xl font-semibold">Exercise history</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Open any exercise to see past sessions. While logging a workout you can also use{" "}
          <span className="text-foreground/80">View history</span> for a quick popup.
        </p>
      </div>

      {routine.status !== 'ready' ? (
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/70">
          {routine.status === 'loading' ? 'Loading…' : routine.error ? `Error: ${routine.error}` : 'Please log in.'}
        </div>
      ) : exercises.length === 0 ? (
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/70">
          No exercises in your planner yet. Add them under{" "}
          <Link href="/planner" className="underline underline-offset-4">
            Planner
          </Link>
          .
        </div>
      ) : (
        <ul className="grid gap-2">
          {exercises.map((ex) => (
            <li
              key={`${ex.day}-${ex.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-foreground/10 bg-foreground/5 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{ex.name}</div>
                <div className="text-xs text-foreground/60">{ex.day}</div>
              </div>
              <Link href={`/log/exercise/${encodeURIComponent(ex.id)}`}>
                <Button variant="secondary">View history</Button>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link href="/log">
          <Button variant="ghost">← Back to week log</Button>
        </Link>
      </div>
    </main>
  )
}
