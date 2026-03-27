import { Suspense } from 'react'
import { SignupForm } from './SignupForm'

export default function SignupPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/5 p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-foreground/60">
          Sign up to save your routine securely in Supabase.
        </p>

        <Suspense
          fallback={<div className="mt-6 text-sm text-foreground/60">Loading…</div>}
        >
          <SignupForm />
        </Suspense>
      </div>
    </main>
  )
}

