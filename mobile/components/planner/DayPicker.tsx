import { View, Pressable, Text } from 'react-native'
import { DAYS } from '@/lib/routineTypes'
import type { DayOfWeek, WeeklyRoutine } from '@/lib/routineTypes'

export function DayPicker(props: {
  selectedDay: DayOfWeek
  weeklyRoutine: WeeklyRoutine
  onSelectDay: (day: DayOfWeek) => void
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {DAYS.map((d) => {
        const active = d === props.selectedDay
        return (
          <Pressable
            key={d}
            onPress={() => props.onSelectDay(d)}
            style={{
              minWidth: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: active ? '#1f2937' : '#0b1220',
              borderColor: '#2a2a2a',
              borderWidth: 1,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: active ? '#fff' : '#9ca3af', fontWeight: '700', fontSize: 12 }}>
              {d.slice(0, 3)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
