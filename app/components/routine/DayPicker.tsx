'use client'

import type { DayOfWeek } from '@/lib/routine/types'
import { DAYS } from '@/lib/routine/types'

export function DayPicker(props: {
  selected: DayOfWeek
  onSelect: (day: DayOfWeek) => void
}) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-2">
      <div className="px-2 pb-2 text-xs font-semibold tracking-wide text-foreground/60">
        DAYS
      </div>
      <div className="flex flex-col gap-1">
        {DAYS.map((day) => {
          const active = day === props.selected
          return (
            <button
              key={day}
              type="button"
              onClick={() => props.onSelect(day)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? 'bg-foreground/15 text-foreground'
                  : 'hover:bg-foreground/10 text-foreground/85'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

