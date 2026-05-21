import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../../types';

interface PlaceCardProps {
  place: Place;
  onPress: () => void;
  onRemoveFavorite?: () => void;
}

export default function PlaceCard({ place, onPress, onRemoveFavorite }: PlaceCardProps) {
  const category = place.categories?.[0];
  const placeTypeBadge = place.place_type === 'shop' ? '🏪 محل' : '👤 شخص';
  const badgeBg = place.place_type === 'shop' ? '#F8F9FA' : '#F5E6C0';
  const badgeText = place.place_type === 'shop' ? '#1B4332' : '#856404';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {place.image_url ? (
        <Image source={{ uri: place.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.emoji}>{category?.icon || '📍'}</Text>
        </View>
      )}

      <View style={styles.middle}>
        <View style={styles.row1}>
          <Text style={styles.name}>{place.name_ar}</Text>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeText }]}>{placeTypeBadge}</Text>
          </View>
        </View>

        <Text style={styles.row2} numberOfLines={1}>
          {category?.icon} {category?.name_ar} · {place.address_text}
        </Text>

        <View style={styles.serviceChips}>
          {place.services?.slice(0, 3).map((service) => (
            <View key={service.id} style={styles.chip}>
              <Text style={styles.chipText}>{service.name_ar}</Text>
            </View>
          ))}
          {place.services && place.services.length > 3 && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>+{place.services.length - 3}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {onRemoveFavorite && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemoveFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="heart" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={20} color="#ADB5BD" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  middle: {
    flex: 1,
    gap: 4,
  },
  row1: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
  },
  row2: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: '#6C757D',
  },
  serviceChips: {
    flexDirection: 'row-reverse',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    color: '#1A1A1A',
  },
  likesText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    color: '#6C757D',
  },
  rightSection: {
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
});
