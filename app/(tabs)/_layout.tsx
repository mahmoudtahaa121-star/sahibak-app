import { useMemo } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { StyleSheet } from 'react-native'

const HomeIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
)

const OffersIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <Ionicons name={focused ? 'pricetag' : 'pricetag-outline'} size={24} color={color} />
)

const FavoritesIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
)

const MoreIcon = ({ color, focused }: { color: string; focused: boolean }) => (
  <Ionicons name={focused ? 'menu' : 'menu-outline'} size={24} color={color} />
)

export default function TabLayout() {
  const screenOptions = useMemo(() => ({
    tabBarStyle: styles.tabBar,
    tabBarActiveTintColor: '#1B4332',
    tabBarInactiveTintColor: '#ADB5BD',
    tabBarLabelStyle: styles.tabLabel,
    headerShown: false,
  }), [])

  const indexOptions = useMemo(() => ({
    title: 'الرئيسية',
    tabBarIcon: HomeIcon,
  }), [])

  const offersOptions = useMemo(() => ({
    title: 'العروض',
    tabBarIcon: OffersIcon,
  }), [])

  const favoritesOptions = useMemo(() => ({
    title: 'المفضلة',
    tabBarIcon: FavoritesIcon,
  }), [])

  const moreOptions = useMemo(() => ({
    title: 'المزيد',
    tabBarIcon: MoreIcon,
  }), [])

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="index" options={indexOptions} />
      <Tabs.Screen name="offers" options={offersOptions} />
      <Tabs.Screen name="favorites" options={favoritesOptions} />
      <Tabs.Screen name="more" options={moreOptions} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E9ECEF',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
  },
})
