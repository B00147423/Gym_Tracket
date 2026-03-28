import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { tryGetSupabase } from '@/lib/supabase';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const { supabase, error } = tryGetSupabase();
    if (!supabase) {
      setFatal(error ?? 'Supabase init failed');
      setAuthed(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!loaded) {
    return null;
  }

  if (fatal) {
    return (
      <KeyboardProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="login" options={{ title: 'Log in' }} />
          </Stack>
        </ThemeProvider>
      </KeyboardProvider>
    );
  }

  if (authed === null) return null;
  return (
    <KeyboardProvider>
      <RootLayoutNav authed={authed} />
    </KeyboardProvider>
  );
}

function RootLayoutNav({ authed }: { authed: boolean }) {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} redirect={!authed} />
        <Stack.Screen name="log/[date]" options={{ title: 'Workout Log' }} redirect={!authed} />
        <Stack.Screen name="log/exercise/[exerciseId]" options={{ title: 'Exercise History' }} redirect={!authed} />
        <Stack.Screen name="login" options={{ title: 'Log in' }} redirect={authed} />
        <Stack.Screen name="signup" options={{ title: 'Sign up' }} redirect={authed} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
