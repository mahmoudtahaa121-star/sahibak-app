import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Place, Offer, PlaceCategoryWithCategory, Profile } from '../../types';
import Skeleton from '../../components/ui/Skeleton';
import PromptModal from '../../components/ui/PromptModal';

interface PendingPlace extends Omit<Place, 'categories' | 'services'> {
  place_categories?: PlaceCategoryWithCategory[];
  place_services?: { name_ar: string; description_ar: string | null }[];
}

interface PendingOffer extends Offer {
  place?: { id: string; name_ar: string; place_type: 'shop' | 'person'; image_url: string | null };
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    approvedPlaces: 0,
    pendingPlaces: 0,
    totalUsers: 0,
    totalProviders: 0,
    activeOffers: 0,
  });
  const [pendingPlaces, setPendingPlaces] = useState<PendingPlace[]>([]);
  const [pendingOffers, setPendingOffers] = useState<PendingOffer[]>([]);
  const [editRequests, setEditRequests] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [providers, setProviders] = useState<Profile[]>([]);
  const [showRejectPlaceModal, setShowRejectPlaceModal] = useState(false);
  const [showRejectOfferModal, setShowRejectOfferModal] = useState(false);
  const [showRejectEditModal, setShowRejectEditModal] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [selectedEditRequestId, setSelectedEditRequestId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPendingPlaces(),
        fetchPendingOffers(),
        fetchEditRequests(),
        fetchReports(),
        fetchProviders(),
      ]);
    } catch (error) {
      // Error fetching data - will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.role !== 'admin') {
        router.replace('/');
        return;
      }
      fetchData();
    }
  }, [authLoading, user, profile, fetchData]);

  const fetchStats = useCallback(async () => {
    const [approvedRes, pendingRes, usersRes, offersRes] = await Promise.all([
      supabase
        .from('places')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('deleted_at', null),
      supabase
        .from('places')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .is('deleted_at', null),
    ]);

    const providersRes = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'provider');

    setStats({
      approvedPlaces: approvedRes.count || 0,
      pendingPlaces: pendingRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalProviders: providersRes.count || 0,
      activeOffers: offersRes.count || 0,
    });
  }, []);

  const fetchPendingPlaces = useCallback(async () => {
    const { data, error } = await supabase
      .from('places')
      .select(
        '*, place_categories(category:categories(*)), place_services(name_ar, description_ar)'
      )
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setPendingPlaces(data as PendingPlace[]);
    }
  }, []);

  const fetchPendingOffers = useCallback(async () => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, place:places(id, name_ar, place_type)')
      .eq('status', 'pending')
      .is('deleted_at', null);

    if (data && !error) {
      setPendingOffers(data as PendingOffer[]);
    }
  }, []);

  const fetchEditRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('place_edit_requests')
      .select('*, place:places(id, name_ar)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (data && !error) {
      setEditRequests(data);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*, place:places(id, name_ar)')
      .eq('status', 'pending');

    if (data && !error) {
      setReports(data);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('role', 'provider');

    if (data && !error) {
      setProviders(data);
    }
  }, []);

  const approvePlace = useCallback(
    async (placeId: string) => {
      Alert.alert('تأكيد الموافقة', 'هل أنت متأكد من الموافقة على هذا المكان؟', [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'موافقة',
          onPress: async () => {
            setRefreshing(true);
            try {
              const { error } = await supabase
                .from('places')
                .update({ status: 'approved' })
                .eq('id', placeId);

              if (error) throw error;

              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'approved_place',
                target_type: 'place',
                target_id: placeId,
              });

              await fetchPendingPlaces();
              await fetchStats();
              Alert.alert('تم', 'تمت الموافقة على المكان');
            } catch (error) {
              console.error('Approve place error:', error);
              Alert.alert('خطأ', 'فشل الموافقة');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]);
    },
    [user, fetchPendingPlaces, fetchStats]
  );

  const rejectPlace = useCallback(async (placeId: string) => {
    setSelectedPlaceId(placeId);
    setShowRejectPlaceModal(true);
  }, []);

  const handleRejectPlaceSubmit = useCallback(
    async (reason: string) => {
      if (!reason || !selectedPlaceId) {
        Alert.alert('خطأ', 'الرجاء إدخال سبب الرفض');
        return;
      }

      Alert.alert('تأكيد الرفض', `هل أنت متأكد من رفض هذا المكان؟ السبب: ${reason}`, [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            setRefreshing(true);
            try {
              const { error } = await supabase
                .from('places')
                .update({ status: 'rejected', admin_note: reason })
                .eq('id', selectedPlaceId);

              if (error) throw error;

              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'rejected_place',
                target_type: 'place',
                target_id: selectedPlaceId,
              });

              await fetchPendingPlaces();
              await fetchStats();
              Alert.alert('تم', 'تم رفض المكان');
            } catch (error) {
              console.error('Reject place error:', error);
              Alert.alert('خطأ', 'فشل الرفض');
            } finally {
              setRefreshing(false);
              setSelectedPlaceId(null);
            }
          },
        },
      ]);
    },
    [user, selectedPlaceId, fetchPendingPlaces, fetchStats]
  );

  const approveOffer = useCallback(
    async (offerId: string) => {
      Alert.alert('تأكيد الموافقة', 'هل أنت متأكد من الموافقة على هذا العرض؟', [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'موافقة',
          onPress: async () => {
            setRefreshing(true);
            try {
              const { error } = await supabase
                .from('offers')
                .update({ status: 'approved' })
                .eq('id', offerId);

              if (error) throw error;

              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'approved_offer',
                target_type: 'offer',
                target_id: offerId,
              });

              await fetchPendingOffers();
              Alert.alert('تم', 'تمت الموافقة على العرض');
            } catch (error) {
              console.error('Approve offer error:', error);
              Alert.alert('خطأ', 'فشل الموافقة');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]);
    },
    [user, fetchPendingOffers]
  );

  const rejectOffer = useCallback(async (offerId: string) => {
    setSelectedOfferId(offerId);
    setShowRejectOfferModal(true);
  }, []);

  const handleRejectOfferSubmit = useCallback(
    async (reason: string) => {
      if (!reason || !selectedOfferId) {
        Alert.alert('خطأ', 'الرجاء إدخال سبب الرفض');
        return;
      }

      Alert.alert('تأكيد الرفض', `هل أنت متأكد من رفض هذا العرض؟ السبب: ${reason}`, [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            setRefreshing(true);
            try {
              const { error } = await supabase
                .from('offers')
                .update({ status: 'rejected' })
                .eq('id', selectedOfferId);

              if (error) throw error;

              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'rejected_offer',
                target_type: 'offer',
                target_id: selectedOfferId,
              });

              await fetchPendingOffers();
              Alert.alert('تم', 'تم رفض العرض');
            } catch (error) {
              console.error('Reject offer error:', error);
              Alert.alert('خطأ', 'فشل الرفض');
            } finally {
              setRefreshing(false);
              setSelectedOfferId(null);
            }
          },
        },
      ]);
    },
    [user, selectedOfferId, fetchPendingOffers]
  );

  const markReportReviewed = useCallback(
    async (reportId: string) => {
      Alert.alert('تأكيد المراجعة', 'هل أنت متأكد من مراجعة هذا البلاغ؟', [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'مراجعة',
          onPress: async () => {
            setRefreshing(true);
            try {
              const { error } = await supabase
                .from('reports')
                .update({ status: 'reviewed' })
                .eq('id', reportId);

              if (error) throw error;

              await fetchReports();
              Alert.alert('تم', 'تم مراجعة البلاغ');
            } catch (error) {
              console.error('Mark report reviewed error:', error);
              Alert.alert('خطأ', 'فشل المراجعة');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]);
    },
    [fetchReports]
  );

  const toggleBan = useCallback(
    async (providerId: string, currentStatus: boolean) => {
      const action = currentStatus ? 'إلغاء الحظر' : 'حظر';
      const message = currentStatus
        ? 'هل أنت متأكد من إلغاء حظر هذا المزود؟'
        : 'هل أنت متأكد من حظر هذا المزود؟ لن يتمكن من إضافة أو تعديل الأماكن.';

      Alert.alert(`تأكيد ${action}`, message, [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: action,
          style: currentStatus ? 'default' : 'destructive',
          onPress: async () => {
            setRefreshing(true);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ is_banned: !currentStatus })
                .eq('id', providerId);

              if (error) throw error;

              await fetchProviders();
              Alert.alert('تم', currentStatus ? 'تم إلغاء الحظر' : 'تم حظر المزود');
            } catch (error) {
              console.error('Ban toggle error:', error);
              Alert.alert('خطأ', 'فشل التحديث');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]);
    },
    [fetchProviders]
  );

  const approveEditRequest = useCallback(
    async (requestId: string, placeId: string, fieldName: string, newValue: string) => {
      Alert.alert('تأكيد الموافقة', 'هل أنت متأكد من الموافقة على هذا التعديل؟', [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'موافقة',
          onPress: async () => {
            setRefreshing(true);
            try {
              // Update the place field
              if (fieldName === 'category_ids') {
                // Handle category_ids separately
                const newCategoryIds = JSON.parse(newValue);
                await supabase.from('place_categories').delete().eq('place_id', placeId);
                for (const categoryId of newCategoryIds) {
                  await supabase.from('place_categories').insert({
                    place_id: placeId,
                    category_id: categoryId,
                  });
                }
              } else {
                // Update simple field
                await supabase
                  .from('places')
                  .update({ [fieldName]: newValue })
                  .eq('id', placeId);
              }

              // Update request status
              await supabase
                .from('place_edit_requests')
                .update({ status: 'approved' })
                .eq('id', requestId);

              // Insert audit log
              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'approved_edit_request',
                target_type: 'place_edit_request',
                target_id: requestId,
              });

              await fetchEditRequests();
              Alert.alert('تم', 'تمت الموافقة على التعديل');
            } catch (error) {
              console.error('Approve edit request error:', error);
              Alert.alert('خطأ', 'فشل الموافقة');
            } finally {
              setRefreshing(false);
            }
          },
        },
      ]);
    },
    [user, fetchEditRequests]
  );

  const rejectEditRequest = useCallback(async (requestId: string) => {
    setSelectedEditRequestId(requestId);
    setShowRejectEditModal(true);
  }, []);

  const handleRejectEditSubmit = useCallback(
    async (reason: string) => {
      if (!reason || !selectedEditRequestId) {
        Alert.alert('خطأ', 'الرجاء إدخال سبب الرفض');
        return;
      }

      Alert.alert('تأكيد الرفض', `هل أنت متأكد من رفض هذا التعديل؟ السبب: ${reason}`, [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'رفض',
          style: 'destructive',
          onPress: async () => {
            setRefreshing(true);
            try {
              await supabase
                .from('place_edit_requests')
                .update({ status: 'rejected' })
                .eq('id', selectedEditRequestId);

              await supabase.from('audit_log').insert({
                admin_id: user?.id,
                action: 'rejected_edit_request',
                target_type: 'place_edit_request',
                target_id: selectedEditRequestId,
              });

              await fetchEditRequests();
              Alert.alert('تم', 'تم رفض التعديل');
            } catch (error) {
              console.error('Reject edit request error:', error);
              Alert.alert('خطأ', 'فشل الرفض');
            } finally {
              setRefreshing(false);
              setSelectedEditRequestId(null);
            }
          },
        },
      ]);
    },
    [user, selectedEditRequestId, fetchEditRequests]
  );

  const getFieldLabel = useCallback((fieldName: string) => {
    const labels: Record<string, string> = {
      name_ar: 'اسم المكان',
      category_ids: 'التصنيفات',
      phone: 'رقم التليفون',
      whatsapp: 'رقم واتساب',
      description_ar: 'الوصف',
      image_url: 'الصورة',
    };
    return labels[fieldName] || fieldName;
  }, []);

  const formatValue = useCallback((value: string, fieldName: string) => {
    if (fieldName === 'category_ids') {
      try {
        const ids = JSON.parse(value);
        return `${ids.length} تصنيف`;
      } catch {
        return value;
      }
    }
    return value || '-';
  }, []);

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `منذ ${diffDays} يوم`;
    }
    return `منذ ${diffHours} ساعة`;
  }, []);

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Skeleton width={150} height={28} borderRadius={4} />
          <Skeleton width={120} height={14} borderRadius={4} />
        </View>
        <View style={styles.statsContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.statCard}>
              <Skeleton width={50} height={32} borderRadius={4} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
        <View style={styles.section}>
          <Skeleton
            width={150}
            height={18}
            borderRadius={4}
            style={{ marginBottom: 12, paddingHorizontal: 16 }}
          />
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, { marginHorizontal: 16, marginBottom: 12 }]}>
              <Skeleton width={200} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
              <Skeleton width={150} height={13} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={fetchData}
          colors={['#1B4332']}
          tintColor="#1B4332"
        />
      }
    >
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
            const category = place.place_categories?.[0]?.category;
            const services = place.place_services || [];

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
            );
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
              {offer.place && <Text style={styles.cardCategory}>🏪 {offer.place.name_ar}</Text>}
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>طلبات التعديل</Text>
          {editRequests.length > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{editRequests.length}</Text>
            </View>
          )}
        </View>

        {editRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد طلبات تعديل</Text>
          </View>
        ) : (
          editRequests.map((request) => (
            <View key={request.id} style={styles.card}>
              <Text style={styles.cardTitle}>{request.place?.name_ar || 'مكان محذوف'}</Text>
              <Text style={styles.cardCategory}>الحقل: {getFieldLabel(request.field_name)}</Text>
              <View style={styles.changeContainer}>
                <View style={styles.changeBox}>
                  <Text style={styles.changeLabel}>القيمة الحالية:</Text>
                  <Text style={styles.changeValue}>
                    {formatValue(request.old_value, request.field_name)}
                  </Text>
                </View>
                <Ionicons name="arrow-back" size={20} color="#1B4332" />
                <View style={styles.changeBox}>
                  <Text style={styles.changeLabel}>القيمة الجديدة:</Text>
                  <Text style={styles.changeValue}>
                    {formatValue(request.new_value, request.field_name)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() =>
                    approveEditRequest(
                      request.id,
                      request.place_id,
                      request.field_name,
                      request.new_value
                    )
                  }
                  disabled={refreshing}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>موافقة</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => rejectEditRequest(request.id)}
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
                style={[styles.banButton, provider.is_banned ? styles.unbanButton : null]}
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

      <PromptModal
        visible={showRejectPlaceModal}
        title="سبب الرفض"
        message="أدخل سبب رفض المكان"
        placeholder="سبب الرفض"
        onSubmit={handleRejectPlaceSubmit}
        onCancel={() => setShowRejectPlaceModal(false)}
      />

      <PromptModal
        visible={showRejectOfferModal}
        title="سبب الرفض"
        message="أدخل سبب رفض العرض"
        placeholder="سبب الرفض"
        onSubmit={handleRejectOfferSubmit}
        onCancel={() => setShowRejectOfferModal(false)}
      />

      <PromptModal
        visible={showRejectEditModal}
        title="سبب الرفض"
        message="أدخل سبب رفض التعديل"
        placeholder="سبب الرفض"
        onSubmit={handleRejectEditSubmit}
        onCancel={() => setShowRejectEditModal(false)}
      />
    </ScrollView>
  );
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
  changeContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 8,
  },
  changeBox: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  changeLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
    color: '#6C757D',
    marginBottom: 4,
  },
  changeValue: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#1A1A1A',
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
});
