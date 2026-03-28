import { View, Text, TextInput, Pressable } from 'react-native'
import type { Exercise } from '@/lib/routineTypes'

export function ExerciseCard(props: {
  exercise: Exercise
  index: number
  onChange: (next: Exercise) => void
  onRemove: () => void
}) {
  const { exercise, index } = props

  return (
    <View
      style={{
        backgroundColor: '#0b1220',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#2a2a2a',
        gap: 10,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#9ca3af', fontWeight: '800', fontSize: 12 }}>EXERCISE {index + 1}</Text>
        <Pressable onPress={props.onRemove}>
          <Text style={{ color: '#fb7185', fontWeight: '800' }}>Remove</Text>
        </Pressable>
      </View>

      <TextInput
        value={exercise.name}
        onChangeText={(t) => props.onChange({ ...exercise, name: t })}
        placeholder="Incline DB press"
        placeholderTextColor="#6b7280"
        style={{
          borderWidth: 1,
          borderColor: '#2a2a2a',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 11,
          color: 'white',
        }}
      />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={exercise.sets}
          onChangeText={(t) => props.onChange({ ...exercise, sets: t })}
          placeholder="Sets"
          placeholderTextColor="#6b7280"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#2a2a2a',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 11,
            color: 'white',
          }}
        />
        <TextInput
          value={exercise.reps}
          onChangeText={(t) => props.onChange({ ...exercise, reps: t })}
          placeholder="Reps"
          placeholderTextColor="#6b7280"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: '#2a2a2a',
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 11,
            color: 'white',
          }}
        />
      </View>

      <TextInput
        value={exercise.comments}
        onChangeText={(t) => props.onChange({ ...exercise, comments: t })}
        placeholder="Comments"
        placeholderTextColor="#6b7280"
        multiline
        style={{
          borderWidth: 1,
          borderColor: '#2a2a2a',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 11,
          color: 'white',
          minHeight: 64,
          textAlignVertical: 'top',
        }}
      />
    </View>
  )
}
