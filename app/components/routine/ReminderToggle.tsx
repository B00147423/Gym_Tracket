'use client'

import { Button } from '../ui/Button'
import type { RoutineSettings } from '@/lib/routine/types'
import { ensureNotificationPermission } from '@/lib/routine/notifications'

export function ReminderToggle(props: {
  value: RoutineSettings
  onChange: (next: RoutineSettings) => void
}) {
  const enabled = props.value.remindersEnabled

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Workout reminders</div>
          <div className="mt-1 text-xs text-foreground/60">
            When you open the app, it can show a browser notification for today’s workout (once per day).
            Requires browser notification support.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={enabled ? 'secondary' : 'primary'}
            onClick={async () => {
              if (enabled) {
                props.onChange({ ...props.value, remindersEnabled: false })
                return
              }
              const perm = await ensureNotificationPermission()
              if (perm === 'granted') {
                props.onChange({ ...props.value, remindersEnabled: true })
              } else {
                props.onChange({ ...props.value, remindersEnabled: false })
              }
            }}
          >
            {enabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
      </div>
    </div>
  )
}

