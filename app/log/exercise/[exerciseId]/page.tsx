'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/app/components/ui/Button'
import { listExerciseHistory } from '@/lib/log/supabaseRepo'

export default function ExerciseHistoryPage() {
  const params = useParams<{ exerciseId: string }>()
  const exerciseId = params?.exerciseId

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<
    Array<{
      workoutDate: string
      workoutName: string
      entry: { performedText?: string } | null
    }>
  >([])

  useEffect(() => {
    if (!exerciseId) return
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setError(null)
        const data = await listExerciseHistory({ exerciseId, limit: 30 })
        if (cancelled) return
        setItems(data)
        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Failed to load history')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [exerciseId])

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-foreground/60">EXERCISE HISTORY</div>
          <h1 className="mt-1 text-2xl font-semibold">Past sessions</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Logs for this exercise across previous workouts.
          </p>
        </div>
        <Link href="/log">
          <Button variant="secondary">Back to log</Button>
        </Link>
      </div>

      {status !== 'ready' ? (
        <div className="mt-6 rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/60">
          {status === 'loading' ? 'Loading…' : error ? `Error: ${error}` : 'Unable to load.'}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/60">
          No history yet for this exercise.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {items.map((it) => (
            <div key={it.workoutDate} className="rounded-xl border border-foreground/10 bg-foreground/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-wide text-foreground/60">{it.workoutDate}</div>
                  <div className="mt-1 text-sm font-semibold">{it.workoutName || 'Workout'}</div>
                </div>
                <Link href={`/log/${it.workoutDate}`}>
                  <Button variant="secondary">Open day</Button>
                </Link>
              </div>
              {it.entry?.performedText ? (
                <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-foreground/10 bg-background/40 p-4 text-sm text-foreground/80">
                  {String(it.entry.performedText)}
                </pre>
              ) : (
                <div className="mt-4 text-sm text-foreground/60">No detailed log text saved.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

