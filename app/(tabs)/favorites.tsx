import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'
import { useFavorites, useToggleFavorite } from '../../hooks/useFavorites'
import { Place } from '../../types'
import { Ionicons } from '@expo/vector-icons'
import PlaceCard from '../../components/place/PlaceCard'

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const router = useRouter()
  const toggleFavorite = useToggleFavorite()

  const { data: favorites, isLoading, refetch } = useFavorites(user?.id)

  const handleRemoveFavorite = async (placeId: string) => {
    if (!user) return
    await toggleFavorite.mutateAsync({
      userId: user.id,
      placeId,
      isFavorite: true,
    })
  }

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
          <Text style={styles.emoji}>🤍</Text>
          <Text style={styles.title}>لا توجد مفضلات بعد</Text>
          <Text style={styles.subtitle}>تصفح الأماكن وأضف ما يعجبك</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
            <Text style={styles.buttonText}>تصفح الأماكن</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={['#1B4332']}
          tintColor="#1B4332"
        />
      }
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>مفضلاتي</Text>
      </View>
      <View style={styles.list}>
        {favorites.map((place: Place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onPress={() => router.push(`/place/${place.id}`)}
            onRemoveFavorite={() => handleRemoveFavorite(place.id)}
          />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#1B4332',
  },
  list: {
    padding: 18,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
