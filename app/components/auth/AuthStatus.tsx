'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/app/components/ui/Button'

export function AuthStatus() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  if (loading) return <div className="text-xs text-foreground/60">…</div>

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="secondary">Log in</Button>
        </Link>
        <Link href="/signup">
          <Button variant="primary">Sign up</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-sm text-foreground/70 sm:block">{user.email}</div>
      <Button
        variant="secondary"
        onClick={async () => {
          const supabase = createSupabaseBrowserClient()
          await supabase.auth.signOut()
          router.refresh()
          router.replace('/')
        }}
      >
        Log out
      </Button>
    </div>
  )
}

