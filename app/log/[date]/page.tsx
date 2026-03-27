'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/app/components/ui/Button'
import { Textarea } from '@/app/components/ui/Textarea'
import { Modal } from '@/app/components/ui/Modal'
import type { WorkoutLog } from '@/lib/log/types'
import {
  loadWorkoutLogByDate,
  saveWorkoutLog,
  buildDefaultLogForDate,
  listExerciseHistory,
} from '@/lib/log/supabaseRepo'
import { useWeeklyRoutine } from '@/lib/routine/useWeeklyRoutine'

function isISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export default function WorkoutLogDayPage() {
  const params = useParams<{ date: string }>()
  const workoutDate = params?.date
  const routine = useWeeklyRoutine()

  const [log, setLog] = useState<Omit<WorkoutLog, 'userId' | 'updatedAt'> | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [saveUi, setSaveUi] = useState<
    | { kind: 'idle' }
    | { kind: 'saving' }
    | { kind: 'saved'; atLabel: string }
    | { kind: 'error'; message: string }
  >({ kind: 'idle' })
  const [lastSavedAtLabel, setLastSavedAtLabel] = useState<string | null>(null)

  const [historyOpenFor, setHistoryOpenFor] = useState<{ exerciseId: string; name: string } | null>(null)
  const [historyStatus, setHistoryStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyItems, setHistoryItems] = useState<
    Array<{ workoutDate: string; workoutName: string; entry: { performedText?: string } | null }>
  >([])

  const canLoad = useMemo(() => !!workoutDate && isISODate(workoutDate) && routine.status === 'ready', [workoutDate, routine.status])

  useEffect(() => {
    if (!canLoad) return
    let cancelled = false
    ;(async () => {
      try {
        setStatus('loading')
        setError(null)
        setSaveUi({ kind: 'idle' })

        const existing = await loadWorkoutLogByDate(workoutDate!)
        if (cancelled) return

        if (existing) {
          const normalized = existing.exercises.map((e) => ({
            ...e,
            performedText: e.performedText ?? '',
            performedSets: e.performedSets ?? [],
          }))
          setLog({
            workoutDate: existing.workoutDate,
            dayOfWeek: existing.dayOfWeek,
            workoutName: existing.workoutName,
            restDay: existing.restDay,
            exercises: normalized,
          })
          if (existing.updatedAt) {
            const d = new Date(existing.updatedAt)
            setLastSavedAtLabel(
              d.toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'short',
              })
            )
          } else {
            setLastSavedAtLabel(null)
          }
          setStatus('ready')
          return
        }

        setLastSavedAtLabel(null)
        const draft = buildDefaultLogForDate({
          workoutDate: workoutDate!,
          weeklyRoutine: routine.weeklyRoutine,
        })
        setLog(draft)
        setStatus('ready')
      } catch (e) {
        setStatus('error')
        setError(e instanceof Error ? e.message : 'Failed to load log')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [canLoad, workoutDate, routine.weeklyRoutine])

  if (!workoutDate || !isISODate(workoutDate)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/60">
          Invalid date. Use `/log/YYYY-MM-DD`.
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-wide text-foreground/60">{workoutDate}</div>
          <h1 className="mt-1 text-2xl font-semibold">Workout log</h1>
          <p className="mt-2 text-sm text-foreground/60">
            Record what you actually did today. This is separate from the planner template.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
          <div className="max-w-[280px] text-right text-xs leading-relaxed text-foreground/60">
            {saveUi.kind === 'saving' && <span>Saving…</span>}
            {saveUi.kind === 'saved' && (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Saved at {saveUi.atLabel}. Stored in Supabase.
              </span>
            )}
            {saveUi.kind === 'error' && <span className="text-red-500">{saveUi.message}</span>}
            {saveUi.kind === 'idle' && lastSavedAtLabel && (
              <span>Last saved: {lastSavedAtLabel}</span>
            )}
          </div>
          <Button
            variant="primary"
            disabled={status !== 'ready' || !log || saveUi.kind === 'saving'}
            onClick={async () => {
              if (!log) return
              setSaveUi({ kind: 'saving' })
              setError(null)
              try {
                await saveWorkoutLog(log)
                const atLabel = new Date().toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                })
                const fullLabel = new Date().toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
                setLastSavedAtLabel(fullLabel)
                setSaveUi({ kind: 'saved', atLabel })
                window.setTimeout(() => setSaveUi({ kind: 'idle' }), 4000)
              } catch (e) {
                const msg = e instanceof Error ? e.message : 'Failed to save'
                setSaveUi({ kind: 'error', message: msg })
                setError(msg)
              }
            }}
          >
            {saveUi.kind === 'saving' ? 'Saving…' : 'Save workout'}
          </Button>
        </div>
      </div>

      {status !== 'ready' || !log ? (
        <div className="mt-6 rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/60">
          {status === 'loading' ? 'Loading…' : error ? `Error: ${error}` : 'Unable to load.'}
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-wide text-foreground/60">WORKOUT</div>
                <div className="mt-1 text-lg font-semibold">
                  {log.restDay ? 'Rest day' : log.workoutName || 'Workout'}
                </div>
                <div className="mt-1 text-sm text-foreground/60">{log.dayOfWeek}</div>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  checked={log.restDay}
                  onChange={(e) => setLog({ ...log, restDay: e.target.checked })}
                  className="h-4 w-4 accent-foreground"
                />
                Rest day
              </label>
            </div>
          </div>

          {!log.restDay && (
            <div className="grid gap-3">
              {log.exercises.length === 0 ? (
                <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-5 text-sm text-foreground/60">
                  No planned exercises for this day. Add them in the planner.
                </div>
              ) : (
                log.exercises.map((ex, idx) => (
                  <div
                    key={ex.exerciseId}
                    className={`rounded-xl border bg-foreground/5 p-5 transition-colors ${
                      ex.completed
                        ? 'border-emerald-500/55 bg-emerald-500/[0.07] shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
                        : 'border-foreground/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{ex.name || `Exercise ${idx + 1}`}</div>
                        <div className="mt-1 text-xs text-foreground/60">
                          Planned: {ex.plannedSets || '—'} sets × {ex.plannedReps || '—'} reps
                        </div>
                        {ex.plannedComments ? (
                          <div className="mt-1 text-xs text-foreground/60">{ex.plannedComments}</div>
                        ) : null}
                        <div className="mt-2">
                          <button
                            type="button"
                            className="text-xs text-foreground/70 underline underline-offset-4 hover:text-foreground"
                            onClick={async () => {
                              setHistoryOpenFor({ exerciseId: ex.exerciseId, name: ex.name || 'Exercise' })
                              setHistoryStatus('loading')
                              setHistoryError(null)
                              try {
                                const items = await listExerciseHistory({ exerciseId: ex.exerciseId, limit: 12 })
                                setHistoryItems(
                                  items.map((it) => ({
                                    workoutDate: it.workoutDate,
                                    workoutName: it.workoutName,
                                    entry: (it.entry as { performedText?: string } | null) ?? null,
                                  }))
                                )
                                setHistoryStatus('ready')
                              } catch (e) {
                                setHistoryStatus('error')
                                setHistoryError(e instanceof Error ? e.message : 'Failed to load history')
                              }
                            }}
                          >
                            View history
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-pressed={ex.completed}
                        onClick={() => {
                          const updated = [...log.exercises]
                          updated[idx] = { ...ex, completed: !ex.completed }
                          setLog({ ...log, exercises: updated })
                        }}
                        className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                          ex.completed
                            ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                            : 'border border-foreground/20 bg-foreground/5 text-foreground/85 hover:bg-foreground/10'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${
                            ex.completed ? 'border-white bg-white/20' : 'border-foreground/30'
                          }`}
                          aria-hidden
                        >
                          {ex.completed ? '✓' : ''}
                        </span>
                        {ex.completed ? 'Done' : 'Mark done'}
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 text-xs font-semibold tracking-wide text-foreground/60">
                        LOG (resizable)
                      </div>
                      <Textarea
                        value={ex.performedText ?? ''}
                        placeholder={`Example:\n1x 20kg x10\n1x 20kg x10\n1x 20kg x8`}
                        rows={4}
                        className="resize-y min-h-[96px]"
                        onChange={(e) => {
                          const updated = [...log.exercises]
                          updated[idx] = { ...ex, performedText: e.target.value }
                          setLog({ ...log, exercises: updated })
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!historyOpenFor}
        title={historyOpenFor ? `History — ${historyOpenFor.name}` : 'History'}
        onClose={() => {
          setHistoryOpenFor(null)
          setHistoryStatus('idle')
          setHistoryError(null)
          setHistoryItems([])
        }}
      >
        {historyStatus === 'loading' || historyStatus === 'idle' ? (
          <div className="text-sm text-foreground/70">Loading…</div>
        ) : historyStatus === 'error' ? (
          <div className="text-sm text-red-400">{historyError ?? 'Failed to load history.'}</div>
        ) : historyItems.length === 0 ? (
          <div className="text-sm text-foreground/70">No history yet for this exercise.</div>
        ) : (
          <div className="grid gap-3">
            {historyItems.map((it) => (
              <div key={it.workoutDate} className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold tracking-wide text-foreground/60">{it.workoutDate}</div>
                    <div className="mt-1 text-sm font-semibold">{it.workoutName || 'Workout'}</div>
                  </div>
                </div>
                {it.entry?.performedText ? (
                  <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-foreground/10 bg-background/40 p-3 text-sm text-foreground/80">
                    {String(it.entry.performedText)}
                  </pre>
                ) : (
                  <div className="mt-3 text-sm text-foreground/60">No detailed log text saved.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </main>
  )
}

