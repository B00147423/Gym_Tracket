import 'react-native-url-polyfill/auto'

import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

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

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase env vars (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY). ' +
        'For dev-build workflow, start Metro with `npx expo start --dev-client` so EXPO_PUBLIC_ env is injected.'
    )
  }

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

export function tryGetSupabase(): { supabase: ReturnType<typeof createClient> | null; error: string | null } {
  try {
    return { supabase: getSupabase(), error: null }
  } catch (e) {
    return { supabase: null, error: e instanceof Error ? e.message : 'Failed to initialize Supabase' }
  }
}

