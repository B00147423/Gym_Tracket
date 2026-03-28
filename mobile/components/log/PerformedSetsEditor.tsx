import { View, Text, TextInput, Pressable, ScrollView } from 'react-native'
import type { PerformedSet } from '@/lib/logTypes'
import { emptyPerformedSet } from '@/lib/performedSets'

function parseInputNum(s: string): number | null {
  const t = s.trim().replace(',', '.')
  if (t === '') return null
  const n = parseFloat(t)
  return Number.isFinite(n) ? n : null
}

function numToInput(n: number | null | undefined): string {
  if (n == null) return ''
  return Number.isInteger(n) ? String(n) : String(n)
}

const inp = {
  borderWidth: 1,
  borderColor: '#374151',
  borderRadius: 6,
  paddingHorizontal: 6,
  paddingVertical: 5,
  color: 'white' as const,
  fontSize: 13,
}

export function PerformedSetsEditor(props: {
  sets: PerformedSet[]
  onChange: (sets: PerformedSet[]) => void
}) {
  const { sets, onChange } = props

  function updateAt(i: number, patch: Partial<PerformedSet>) {
    const next = sets.map((s, j) => (j === i ? { ...s, ...patch } : s))
    onChange(next)
  }

  return (
    <View>
      <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>SETS</Text>
      {sets.map((set, i) => (
        <View
          key={`row-${i}`}
          style={{
            borderWidth: 1,
            borderColor: '#2a2a2a',
            borderRadius: 8,
            marginBottom: 6,
            overflow: 'hidden',
          }}
        >
          {/* One horizontal row: scrolls sideways on tiny screens instead of wrapping */}
          <ScrollView
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ minHeight: 40 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6, gap: 6 }}>
            <Text style={{ color: '#6b7280', fontSize: 11, width: 22 }}>{i + 1}</Text>
            <TextInput
              value={numToInput(set.weight)}
              onChangeText={(t) => updateAt(i, { weight: parseInputNum(t) })}
              placeholder="kg"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              style={{ ...inp, width: 56, minWidth: 56 }}
            />
            <Text style={{ color: '#6b7280', fontSize: 12 }}>×</Text>
            <TextInput
              value={numToInput(set.reps)}
              onChangeText={(t) => updateAt(i, { reps: parseInputNum(t) })}
              placeholder="reps"
              placeholderTextColor="#6b7280"
              keyboardType="number-pad"
              style={{ ...inp, width: 48, minWidth: 48 }}
            />
            <Pressable
              onPress={() => updateAt(i, { completed: !set.completed })}
              hitSlop={6}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 6,
                backgroundColor: set.completed ? '#14532d' : '#1f2937',
                borderWidth: 1,
                borderColor: set.completed ? '#22c55e' : '#4b5563',
              }}
            >
              <Text style={{ color: set.completed ? '#86efac' : '#d1d5db', fontSize: 11, fontWeight: '700' }}>
                {set.completed ? '✓' : '○'}
              </Text>
            </Pressable>
            <TextInput
              value={numToInput(set.rpe ?? null)}
              onChangeText={(t) => updateAt(i, { rpe: parseInputNum(t) })}
              placeholder="RPE"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              style={{ ...inp, width: 44, minWidth: 44, fontSize: 12 }}
            />
            {sets.length > 1 ? (
              <Pressable
                onPress={() => onChange(sets.filter((_, j) => j !== i))}
                hitSlop={8}
                style={{ paddingHorizontal: 6, paddingVertical: 4 }}
              >
                <Text style={{ color: '#fb7185', fontSize: 16, fontWeight: '800' }}>×</Text>
              </Pressable>
            ) : null}
            </View>
          </ScrollView>
        </View>
      ))}
      <Pressable
        onPress={() => onChange([...sets, emptyPerformedSet()])}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#1f2937',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          marginTop: 2,
        }}
      >
        <Text style={{ color: '#e5e7eb', fontWeight: '700', fontSize: 12 }}>+ Add set</Text>
      </Pressable>
    </View>
  )
}
