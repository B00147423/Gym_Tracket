import type { LoggedExercise, PerformedSet } from './types'
import { plannedSetCount } from './plannedSetCount'

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(',', '.').trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

function parseOptionalNum(v: unknown): number | null {
  const n = parseNum(v)
  return n === null ? null : n
}

export function emptyPerformedSet(): PerformedSet {
  return { reps: null, weight: null, completed: false, rpe: null, notes: '' }
}

export function seedPerformedSetsFromPlanner(plannedSets: string): PerformedSet[] {
  const n = plannedSetCount(plannedSets)
  return Array.from({ length: n }, () => emptyPerformedSet())
}

/** Migrate old { reps, weight, notes } string shapes + new numeric shape. */
export function normalizePerformedSet(raw: unknown): PerformedSet {
  if (!raw || typeof raw !== 'object') return emptyPerformedSet()
  const o = raw as Record<string, unknown>
  const reps = parseNum(o.reps)
  const weight = parseNum(o.weight)
  const rpe = parseOptionalNum(o.rpe)
  const notes = typeof o.notes === 'string' ? o.notes : ''
  if (typeof o.completed === 'boolean') {
    return {
      reps,
      weight,
      completed: o.completed,
      rpe: rpe ?? null,
      notes,
    }
  }
  return {
    reps,
    weight,
    completed: reps != null && reps > 0 && weight != null,
    rpe: rpe ?? null,
    notes,
  }
}

export function normalizePerformedSets(raw: unknown): PerformedSet[] {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizePerformedSet)
}

export function normalizeLoggedExercise(raw: Partial<LoggedExercise> & { exerciseId?: string }): LoggedExercise {
  const performedSets = normalizePerformedSets(raw.performedSets)
  return {
    exerciseId: raw.exerciseId ?? '',
    name: raw.name ?? '',
    plannedSets: raw.plannedSets ?? '',
    plannedReps: raw.plannedReps ?? '',
    plannedComments: raw.plannedComments ?? '',
    completed: Boolean(raw.completed),
    performedSets,
    performedText: typeof raw.performedText === 'string' ? raw.performedText : '',
  }
}

/** "80kg × 8, 8, 6" — skips incomplete empty sets at the end for display. */
export function formatPerformedSetsLine(sets: PerformedSet[]): string {
  const parts: string[] = []
  for (const s of sets) {
    const w = s.weight
    const r = s.reps
    if (w == null && r == null) continue
    if (w != null && r != null) parts.push(`${w}kg × ${r}`)
    else if (r != null) parts.push(`${r} reps`)
    else if (w != null) parts.push(`${w}kg`)
  }
  if (parts.length === 0) return ''
  return parts.join(', ')
}

export function formatPerformedSetsLineWithRpe(sets: PerformedSet[]): string {
  const line = formatPerformedSetsLine(sets)
  const rpes = sets.map((s) => s.rpe).filter((x): x is number => x != null && x > 0)
  if (rpes.length === 0) return line
  const rpeStr = ` · RPE ${rpes.map((r) => (Number.isInteger(r) ? String(r) : r.toFixed(1))).join('/')}`
  return line ? `${line}${rpeStr}` : rpeStr.trim()
}

/** Primary line for history cards; falls back to legacy session text. */
export function summarizeExerciseLog(entry: LoggedExercise): string {
  const structured = formatPerformedSetsLine(entry.performedSets)
  if (structured) return structured
  return (entry.performedText ?? '').trim()
}

export function summarizeExerciseLogDetailed(entry: LoggedExercise): { setsLine: string; notesLine: string } {
  const setsLine = formatPerformedSetsLineWithRpe(entry.performedSets)
  const notes = (entry.performedText ?? '').trim()
  return {
    setsLine: setsLine || (notes ? '(session notes only)' : ''),
    notesLine: notes,
  }
}

/** Highest logged weight in a session (for simple progression). */
export function maxWeightFromSets(sets: PerformedSet[]): number | null {
  let max: number | null = null
  for (const s of sets) {
    if (s.weight != null && Number.isFinite(s.weight) && s.weight > 0) {
      if (max === null || s.weight > max) max = s.weight
    }
  }
  return max
}

function formatKgMagnitude(n: number): string {
  const a = Math.abs(n)
  if (Number.isInteger(a)) return String(a)
  return a.toFixed(1).replace(/\.0$/, '')
}

/**
 * Compare max weight in the current draft vs last saved session.
 * Returns null if either side has no weight to compare.
 */
export function weightProgressVsLast(current: LoggedExercise, last: LoggedExercise | null): string | null {
  if (!last) return null
  const cur = maxWeightFromSets(current.performedSets)
  const prev = maxWeightFromSets(last.performedSets)
  if (cur == null || prev == null) return null
  const delta = cur - prev
  if (Math.abs(delta) < 0.05) return null
  if (delta > 0) return `+${formatKgMagnitude(delta)} kg vs last session`
  return `−${formatKgMagnitude(delta)} kg vs last session`
}
