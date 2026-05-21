import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../../types';
import { useArea } from '../../hooks/useArea';
import { useCategoryPlaces, useCategory } from '../../hooks/useCategoryPlaces';
import PlaceCard from '../../components/place/PlaceCard';
import Skeleton from '../../components/ui/Skeleton';

type FilterType = 'all' | 'shop' | 'person';

export default function CategoryScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedArea } = useArea();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { data: category, isLoading: categoryLoading, refetch: refetchCategory } = useCategory(id);
  const {
    data: places,
    isLoading: placesLoading,
    refetch: refetchPlaces,
  } = useCategoryPlaces(id, selectedArea, filter);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchCategory(), refetchPlaces()]);
    setRefreshing(false);
  }, [refetchCategory, refetchPlaces]);

  const filteredPlaces = places || [];

  if (categoryLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#1B4332" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{category?.icon || '📁'}</Text>
          <Text style={styles.headerTitle}>{category?.name_ar || 'تصنيف'}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            الكل
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'shop' && styles.filterChipActive]}
          onPress={() => setFilter('shop')}
        >
          <Text style={[styles.filterChipText, filter === 'shop' && styles.filterChipTextActive]}>
            محلات
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'person' && styles.filterChipActive]}
          onPress={() => setFilter('person')}
        >
          <Text style={[styles.filterChipText, filter === 'person' && styles.filterChipTextActive]}>
            أشخاص
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredPlaces.length} مكان في {selectedArea}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B4332']}
            tintColor="#1B4332"
          />
        }
      >
        {placesLoading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                width={350}
                height={90}
                borderRadius={14}
                style={styles.skeletonCard}
              />
            ))}
          </View>
        ) : filteredPlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#ADB5BD" />
            <Text style={styles.emptyText}>لا توجد أماكن في هذا التصنيف</Text>
          </View>
        ) : (
          filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onPress={() => router.push(`/place/${place.id}`)}
            />
          ))
        )}
        <View style={styles.footer} />
      </ScrollView>
    </View>
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
  skeletonContainer: {
    gap: 12,
  },
  skeletonCard: {
    width: undefined,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
  },
  filterContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  filterChipActive: {
    backgroundColor: '#1B4332',
    borderColor: '#1B4332',
  },
  filterChipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  countContainer: {
    padding: 16,
    paddingTop: 12,
  },
  countText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 16,
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
