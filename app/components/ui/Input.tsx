'use client'

import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...props }: Props) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-foreground/15 bg-foreground/5 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-foreground/30 ${className}`}
    />
  )
}

