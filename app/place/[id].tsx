import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { supabase } from '../../lib/supabase';
import { Place } from '../../types';
import { logger } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import { usePlace } from '../../hooks/usePlace';
import { useToggleFavorite } from '../../hooks/useFavorites';
import Skeleton from '../../components/ui/Skeleton';
import PromptModal from '../../components/ui/PromptModal';

export default function PlaceScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toggleFavorite = useToggleFavorite();
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const { data: place, isLoading, error } = usePlace(id);

  const { data: isFavorite } = useQuery({
    queryKey: ['favorite', id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('place_id', id)
        .single();
      return !!data;
    },
    enabled: !!user && !!id,
  });

  // Optimistic update helper
  const optimisticToggleFavorite = useCallback(
    async (newFavoriteState: boolean) => {
      if (!user) return;

      // Update cache immediately
      queryClient.setQueryData(['favorite', id, user?.id], newFavoriteState);

      try {
        // Perform the actual API call
        if (newFavoriteState) {
          const { error } = await supabase
            .from('favorites')
            .insert({ user_id: user.id, place_id: id });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', user.id)
            .eq('place_id', id);
          if (error) throw error;
        }

        // Invalidate to ensure cache is in sync
        queryClient.invalidateQueries({ queryKey: ['favorite', id, user?.id] });
      } catch (error) {
        // Revert on error
        logger.error('Favorite toggle error', { error, placeId: id, userId: user?.id });
        queryClient.setQueryData(['favorite', id, user?.id], !newFavoriteState);
        throw error;
      }
    },
    [user, id, queryClient]
  );

  const handleWhatsApp = useCallback(() => {
    if (place?.whatsapp) {
      // Remove leading 0 if present and add Egyptian country code
      const cleanedNumber = place.whatsapp.replace(/^0/, '');
      Linking.openURL(`https://wa.me/20${cleanedNumber}`);
    }
  }, [place?.whatsapp]);

  const handleCall = useCallback(() => {
    if (place?.phone) {
      Linking.openURL(`tel:${place.phone}`);
    }
  }, [place?.phone]);

  const handleShare = useCallback(async () => {
    if (place) {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (Platform.OS !== 'web' && isAvailable) {
          await Sharing.shareAsync(`${place.name_ar}\n${place.phone}\nعبر صاحبك`);
        } else {
          Alert.alert('غير متاح', 'مشاركة الروابط غير متاحة على هذا المنصة');
        }
      } catch (error) {
        logger.error('Share error', { error, placeId: id });
        // Share failed - user cancelled or error occurred (silent is OK here)
      }
    }
  }, [place]);

  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    setFavoriteLoading(true);

    // If removing from favorites, show confirmation
    if (isFavorite) {
      Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المكان من المفضلة؟', [
        {
          text: 'إلغاء',
          style: 'cancel',
          onPress: () => setFavoriteLoading(false),
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await optimisticToggleFavorite(false);
              Alert.alert('تم', 'تم حذف المكان من المفضلة');
            } catch (error) {
              logger.error('Favorite removal error', { error, placeId: id });
              Alert.alert('خطأ', 'حدث خطأ أثناء حذف المفضلة. يرجى المحاولة مرة أخرى');
            } finally {
              setFavoriteLoading(false);
            }
          },
        },
      ]);
      return;
    }

    // Adding to favorites - no confirmation needed
    try {
      await optimisticToggleFavorite(true);
      Alert.alert('تم', 'تمت إضافة المكان إلى المفضلة');
    } catch (error) {
      logger.error('Favorite addition error', { error, placeId: id });
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المفضلة. يرجى المحاولة مرة أخرى');
    } finally {
      setFavoriteLoading(false);
    }
  }, [user, isFavorite, optimisticToggleFavorite]);

  const handleReport = useCallback(() => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    setShowReportModal(true);
  }, [user]);

  const handleReportSubmit = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) {
        Alert.alert('خطأ', 'الرجاء كتابة سبب الإبلاغ');
        return;
      }

      if (text && place) {
        Alert.alert('تأكيد الإرسال', 'هل أنت متأكد من إرسال هذا البلاغ؟', [
          {
            text: 'إلغاء',
            style: 'cancel',
          },
          {
            text: 'إرسال',
            onPress: async () => {
              if (!user) return;

              try {
                const { error } = await supabase.from('reports').insert({
                  place_id: place.id,
                  user_id: user.id,
                  reason: text.trim(),
                });

                if (error) throw error;

                Alert.alert('شكراً', 'تم إرسال بلاغك بنجاح');
              } catch (error) {
                logger.error('Report submission error', { error, placeId: id, reason: text });
                Alert.alert('خطأ', 'حدث خطأ أثناء إرسال البلاغ. يرجى المحاولة مرة أخرى');
              }
            },
          },
        ]);
      }
    },
    [place, user]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={{ width: 24 }} />
          <Skeleton width={150} height={20} borderRadius={4} />
          <View style={{ width: 24 }} />
        </View>
        <View style={{ width: '100%' }}>
          <Skeleton width={350} height={200} />
        </View>
        <View style={styles.infoCard}>
          <Skeleton width={200} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
          <Skeleton width={180} height={16} borderRadius={4} />
        </View>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>حدث خطأ في تحميل المكان</Text>
      </View>
    );
  }

  const category = place.categories?.[0];
  const placeTypeBadge = place.place_type === 'shop' ? '🏪 محل' : '👤 شخص';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-forward" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{place.name_ar}</Text>
          <TouchableOpacity onPress={handleToggleFavorite} disabled={favoriteLoading}>
            {favoriteLoading ? (
              <ActivityIndicator size={24} color="#1B4332" />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#EF4444' : '#1A1A1A'}
              />
            )}
          </TouchableOpacity>
        </View>

        {place.image_url ? (
          <Image source={{ uri: place.image_url }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverEmoji}>{category?.icon || '📍'}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.placeName}>{place.name_ar}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{placeTypeBadge}</Text>
          </View>
          {category && (
            <Text style={styles.categoryText}>
              {category.icon} {category.name_ar}
            </Text>
          )}
          {place.address_text && <Text style={styles.addressText}>📍 {place.address_text}</Text>}
          {place.description_ar && <Text style={styles.description}>{place.description_ar}</Text>}
        </View>

        {place.latitude && place.longitude && (
          <TouchableOpacity
            style={{
              height: 160,
              backgroundColor: '#F8F9FA',
              borderRadius: 12,
              marginHorizontal: 14,
              marginBottom: 8,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E9ECEF',
            }}
            onPress={() => {
              const url = `https://maps.google.com/?q=${place.latitude},${place.longitude}`;
              Linking.openURL(url);
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>🗺</Text>
            <Text style={{ fontFamily: 'Cairo', fontSize: 13, color: '#6C757D' }}>
              افتح في خرائط جوجل
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.contactCard}>
          <TouchableOpacity style={styles.whatsappButton} onPress={handleWhatsApp}>
            <Text style={styles.whatsappButtonText}>💬 تواصل على واتساب</Text>
          </TouchableOpacity>
          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Text style={styles.contactButtonText}>📞 اتصال</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactButton} onPress={handleShare}>
              <Text style={styles.contactButtonText}>↗ مشاركة</Text>
            </TouchableOpacity>
          </View>
        </View>

        {place.services && place.services.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🛠 الخدمات المتاحة</Text>
            {place.services.map((service, index) => (
              <View key={service.id}>
                <View style={styles.serviceItem}>
                  <View style={styles.bullet} />
                  <View style={styles.serviceContent}>
                    <Text style={styles.serviceName}>{service.name_ar}</Text>
                    {service.description_ar && (
                      <Text style={styles.serviceDescription}>{service.description_ar}</Text>
                    )}
                  </View>
                </View>
                {index < (place.services?.length ?? 0) - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {place.offers && place.offers.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🎁 العروض الحالية</Text>
            {place.offers.map((offer) => (
              <View key={offer.id} style={styles.offerItem}>
                <Text style={styles.offerTitle}>{offer.title_ar}</Text>
                {offer.expires_at && (
                  <Text style={styles.offerExpiry}>
                    ⏰ حتى {new Date(offer.expires_at).toLocaleDateString('ar-EG')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
          <Text style={styles.reportButtonText}>🚩 بلّغ عن خطأ في المعلومات</Text>
        </TouchableOpacity>
      </ScrollView>

      <PromptModal
        visible={showReportModal}
        title="بلّغ عن خطأ"
        message="اكتب سبب الإبلاغ"
        placeholder="سبب الإبلاغ"
        onSubmit={handleReportSubmit}
        onCancel={() => setShowReportModal(false)}
      />
    </View>
  );
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
    backgroundColor: '#F8F9FA',
  },
  errorText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmoji: {
    fontSize: 48,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  placeName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#1A1A1A',
  },
  categoryText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 4,
  },
  addressText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#3C3C43',
    lineHeight: 22,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 8,
  },
  whatsappButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsappButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row-reverse',
    gap: 10,
    paddingVertical: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1B4332',
    marginTop: 6,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  serviceDescription: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#6C757D',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 4,
  },
  offerItem: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  offerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#E65100',
    marginBottom: 4,
  },
  offerExpiry: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: '#8E8E93',
  },
  reportButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#ADB5BD',
  },
});
