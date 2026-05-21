import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { News } from '../../types';

interface NewsCardProps {
  news: News;
  onPress: () => void;
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 60) {
    return `منذ ${diffMins} دقيقة`;
  } else if (diffHours < 24) {
    return `منذ ${diffHours} ساعة`;
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

function isNew(dateString: string): boolean {
  const now = new Date();
  const date = new Date(dateString);
  const diffHours = Math.floor((now.getTime() - date.getTime()) / 3600000);
  return diffHours < 24;
}

export default function NewsCard({ news, onPress }: NewsCardProps) {
  const timeAgo = getTimeAgo(news.created_at);
  const isNewItem = isNew(news.created_at);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.badgesContainer}>
        {isNewItem && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>جديد ✨</Text>
          </View>
        )}
        {news.is_pinned && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>📌 مثبت</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {news.title_ar}
      </Text>

      <Text style={styles.time}>{timeAgo}</Text>

      <View style={styles.overlay} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    backgroundColor: '#1B4332',
    borderRadius: 14,
    padding: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  badgesContainer: {
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#D4A843',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  title: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 21,
    marginBottom: 8,
  },
  time: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(45, 106, 79, 0.4)',
  },
});
