'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'

export function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
        placeholder="Password (min 6 chars)"
        type="password"
        autoComplete="new-password"
      />

      {error && <div className="text-sm text-red-400">{error}</div>}
      {message && <div className="text-sm text-foreground/70">{message}</div>}

      <Button
        variant="primary"
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          setError(null)
          setMessage(null)
          try {
            const supabase = createSupabaseBrowserClient()
            const { error } = await supabase.auth.signUp({ email, password })
            if (error) throw error
            setMessage('Account created. If email confirmation is enabled, check your inbox.')
            router.replace(next)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Signup failed')
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading ? 'Creating…' : 'Create account'}
      </Button>

      <Button
        variant="secondary"
        onClick={() => {
          const url = new URL(window.location.href)
          url.pathname = '/login'
          router.push(`${url.pathname}?next=${encodeURIComponent(next)}`)
        }}
      >
        Back to login
      </Button>
    </div>
  )
}

