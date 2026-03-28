import { View, Text, TextInput, Pressable } from 'react-native'
import type { DayRoutine } from '@/lib/routineTypes'
import { ExerciseCard } from './ExerciseCard'

export function PlannerEditor(props: {
  day: DayRoutine
  onChangeDay: (nextDay: DayRoutine) => void
}) {
  const { day } = props

  return (
    <View style={{ gap: 10 }}>
      <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2a2a2a' }}>
        <Text style={{ color: '#9ca3af', fontWeight: '800', fontSize: 12 }}>WORKOUT</Text>
        <TextInput
          value={day.workoutName}
          onChangeText={(t) => props.onChangeDay({ ...day, workoutName: t })}
          placeholder={day.restDay ? 'Rest day' : 'e.g. Push'}
          editable={!day.restDay}
          placeholderTextColor="#6b7280"
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: '#2a2a2a',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 11,
            color: 'white',
          }}
        />
        <Pressable
          onPress={() =>
            props.onChangeDay({
              ...day,
              restDay: !day.restDay,
              workoutName: !day.restDay ? '' : day.workoutName,
              exercises: !day.restDay ? [] : day.exercises,
            })
          }
          style={{ marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: '#9ca3af',
              backgroundColor: day.restDay ? '#fff' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {day.restDay ? <Text style={{ color: '#000', fontSize: 12, fontWeight: '800' }}>✓</Text> : null}
          </View>
          <Text style={{ color: '#e5e7eb', fontWeight: '700' }}>Rest day</Text>
        </Pressable>
      </View>

      {!day.restDay && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Exercises</Text>
            <Pressable
              onPress={() =>
                props.onChangeDay({
                  ...day,
                  exercises: [
                    ...day.exercises,
                    { id: String(Date.now()), name: '', sets: '', reps: '', comments: '' },
                  ],
                })
              }
              style={{ backgroundColor: '#1f2937', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>+ Add</Text>
            </Pressable>
          </View>

          {day.exercises.map((ex, idx) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              index={idx}
              onChange={(next) => {
                const updated = [...day.exercises]
                updated[idx] = next
                props.onChangeDay({ ...day, exercises: updated })
              }}
              onRemove={() => props.onChangeDay({ ...day, exercises: day.exercises.filter((e) => e.id !== ex.id) })}
            />
          ))}
        </View>
      )}
    </View>
  )
}