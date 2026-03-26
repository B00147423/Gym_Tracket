'use client'

import type { Exercise } from '@/lib/routine/types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'

export function ExerciseCard(props: {
  exercise: Exercise
  onChange: (next: Exercise) => void
  onRemove: () => void
}) {
  const ex = props.exercise
  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 text-xs font-semibold tracking-wide text-foreground/60">
            EXERCISE
          </div>
          <Input
            value={ex.name}
            placeholder="e.g. Bench press"
            onChange={(e) => props.onChange({ ...ex, name: e.target.value })}
          />
        </div>
        <Button type="button" variant="ghost" onClick={props.onRemove} aria-label="Remove exercise">
          Remove
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold tracking-wide text-foreground/60">SETS</div>
          <Input
            value={ex.sets}
            placeholder="e.g. 3"
            onChange={(e) => props.onChange({ ...ex, sets: e.target.value })}
          />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold tracking-wide text-foreground/60">REPS</div>
          <Input
            value={ex.reps}
            placeholder="e.g. 8-12"
            onChange={(e) => props.onChange({ ...ex, reps: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-2 text-xs font-semibold tracking-wide text-foreground/60">COMMENTS</div>
        <Textarea
          value={ex.comments}
          placeholder="Optional notes (form cues, weight targets, etc.)"
          rows={3}
          onChange={(e) => props.onChange({ ...ex, comments: e.target.value })}
        />
      </div>
    </div>
  )
}

