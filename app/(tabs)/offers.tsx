import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useArea } from '../../hooks/useArea'
import { useOffers } from '../../hooks/useOffers'
import OfferCard from '../../components/offers/OfferCard'
import Skeleton from '../../components/ui/Skeleton'

export default function OffersScreen() {
  const insets = useSafeAreaInsets()
  const { selectedArea } = useArea()
  const { data: offers, isLoading, refetch } = useOffers(selectedArea)
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerText}>🔥 عروض المنصورية</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B4332']}
            tintColor="#1B4332"
          />
        }
      >
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} width={350} height={120} borderRadius={14} style={styles.skeletonCard} />
            ))}
          </View>
        ) : offers && offers.length > 0 ? (
          offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onPress={() => router.push(`/place/${offer.place_id}`)}
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد عروض حالياً 🎁</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
  },
  skeletonContainer: {
    gap: 12,
  },
  skeletonCard: {
    width: undefined,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
})
