'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="mt-6 grid gap-3">
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        autoComplete="email"
      />
      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        autoComplete="current-password"
      />

      {error && <div className="text-sm text-red-400">{error}</div>}

      <Button
        variant="primary"
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          setError(null)
          try {
            const supabase = createSupabaseBrowserClient()
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            router.replace(next)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Login failed')
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading ? 'Logging in…' : 'Log in'}
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          const url = new URL(window.location.href)
          url.pathname = '/signup'
          router.push(`${url.pathname}?next=${encodeURIComponent(next)}`)
        }}
      >
        Create account
      </Button>
    </div>
  )
}

