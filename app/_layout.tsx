import { useEffect, useState } from 'react'
import { Slot } from 'expo-router'
import { View, Text, StyleSheet, I18nManager } from 'react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { queryClient } from '../lib/queryClient'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular: require('../assets/fonts/Cairo-Regular.ttf'),
    Cairo_600SemiBold: require('../assets/fonts/Cairo-SemiBold.ttf'),
    Cairo_700Bold: require('../assets/fonts/Cairo-Bold.ttf'),
  })

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true)
    }
  }, [])

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashText}>صاحبك</Text>
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
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
    fontFamily: 'Cairo_700Bold',
  },
})
