import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { Place } from '../../types'
import { getStatusBadge } from '../../utils/badges'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useProviderPlaces } from '../../hooks/useProviderPlaces'
import Skeleton from '../../components/ui/Skeleton'

export default function ProviderDashboardScreen() {
  const insets = useSafeAreaInsets()
  const { user, profile, loading: authLoading } = useAuth()
  const { data: places, isLoading, refetch } = useProviderPlaces(user?.id)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1B4332" />
      </View>
    )
  }

  if (!user || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Ionicons name="lock-closed" size={48} color="#ADB5BD" />
          <Text style={styles.messageTitle}>يجب تسجيل الدخول</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.buttonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (profile.role !== 'provider') {
    return (
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Ionicons name="storefront" size={48} color="#ADB5BD" />
          <Text style={styles.messageTitle}>هذه الصفحة للمزودين فقط</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const totalPlaces = places?.length || 0
  const approvedPlaces = places?.filter((p: Place) => p.status === 'approved').length || 0
  const pendingPlaces = places?.filter((p: Place) => p.status === 'pending').length || 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1B4332']}
          tintColor="#1B4332"
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>لوحة المزود</Text>
        <Text style={styles.subtitle}>مرحباً، {profile.full_name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalPlaces}</Text>
          <Text style={styles.statLabel}>إجمالي الأماكن</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{approvedPlaces}</Text>
          <Text style={styles.statLabel}>معتمدة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{pendingPlaces}</Text>
          <Text style={styles.statLabel}>قيد المراجعة</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/provider/add-place')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.addButtonText}>إضافة مكان جديد</Text>
      </TouchableOpacity>

      <View style={styles.placesHeader}>
        <Text style={styles.placesTitle}>أماكني</Text>
      </View>

      {isLoading ? (
        <View style={styles.placesList}>
          {[1, 2].map((i) => (
            <View key={i} style={styles.placeCard}>
              <Skeleton width={150} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width={100} height={13} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : !places || places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="storefront-outline" size={64} color="#ADB5BD" />
          <Text style={styles.emptyText}>لم تضف أي مكان بعد</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/provider/add-place')}
          >
            <Text style={styles.emptyButtonText}>إضافة أول مكان</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placesList}>
          {places?.map((place: Place) => {
            const badge = getStatusBadge(place.status)
            const category = place.categories?.[0]
            return (
              <View key={place.id} style={styles.placeCard}>
                <View style={styles.placeHeader}>
                  <Text style={styles.placeName}>{place.name_ar}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>
                      {badge.text}
                    </Text>
                  </View>
                </View>

                {category && (
                  <Text style={styles.placeCategory}>
                    {category.icon} {category.name_ar}
                  </Text>
                )}

                {place.status === 'rejected' && place.admin_note && (
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteLabel}>ملاحظة الإدارة:</Text>
                    <Text style={styles.noteText}>{place.admin_note}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => router.push(`/provider/edit-place/${place.id}`)}
                >
                  <Ionicons name="create-outline" size={16} color="#1B4332" />
                  <Text style={styles.editButtonText}>تعديل</Text>
                </TouchableOpacity>
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  messageTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: '#1B4332',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statValue: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    color: '#1B4332',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B4332',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  placesHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  placesTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
  },
  placesList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  placeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
  },
  placeCategory: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
  },
  noteContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  noteLabel: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 4,
  },
  noteText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#7F1D1D',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  editButtonText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#1B4332',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 16,
    color: '#6C757D',
  },
  emptyButton: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
})
