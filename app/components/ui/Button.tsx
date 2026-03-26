'use client'

import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'secondary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const styles: Record<NonNullable<Props['variant']>, string> = {
    primary: 'bg-foreground text-background hover:bg-foreground/90',
    secondary: 'bg-foreground/10 text-foreground hover:bg-foreground/15 border border-foreground/15',
    ghost: 'bg-transparent text-foreground hover:bg-foreground/10',
  }

  return <button {...props} className={`${base} ${styles[variant]} ${className}`} />
}

