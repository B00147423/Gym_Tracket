import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const STORAGE_KEY = 'gt-auth'

const secureStorage = {
  async getItem(key: string) {
    return await SecureStore.getItemAsync(`${STORAGE_KEY}_${key}`)
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(`${STORAGE_KEY}_${key}`, value)
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(`${STORAGE_KEY}_${key}`)
  },
}

let _client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (_client) return _client

  const isWeb = Platform.OS === 'web'
  const isServer = typeof window === 'undefined'

  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // Expo Router web can render on the server; SecureStore isn't available there.
      storage: !isServer && !isWeb ? secureStorage : undefined,
      autoRefreshToken: !isServer,
      persistSession: !isServer && !isWeb,
      detectSessionInUrl: false,
    },
  })

  return _client
}

// Convenience default import for client components.
export const supabase = getSupabase()

