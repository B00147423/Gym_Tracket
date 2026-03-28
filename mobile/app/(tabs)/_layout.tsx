import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const insets = useSafeAreaInsets()
  const bottomInset = Math.max(insets.bottom, 8)

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: '#0b0b0b',
          borderTopColor: '#2a2a2a',
          borderTopWidth: 1,
          height: 52 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarHideOnKeyboard: true,
        headerStyle: { backgroundColor: '#0b0b0b' },
        headerTintColor: '#fff',
      
        sceneStyle: { backgroundColor: '#0b0b0b' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Planner',
          tabBarLabel: 'Planner',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Log',
          tabBarLabel: 'Log',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
