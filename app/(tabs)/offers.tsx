import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useArea } from '../../hooks/useArea'
import { useOffers } from '../../hooks/useOffers'
import OfferCard from '../../components/offers/OfferCard'
import Skeleton from '../../components/ui/Skeleton'

export default function OffersScreen() {
  const { selectedArea } = useArea()
  const { data: offers, isLoading } = useOffers(selectedArea)

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🔥 عروض المنصورية</Text>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#1A1A1A',
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingTop: 0,
  },
  skeletonContainer: {
    gap: 10,
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
