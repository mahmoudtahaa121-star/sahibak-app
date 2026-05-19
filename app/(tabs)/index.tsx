import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import NetInfo from '@react-native-community/netinfo'
import { useArea } from '../../hooks/useArea'
import { useNews } from '../../hooks/useNews'
import { useParentCategories, useChildCategories } from '../../hooks/useCategories'
import { usePlaces } from '../../hooks/usePlaces'
import { useOffers } from '../../hooks/useOffers'
import PlaceCard from '../../components/place/PlaceCard'
import NewsCard from '../../components/news/NewsCard'
import Skeleton from '../../components/ui/Skeleton'
import { Category, Place, News } from '../../types'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { selectedArea, availableAreas, setSelectedArea } = useArea()
  const { data: news, isLoading: newsLoading, refetch: refetchNews } = useNews()
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useParentCategories()
  const { data: places, isLoading: placesLoading, error: placesError, refetch: refetchPlaces } = usePlaces(selectedArea)
  const { data: offers, refetch: refetchOffers } = useOffers(selectedArea)
  const [isConnected, setIsConnected] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [showAreaModal, setShowAreaModal] = useState(false)
  const [showNewsModal, setShowNewsModal] = useState(false)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const activeOffersCount = useMemo(() => offers?.length || 0, [offers])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true)
    })
    return () => unsubscribe()
  }, [])

  const filteredPlaces = useMemo(() => {
    return places?.filter((place: Place) => {
      if (searchQuery.length <= 1) return true
      const query = searchQuery.toLowerCase()
      return (
        place.name_ar.includes(query) ||
        place.services?.some((s) =>
          s.name_ar.includes(query) || s.description_ar?.includes(query)
        )
      )
    }) || []
  }, [places, searchQuery])

  const handleCategoryPress = useCallback((category: Category) => {
    setSelectedCategory(category)
  }, [])

  const handleChildCategoryPress = useCallback((childId: number) => {
    setSelectedCategory(null)
    router.push(`/category/${childId}`)
  }, [])

  const handlePlacePress = useCallback((placeId: string) => {
    router.push(`/place/${placeId}`)
  }, [])

  const handleNewsPress = useCallback((newsItem: News) => {
    setSelectedNews(newsItem)
    setShowNewsModal(true)
  }, [])

  const handleOffersPress = useCallback(() => {
    router.push('/offers')
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        refetchNews(),
        refetchCategories(),
        refetchPlaces(),
        refetchOffers(),
      ])
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setRefreshing(false)
    }
  }, [refetchNews, refetchCategories, refetchPlaces, refetchOffers])

  const isSearching = searchQuery.length > 1

  return (
    <View style={styles.container}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>📵 أنت غير متصل — عرض بيانات محفوظة</Text>
        </View>
      )}

      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>صاحبك</Text>
        {availableAreas.length === 1 ? (
          <Text style={styles.areaText}>{selectedArea}</Text>
        ) : (
          <TouchableOpacity
            style={styles.areaButton}
            onPress={() => setShowAreaModal(true)}
          >
            <Text style={styles.areaText}>{selectedArea} ▾</Text>
          </TouchableOpacity>
        )}
        <Ionicons name="notifications-outline" size={22} color="#6C757D" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1B4332']}
            tintColor="#1B4332"
          />
        }
      >
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#D4A843" />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في المنصورية..."
            placeholderTextColor="#ADB5BD"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isSearching ? (
          <View style={styles.searchResults}>
            {filteredPlaces.length === 0 ? (
              <Text style={styles.noResults}>لا توجد نتائج</Text>
            ) : (
              filteredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  onPress={() => handlePlacePress(place.id)}
                />
              ))
            )}
          </View>
        ) : !places || places.length === 0 ? (
          <View style={styles.searchSuggestions}>
            <Text style={styles.suggestionsTitle}>ابحث عن أي خدمة في المنصورية</Text>
            <View style={styles.suggestionChips}>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => router.push('/category/1')}
              >
                <Text style={styles.suggestionChipText}>🍽️ مطاعم</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => router.push('/category/2')}
              >
                <Text style={styles.suggestionChipText}>👨‍⚕️ أطباء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => router.push('/category/3')}
              >
                <Text style={styles.suggestionChipText}>🔧 سباكة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionChip}
                onPress={() => router.push('/category/4')}
              >
                <Text style={styles.suggestionChipText}>⚡ كهرباء</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {news && news.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📰 أخبار المنصورية</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.newsScroll}
                >
                  {news.map((item) => (
                    <NewsCard
                      key={item.id}
                      news={item}
                      onPress={() => handleNewsPress(item)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>الكاتيجوريز</Text>
                <TouchableOpacity onPress={() => router.push('/category/all')}>
                  <Text style={styles.seeAll}>الكل ›</Text>
                </TouchableOpacity>
              </View>

              {categoriesLoading ? (
                <View style={styles.categoriesSkeleton}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} width={72} height={72} borderRadius={20} />
                  ))}
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScroll}
                >
                  {categories?.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={styles.categoryCard}
                      onPress={() => handleCategoryPress(category)}
                    >
                      <Text style={styles.categoryIcon}>{category.icon}</Text>
                      <Text style={styles.categoryName}>{category.name_ar}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {activeOffersCount > 0 && (
              <TouchableOpacity
                style={styles.offersBanner}
                onPress={handleOffersPress}
              >
                <Text style={styles.offersText}>🔥 عروض دلوقتي</Text>
                <View style={styles.offersBadge}>
                  <Text style={styles.offersBadgeText}>{activeOffersCount} عرض</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>أماكن قريبة منك</Text>
                {/* TODO: Implement /places/all screen */}
                {/* <TouchableOpacity onPress={() => router.push('/places/all')}>
                  <Text style={styles.seeAll}>الكل ›</Text>
                </TouchableOpacity> */}
              </View>

              {placesLoading ? (
                <View style={styles.placesSkeleton}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} width={350} height={90} borderRadius={14} style={styles.skeletonCard} />
                  ))}
                </View>
              ) : placesError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>حدث خطأ في التحميل</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => refetchPlaces()}>
                    <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
                  </TouchableOpacity>
                </View>
              ) : places && places.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🏘</Text>
                  <Text style={styles.emptyTitle}>لا توجد خدمات بعد</Text>
                  <Text style={styles.emptySubtitle}>
                    كن أول من يضيف خدمة في {selectedArea}
                  </Text>
                </View>
              ) : (
                <View style={styles.placesList}>
                  {places?.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onPress={() => handlePlacePress(place.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showAreaModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAreaModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAreaModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>اختر المنطقة</Text>
            {availableAreas.map((area) => (
              <TouchableOpacity
                key={area}
                style={styles.modalItem}
                onPress={() => {
                  setSelectedArea(area)
                  setShowAreaModal(false)
                }}
              >
                <Text style={styles.modalItemText}>{area}</Text>
                {selectedArea === area && (
                  <Ionicons name="checkmark" size={20} color="#1B4332" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showNewsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNewsModal(false)}
        >
          <View style={styles.newsModalContent}>
            <Text style={styles.newsModalTitle}>{selectedNews?.title_ar}</Text>
            {selectedNews?.body_ar && (
              <Text style={styles.newsModalBody}>{selectedNews.body_ar}</Text>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowNewsModal(false)}
            >
              <Text style={styles.closeButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!selectedCategory}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCategory(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedCategory(null)}
        >
          <View style={styles.bottomSheet}>
            <Text style={styles.bottomSheetTitle}>{selectedCategory?.name_ar}</Text>
            <View style={styles.childCategoriesGrid}>
              {selectedCategory && (
                <ChildCategories parentId={selectedCategory.id} onSelect={handleChildCategoryPress} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

function ChildCategories({ parentId, onSelect }: { parentId: number; onSelect: (id: number) => void }) {
  const { data: children, isLoading } = useChildCategories(parentId)

  if (isLoading) {
    return (
      <View style={styles.childCategoriesGrid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} width={80} height={80} borderRadius={12} />
        ))}
      </View>
    )
  }

  if (!children || children.length === 0) {
    return <Text style={styles.noChildren}>لا توجد فئات فرعية</Text>
  }

  return (
    <>
      {children.map((child) => (
        <TouchableOpacity
          key={child.id}
          style={styles.childCategoryCard}
          onPress={() => onSelect(child.id)}
        >
          <Text style={styles.childCategoryIcon}>{child.icon}</Text>
          <Text style={styles.childCategoryName}>{child.name_ar}</Text>
        </TouchableOpacity>
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  offlineText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#1B4332',
  },
  areaText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
  },
  areaButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    margin: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#1A1A1A',
  },
  searchResults: {
    paddingHorizontal: 16,
    gap: 12,
  },
  noResults: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    paddingVertical: 20,
  },
  searchSuggestions: {
    padding: 16,
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 16,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  suggestionChipText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  section: {
    marginTop: 20,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#1A1A1A',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  seeAll: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#1B4332',
  },
  newsScroll: {
    gap: 10,
    paddingHorizontal: 16,
  },
  categoriesSkeleton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  categoriesScroll: {
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    width: 72,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 26,
  },
  categoryName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  offersBanner: {
    backgroundColor: '#D4A843',
    borderRadius: 14,
    padding: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  offersText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  offersBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offersBadgeText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    color: '#1B4332',
  },
  placesSkeleton: {
    gap: 12,
    paddingHorizontal: 16,
  },
  skeletonCard: {
    width: undefined,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
    textAlign: 'center',
  },
  placesList: {
    gap: 12,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalItemText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: '#1A1A1A',
  },
  newsModalContent: {
    backgroundColor: '#FFFFFF',
    margin: 40,
    borderRadius: 16,
    padding: 20,
  },
  newsModalTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  newsModalBody: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 22,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  bottomSheetTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  childCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  childCategoryCard: {
    width: '30%',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  childCategoryIcon: {
    fontSize: 24,
  },
  childCategoryName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  noChildren: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    paddingVertical: 20,
  },
})
