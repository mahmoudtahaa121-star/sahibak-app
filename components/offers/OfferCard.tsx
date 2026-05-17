import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { Offer } from '../../types'

interface OfferCardProps {
  offer: Offer
  onPress: () => void
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'بدون تاريخ انتهاء'
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `حتى ${day}/${month}/${year}`
}

export default function OfferCard({ offer, onPress }: OfferCardProps) {
  const placeTypeBadge = offer.place?.place_type === 'shop' ? '🏪 محل' : '👤 شخص'

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        {offer.place?.image_url ? (
          <Image source={{ uri: offer.place.image_url }} style={styles.placeImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>📍</Text>
          </View>
        )}
        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>{offer.place?.name_ar}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{placeTypeBadge}</Text>
          </View>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>🔥 نشط</Text>
        </View>
      </View>

      <View style={styles.offerTitleContainer}>
        <Text style={styles.offerTitle}>{offer.title_ar}</Text>
      </View>

      <Text style={styles.expiry}>⏰ {formatDate(offer.expires_at)}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  placeImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 20,
  },
  placeInfo: {
    flex: 1,
    gap: 4,
  },
  placeName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  badge: {
    backgroundColor: '#F8F9FA',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
    color: '#1A1A1A',
  },
  activeBadge: {
    backgroundColor: '#D4A843',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  offerTitleContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  offerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  expiry: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: '#ADB5BD',
  },
})
