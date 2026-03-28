import type { LoggedExercise, PerformedSet } from './logTypes'
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

function isCompletePerformanceSet(s: PerformedSet): boolean {
  if (s.weight == null || s.reps == null) return false
  if (!Number.isFinite(s.weight) || !Number.isFinite(s.reps)) return false
  return s.weight > 0 && s.reps > 0
}

/** At least one set with weight and reps both > 0 (logged work). */
export function hasValidLoggedSet(ex: LoggedExercise): boolean {
  return ex.performedSets.some(isCompletePerformanceSet)
}

export function normalizeLoggedExercise(raw: Partial<LoggedExercise> & { exerciseId?: string }): LoggedExercise {
  const performedSets = normalizePerformedSets(raw.performedSets)
  const ex: LoggedExercise = {
    exerciseId: raw.exerciseId ?? '',
    name: raw.name ?? '',
    plannedSets: raw.plannedSets ?? '',
    plannedReps: raw.plannedReps ?? '',
    plannedComments: raw.plannedComments ?? '',
    completed: false,
    performedSets,
    performedText: typeof raw.performedText === 'string' ? raw.performedText : '',
  }
  return { ...ex, completed: hasValidLoggedSet(ex) }
}

/**
 * Trim; short/empty → "Exercise".
 * Rejects dense alphanumeric junk (e.g. accidental IDs) with no spaces.
 */
export function exerciseDisplayName(name: string): string {
  const t = (name ?? '').trim()
  if (t.length < 3) return 'Exercise'
  const digits = (t.match(/\d/g) ?? []).length
  if (t.length < 20 && !/\s/.test(t) && digits >= 3 && digits / t.length >= 0.25) return 'Exercise'
  return t
}

export type ExerciseLogUiState = 'done' | 'not_started' | 'skipped'

/**
 * Done = valid sets. Not started = draft (workout not persisted yet). Skipped = persisted with completed false.
 * `completed` is synced on save/load with hasValidLoggedSet; do not treat planner defaults as skipped until persisted.
 */
export function exerciseLogUiState(ex: LoggedExercise, workoutPersisted: boolean): ExerciseLogUiState {
  if (hasValidLoggedSet(ex)) return 'done'
  if (!workoutPersisted) return 'not_started'
  return ex.completed === false ? 'skipped' : 'done'
}

/** Saved workout row: exercise was skipped (no valid work, completed false). */
export function persistedExerciseSkipped(ex: LoggedExercise): boolean {
  return !hasValidLoggedSet(ex) && ex.completed === false
}

/** Only complete sets (weight + reps), comma-separated — no performedText. */
export function formatCompleteSetsLine(sets: PerformedSet[]): string {
  const parts: string[] = []
  for (const s of sets) {
    if (!isCompletePerformanceSet(s)) continue
    parts.push(`${s.weight}kg × ${s.reps}`)
  }
  return parts.join(', ')
}

/** Best single set by max weight, then max reps on tie. */
export function bestSetFromPerformedSets(sets: PerformedSet[]): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number } | null = null
  for (const s of sets) {
    if (!isCompletePerformanceSet(s)) continue
    const w = s.weight!
    const r = s.reps!
    if (!best || w > best.weight || (w === best.weight && r > best.reps)) {
      best = { weight: w, reps: r }
    }
  }
  return best
}

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
