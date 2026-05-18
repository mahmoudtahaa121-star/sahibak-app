import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Place } from '../../types'
import { Ionicons } from '@expo/vector-icons'

export default function FavoritesScreen() {
  const { user } = useAuth()
  const router = useRouter()

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('favorites')
        .select('*, places(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data?.map((f: any) => f.places).filter(Boolean) || []
    },
    enabled: !!user,
  })

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>❤️</Text>
          <Text style={styles.title}>سجّل دخولك لحفظ مفضلاتك</Text>
          <Text style={styles.subtitle}>احفظ الأماكن اللي بتحبها وارجعلها بسهولة</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/login')}>
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1B4332" />
        </View>
      </View>
    )
  }

  if (!favorites || favorites.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>📭</Text>
          <Text style={styles.title}>لا توجد مفضلات بعد</Text>
          <Text style={styles.subtitle}>ابدأ بإضافة الأماكن التي تحبها</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مفضلاتي</Text>
      </View>
      <View style={styles.list}>
        {favorites.map((place: Place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.card}
            onPress={() => router.push(`/place/${place.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.placeName}>{place.name_ar}</Text>
              <Ionicons name="heart" size={20} color="#EF4444" />
            </View>
            {place.phone && (
              <Text style={styles.placePhone}>📱 {place.phone}</Text>
            )}
            {place.address_text && (
              <Text style={styles.placeAddress}>📍 {place.address_text}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#1B4332',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  placeName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  placePhone: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 4,
  },
  placeAddress: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
  },
})
