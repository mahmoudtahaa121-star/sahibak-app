import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Place, Offer, Profile } from '../../types'

interface PendingPlace extends Omit<Place, 'categories' | 'services'> {
  categories?: { category: { id: number; name_ar: string; icon: string | null } }[]
  services?: { name_ar: string; description_ar: string | null }[]
}

interface PendingOffer extends Offer {
  place?: { id: string; name_ar: string; place_type: 'shop' | 'person'; image_url: string | null }
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [stats, setStats] = useState({
    approvedPlaces: 0,
    pendingPlaces: 0,
    totalUsers: 0,
    totalProviders: 0,
    activeOffers: 0,
  })
  const [pendingPlaces, setPendingPlaces] = useState<PendingPlace[]>([])
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [providers, setProviders] = useState<Profile[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchPendingPlaces(),
        fetchPendingOffers(),
        fetchReports(),
        fetchProviders(),
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role !== 'admin') {
        router.replace('/')
        return
      }
      fetchData()
    }
  }, [authLoading, user, profile, fetchData])



  const fetchStats = useCallback(async () => {
    const [approvedRes, pendingRes, usersRes, offersRes] = await Promise.all([
      supabase.from('places').select('id', { count: 'exact', head: true }).eq('status', 'approved').is('deleted_at', null),
      supabase.from('places').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'approved').is('deleted_at', null),
    ])

    const providersRes = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'provider')

    setStats({
      approvedPlaces: approvedRes.count || 0,
      pendingPlaces: pendingRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalProviders: providersRes.count || 0,
      activeOffers: offersRes.count || 0,
    })
  }, [])

  const fetchPendingPlaces = useCallback(async () => {
    const { data, error } = await supabase
      .from('places')
      .select('*, place_categories(category:categories(*)), place_services(name_ar, description_ar)')
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (data && !error) {
      setPendingPlaces(data as PendingPlace[])
    }
  }, [])

  const fetchPendingOffers = useCallback(async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, place:places(id, name_ar, place_type)')
      .eq('status', 'pending')
      .is('deleted_at', null)

    if (data && !error) {
      setPendingOffers(data as PendingOffer[])
    }
  }, [])

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*, place:places(id, name_ar)')
      .eq('status', 'pending')

    if (data && !error) {
      setReports(data)
    }
  }, [])

  const fetchProviders = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'provider')

    if (data && !error) {
      setProviders(data)
    }
  }, [])

  const approvePlace = useCallback(async (placeId: string) => {
    setRefreshing(true)
    try {
      const { error } = await supabase
        .from('places')
        .update({ status: 'approved' })
        .eq('id', placeId)

      if (error) throw error

      await supabase.from('audit_log').insert({
        admin_id: user?.id,
        action: 'approved_place',
        target_type: 'place',
        target_id: placeId,
      })

      await fetchPendingPlaces()
      await fetchStats()
      Alert.alert('تم', 'تمت الموافقة على المكان')
    } catch (error) {
      Alert.alert('خطأ', 'فشل الموافقة')
    } finally {
      setRefreshing(false)
    }
  }, [user, fetchPendingPlaces, fetchStats])

  const rejectPlace = useCallback(async (placeId: string) => {
    Alert.prompt(
      'سبب الرفض',
      'أدخل سبب رفض المكان',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'رفض',
          onPress: async (reason?: string) => {
            if (!reason) {
              Alert.alert('خطأ', 'الرجاء إدخال سبب الرفض')
              return
            }

            setRefreshing(true)
            try {
              const { error } = await supabase
                .from('places')
                .update({ status: 'rejected', admin_note: reason })
                .eq('id', placeId)

              if (error) throw error

              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'rejected_place',
                target_type: 'place',
                target_id: placeId,
              })

              await fetchPendingPlaces()
              await fetchStats()
              Alert.alert('تم', 'تم رفض المكان')
            } catch (error) {
              Alert.alert('خطأ', 'فشل الرفض')
            } finally {
              setRefreshing(false)
            }
          },
        },
      ],
      'plain-text'
    )
  }, [user, fetchPendingPlaces, fetchStats])

  const approveOffer = useCallback(async (offerId: string) => {
    setRefreshing(true)
    try {
      const { error } = await supabase
        .from('offers')
        .update({ status: 'approved' })
        .eq('id', offerId)

      if (error) throw error

      await supabase.from('audit_log').insert({
        admin_id: user?.id,
        action: 'approved_offer',
        target_type: 'offer',
        target_id: offerId,
      })

      await fetchPendingOffers()
      Alert.alert('تم', 'تمت الموافقة على العرض')
    } catch (error) {
      Alert.alert('خطأ', 'فشل الموافقة')
    } finally {
      setRefreshing(false)
    }
  }, [user, fetchPendingOffers])

  const rejectOffer = useCallback(async (offerId: string) => {
    Alert.prompt(
      'سبب الرفض',
      'أدخل سبب رفض العرض',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'رفض',
          onPress: async (reason?: string) => {
            if (!reason) {
              Alert.alert('خطأ', 'الرجاء إدخال سبب الرفض')
              return
            }

            setRefreshing(true)
            try {
              const { error } = await supabase
                .from('offers')
                .update({ status: 'rejected' })
                .eq('id', offerId)

              if (error) throw error

              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'rejected_offer',
                target_type: 'offer',
                target_id: offerId,
              })

              await fetchPendingOffers()
              Alert.alert('تم', 'تم رفض العرض')
            } catch (error) {
              Alert.alert('خطأ', 'فشل الرفض')
            } finally {
              setRefreshing(false)
            }
          },
        },
      ],
      'plain-text'
    )
  }, [user, fetchPendingOffers])

  const markReportReviewed = useCallback(async (reportId: string) => {
    setRefreshing(true)
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'reviewed' })
        .eq('id', reportId)

      if (error) throw error

      await fetchReports()
      Alert.alert('تم', 'تم مراجعة البلاغ')
    } catch (error) {
      Alert.alert('خطأ', 'فشل المراجعة')
    } finally {
      setRefreshing(false)
    }
  }, [fetchReports])

  const toggleBan = useCallback(async (providerId: string, currentStatus: boolean) => {
    setRefreshing(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentStatus })
        .eq('id', providerId)

      if (error) throw error

      await fetchProviders()
      Alert.alert('تم', currentStatus ? 'تم إلغاء الحظر' : 'تم حظر المزود')
    } catch (error) {
      Alert.alert('خطأ', 'فشل التحديث')
    } finally {
      setRefreshing(false)
    }
  }, [fetchProviders])

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `منذ ${diffDays} يوم`
    }
    return `منذ ${diffHours} ساعة`
  }, [])

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1B4332" size="large" />
      </View>
    )
  }
 contentContainerStyle={{ paddingTop: insets.top }}
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>لوحة الإدارة</Text>
        <Text style={styles.headerSubtitle}>مرحباً، {profile?.full_name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.approvedPlaces}</Text>
          <Text style={styles.statLabel}>أماكن معتمدة</Text>
        </View>
        <View style={[styles.statCard, stats.pendingPlaces > 0 && styles.statCardAlert]}>
          <Text style={styles.statValue}>{stats.pendingPlaces}</Text>
          <Text style={styles.statLabel}>قيد المراجعة</Text>
          {stats.pendingPlaces > 0 && <View style={styles.badge} />}
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalProviders}</Text>
          <Text style={styles.statLabel}>المزودين</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeOffers}</Text>
          <Text style={styles.statLabel}>عروض نشطة</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>طلبات الأماكن المعلقة</Text>
          {stats.pendingPlaces > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{stats.pendingPlaces}</Text>
            </View>
          )}
        </View>

        {pendingPlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد طلبات معلقة</Text>
          </View>
        ) : (
          pendingPlaces.map((place) => {
            const category = place.categories?.[0]?.category
            const services = place.services || []

            return (
              <View key={place.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {place.place_type === 'shop' ? '🏪 محل' : '👤 شخص'}
                    </Text>
                  </View>
                  <Text style={styles.cardTime}>{getTimeAgo(place.created_at)}</Text>
                </View>

                <Text style={styles.cardTitle}>{place.name_ar}</Text>

                {category && (
                  <Text style={styles.cardCategory}>
                    {category.icon} {category.name_ar}
                  </Text>
                )}

                <Text style={styles.cardPhone}>📱 {place.phone}</Text>

                {place.place_type === 'shop' && place.address_text && (
                  <Text style={styles.cardAddress}>📍 {place.address_text}</Text>
                )}

                {place.description_ar && (
                  <Text style={styles.cardDescription}>{place.description_ar}</Text>
                )}

                {services.length > 0 && (
                  <View style={styles.servicesContainer}>
                    <Text style={styles.servicesLabel}>الخدمات:</Text>
                    {services.map((service, idx) => (
                      <Text key={idx} style={styles.serviceItem}>
                        • {service.name_ar}
                      </Text>
                    ))}
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => approvePlace(place.id)}
                    disabled={refreshing}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>موافقة</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => rejectPlace(place.id)}
                    disabled={refreshing}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                    <Text style={styles.rejectButtonText}>رفض</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>عروض معلقة</Text>
          {pendingOffers.length > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingOffers.length}</Text>
            </View>
          )}
        </View>

        {pendingOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد عروض معلقة</Text>
          </View>
        ) : (
          pendingOffers.map((offer) => (
            <View key={offer.id} style={styles.card}>
              <Text style={styles.cardTitle}>{offer.title_ar}</Text>
              {offer.place && (
                <Text style={styles.cardCategory}>
                  🏪 {offer.place.name_ar}
                </Text>
              )}
              {offer.expires_at && (
                <Text style={styles.cardTime}>
                  ينتهي: {new Date(offer.expires_at).toLocaleDateString('ar-EG')}
                </Text>
              )}
              {offer.description_ar && (
                <Text style={styles.cardDescription}>{offer.description_ar}</Text>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => approveOffer(offer.id)}
                  disabled={refreshing}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>موافقة</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => rejectOffer(offer.id)}
                  disabled={refreshing}
                >
                  <Ionicons name="close" size={18} color="#FFFFFF" />
                  <Text style={styles.rejectButtonText}>رفض</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>البلاغات</Text>

        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد بلاغات</Text>
          </View>
        ) : (
          reports.map((report) => (
            <View key={report.id} style={styles.card}>
              <Text style={styles.cardTitle}>{report.place?.name_ar || 'مكان محذوف'}</Text>
              <Text style={styles.cardDescription}>{report.reason}</Text>
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => markReportReviewed(report.id)}
                disabled={refreshing}
              >
                <Text style={styles.reviewButtonText}>تم المراجعة</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المزودين</Text>

        {providers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا يوجد مزودين</Text>
          </View>
        ) : (
          providers.map((provider) => (
            <View key={provider.id} style={styles.card}>
              <View style={styles.providerHeader}>
                <Text style={styles.cardTitle}>{provider.full_name}</Text>
                {provider.is_banned && (
                  <View style={styles.bannedBadge}>
                    <Text style={styles.bannedBadgeText}>محظور</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardPhone}>📱 {provider.phone}</Text>
              <TouchableOpacity
                style={[
                  styles.banButton,
                  provider.is_banned ? styles.unbanButton : null,
                ]}
                onPress={() => toggleBan(provider.id, provider.is_banned)}
                disabled={refreshing}
              >
                <Text style={styles.banButtonText}>
                  {provider.is_banned ? 'إلغاء الحظر' : 'حظر'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.footer} />
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
  header: {
    backgroundColor: '#1B4332',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#D4A843',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    position: 'relative',
  },
  statCardAlert: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statValue: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    color: '#1B4332',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#1A1A1A',
  },
  cardTime: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: '#6C757D',
  },
  cardTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  cardCategory: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
  },
  cardPhone: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#1A1A1A',
  },
  cardAddress: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#1A1A1A',
  },
  cardDescription: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 20,
  },
  servicesContainer: {
    marginTop: 4,
  },
  servicesLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceItem: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#6C757D',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  reviewButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  reviewButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  providerHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannedBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannedBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  banButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  unbanButton: {
    backgroundColor: '#10B981',
  },
  banButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  footer: {
    height: 20,
  },
})
