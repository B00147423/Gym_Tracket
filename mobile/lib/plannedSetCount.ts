/**
 * How many empty set rows to seed for a workout log from the planner "Sets" text.
 * Avoids treating "20kg × 8" or "20 kg" as 20 sets (first digit was weight, not set count).
 */
export function plannedSetCount(plannedSets: string): number {
  const s = (plannedSets || '').trim()
  if (!s) return 3

  // "3×10" / "3 x 10" — first number is almost always set count
  const setsReps = s.match(/^\s*(\d{1,2})\s*[x×]\s*\d/i)
  if (setsReps) {
    const n = parseInt(setsReps[1], 10)
    if (Number.isFinite(n)) return Math.min(12, Math.max(1, n))
  }

  // Weight in the sets column (very common) — do not use leading number as set count
  if (/\bkg\b|\blb\b|\blbs\b/i.test(s)) return 3

  const m = s.match(/\d+/)
  if (!m) return 3
  const n = parseInt(m[0], 10)
  if (!Number.isFinite(n)) return 3

  // Reasonable set counts for one exercise; 13+ is usually weight (20, 25, 40…) or a typo
  if (n >= 1 && n <= 12) return n
  return 3
}
