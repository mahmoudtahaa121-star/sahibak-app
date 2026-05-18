import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Place } from '../../types'
import { useArea } from '../../hooks/useArea'
import PlaceCard from '../../components/place/PlaceCard'

type FilterType = 'all' | 'shop' | 'person'

export default function AllPlacesScreen() {
  const { selectedArea } = useArea()
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: places, isLoading } = useQuery({
    queryKey: ['all-places', selectedArea, filter],
    queryFn: async () => {
      let query = supabase
        .from('places')
        .select('*, place_categories(category:categories(*)), place_services(id, name_ar, description_ar)')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .eq('area', selectedArea)

      if (filter !== 'all') {
        query = query.eq('place_type', filter)
      }

      const { data, error } = await query

      if (error) throw error

      return data as Place[]
    },
  })

  const filteredPlaces = places || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>جميع الأماكن</Text>
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

      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#1B4332" />
          </View>
        ) : filteredPlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color="#ADB5BD" />
            <Text style={styles.emptyText}>لا توجد أماكن</Text>
          </View>
        ) : (
          filteredPlaces.map((place: Place) => (
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingVertical: 16,
    paddingHorizontal: 16,
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
})
