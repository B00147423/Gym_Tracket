'use client'

import type { DayOfWeek, DayRoutine, Exercise } from '@/lib/routine/types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { newId } from '@/lib/routine/id'
import { ExerciseCard } from './ExerciseCard'

export function RoutineEditor(props: {
  day: DayOfWeek
  value: DayRoutine
  onChange: (next: DayRoutine) => void
  onSave: () => void
  saveState: 'idle' | 'saved'
}) {
  const value = props.value

  const setValue = (next: DayRoutine) => props.onChange(next)
  const setExercises = (exercises: Exercise[]) => setValue({ ...value, exercises })

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold tracking-wide text-foreground/60">EDITING</div>
          <div className="text-xl font-semibold">{props.day}</div>
        </div>
        <div className="flex items-center gap-2">
          {props.saveState === 'saved' ? (
            <div className="text-xs text-foreground/60">Saved</div>
          ) : (
            <div className="text-xs text-foreground/40">Not saved</div>
          )}
          <Button type="button" variant="primary" onClick={props.onSave}>
            Save day
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div className="rounded-xl border border-foreground/10 bg-background/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-[220px] flex-1">
              <div className="mb-2 text-xs font-semibold tracking-wide text-foreground/60">
                WORKOUT NAME
              </div>
              <Input
                value={value.workoutName}
                placeholder={value.restDay ? 'Rest day' : 'e.g. Push day'}
                disabled={value.restDay}
                onChange={(e) => setValue({ ...value, workoutName: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground/85">
              <input
                type="checkbox"
                checked={value.restDay}
                onChange={(e) =>
                  setValue({
                    ...value,
                    restDay: e.target.checked,
                    workoutName: e.target.checked ? '' : value.workoutName,
                    exercises: e.target.checked ? [] : value.exercises,
                  })
                }
                className="h-4 w-4 accent-foreground"
              />
              Rest day
            </label>
          </div>
        </div>

        {!value.restDay && (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">Exercises</div>
              <Button
                type="button"
                onClick={() =>
                  setExercises([
                    ...value.exercises,
                    { id: newId(), name: '', sets: '', reps: '', comments: '' },
                  ])
                }
              >
                + Add exercise
              </Button>
            </div>

            {value.exercises.length === 0 ? (
              <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-6 text-sm text-foreground/60">
                No exercises yet. Add your first one.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {value.exercises.map((ex, idx) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onChange={(next) => {
                      const updated = [...value.exercises]
                      updated[idx] = next
                      setExercises(updated)
                    }}
                    onRemove={() => {
                      const updated = value.exercises.filter((e) => e.id !== ex.id)
                      setExercises(updated)
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

