import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const COOKIE_NAME = 'gt_routine_id'

export async function GET(req: Request) {
  const cookieHeader = req.headers.get('cookie') ?? ''
  const existing = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split('=')[1]

  const routineId = existing || randomUUID()

  const res = NextResponse.json({ routineId })
  if (!existing) {
    res.cookies.set({
      name: COOKIE_NAME,
      value: routineId,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return res
}

