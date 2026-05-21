import { useEffect } from 'react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { View, Text, StyleSheet, I18nManager, ActivityIndicator } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '../lib/queryClient';
import { useAuth } from '../hooks/useAuth';
import ErrorBoundary from '../components/ErrorBoundary';
import { PerformanceMonitor } from '../components/ui/PerformanceMonitor';

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inProtectedGroup = segments[0] === 'provider' || segments[0] === 'admin';

    if (user && inAuthGroup) {
      router.replace('/');
    } else if (!user && inProtectedGroup) {
      // Pass the intended redirect URL as a query parameter
      const intendedPath = '/' + segments.join('/');
      router.replace({
        pathname: '/auth/login',
        params: { redirect: intendedPath },
      });
    }
  }, [user, loading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular: require('../assets/fonts/Cairo-Regular.ttf'),
    Cairo_600SemiBold: require('../assets/fonts/Cairo-SemiBold.ttf'),
    Cairo_700Bold: require('../assets/fonts/Cairo-Bold.ttf'),
  });

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          {!fontsLoaded && !fontError ? (
            <View style={styles.splashContainer}>
              <Text style={styles.splashText}>صاحبك</Text>
            </View>
          ) : (
            <>
              <AuthGate />
              <PerformanceMonitor />
            </>
          )}
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B4332',
  },
});
