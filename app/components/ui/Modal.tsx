'use client'

import { useEffect } from 'react'

export function Modal(props: {
  open: boolean
  title?: string
  children: React.ReactNode
  onClose: () => void
}) {
  const open = props.open
  const onClose = props.onClose

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!props.open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose()
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-foreground/10 p-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{props.title ?? 'History'}</div>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
            onClick={props.onClose}
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-4">{props.children}</div>
      </div>
    </div>
  )
}

