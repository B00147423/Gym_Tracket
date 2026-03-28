import { View, Text, Pressable } from 'react-native'
import type { RoutineSettings } from '@/lib/routineTypes'

export function ReminderToggle(props: {
  value: RoutineSettings
  onChange: (next: RoutineSettings) => void
}) {
  const enabled = props.value.remindersEnabled

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Text style={{ color: '#9ca3af', fontSize: 12 }}>Workout reminders</Text>
      <Pressable
        onPress={() =>
          props.onChange({
            ...props.value,
            remindersEnabled: !enabled,
          })
        }
        style={{ borderRadius: 10, backgroundColor: enabled ? '#1f2937' : '#ffffff', paddingVertical: 7, paddingHorizontal: 10 }}
      >
        <Text style={{ color: enabled ? '#fff' : '#000', fontWeight: '800', fontSize: 12 }}>
          {enabled ? 'Disable' : 'Enable'}
        </Text>
      </Pressable>
    </View>
  )
}
