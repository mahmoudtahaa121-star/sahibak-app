import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { View, ActivityIndicator } from 'react-native'

export default function ProviderLayout() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/auth/login')
      return
    }
    if (profile && profile.role !== 'provider' && profile.role !== 'admin') {
      router.replace('/')
    }
  }, [user, profile, loading])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    )
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
