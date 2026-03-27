'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = { href: string; label: string }

const TABS: Tab[] = [
  { href: '/planner', label: 'Planner' },
  { href: '/log', label: 'Log' },
  { href: '/log/history', label: 'History' },
]

export function MobileTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-foreground/10 bg-background/90 backdrop-blur"
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-around px-4 py-2">
        {TABS.map((t) => {
          const active = pathname === t.href || (t.href !== '/' && pathname.startsWith(t.href + '/'))
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center justify-center rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                active ? 'text-foreground bg-foreground/10' : 'text-foreground/65 hover:bg-foreground/10'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

