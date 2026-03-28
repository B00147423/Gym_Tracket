import { useState } from 'react'
import { Link, useRouter } from 'expo-router'
import { View, Text, TextInput, Pressable } from 'react-native'
import { getSupabase } from '@/lib/supabase'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Log in</Text>
      <Text style={{ opacity: 0.7 }}>Access your saved routine.</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: '#333',
          padding: 12,
          borderRadius: 12,
          color: 'white',
        }}
        placeholderTextColor="#888"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#333',
          padding: 12,
          borderRadius: 12,
          color: 'white',
        }}
        placeholderTextColor="#888"
      />

      {error ? <Text style={{ color: '#ff6b6b' }}>{error}</Text> : null}

      <Pressable
        disabled={loading}
        onPress={async () => {
          setLoading(true)
          setError(null)
          try {
            const supabase = getSupabase()
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) throw error
            router.replace('/(tabs)')
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Login failed')
          } finally {
            setLoading(false)
          }
        }}
        style={{
          backgroundColor: '#fff',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>{loading ? 'Logging in…' : 'Log in'}</Text>
      </Pressable>

      <Link href="/signup" asChild>
        <Pressable style={{ padding: 12, alignItems: 'center' }}>
          <Text style={{ color: 'white', opacity: 0.85 }}>Create account</Text>
        </Pressable>
      </Link>
    </View>
  )
}

