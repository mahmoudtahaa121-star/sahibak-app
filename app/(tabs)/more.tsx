import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { useAuth } from '../../hooks/useAuth'

export default function MoreScreen() {
  const { user, profile, signOut } = useAuth()

  const handleAbout = () => {
    Alert.alert(
      'عن التطبيق',
      'صاحبك - دليل الخدمات المحلية\nالمنصورية، مصر\nالإصدار 1.0.0',
      [{ text: 'حسناً' }]
    )
  }

  const handleContact = () => {
    Linking.openURL('https://wa.me/201000000000')
  }

  const handleSignOut = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم',
          onPress: async () => {
            await signOut()
            router.replace('/')
          },
        },
      ]
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'user':
        return '👤 مقيم'
      case 'provider':
        return '🏪 صاحب خدمة'
      case 'admin':
        return '🔧 مدير'
      default:
        return ''
    }
  }

  return (
    <ScrollView style={styles.container}>
      {user && profile ? (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#1B4332" />
          </View>
          <Text style={styles.userName}>{profile.full_name || 'مستخدم'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleBadge(profile.role)}</Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#ADB5BD" />
          </View>
          <Text style={styles.welcome}>مرحباً بك</Text>
          <Text style={styles.subtitle}>سجّل دخولك للوصول لكل المميزات</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginButtonText}>تسجيل الدخول / إنشاء حساب</Text>
          </TouchableOpacity>
        </View>
      )}

      {profile?.role === 'provider' && (
        <TouchableOpacity
          style={[styles.menuItem, styles.providerMenuItem]}
          onPress={() => router.push('/provider/dashboard')}
        >
          <Ionicons name="storefront" size={24} color="#D4A843" />
          <Text style={[styles.menuLabel, styles.providerMenuLabel]}>لوحة المزود</Text>
          <Ionicons name="chevron-back" size={20} color="#D4A843" />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)')}>
        <Ionicons name="location" size={24} color="#1B4332" />
        <Text style={styles.menuLabel}>خدمات المنصورية</Text>
        <Ionicons name="chevron-back" size={20} color="#ADB5BD" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/offers')}>
        <Ionicons name="pricetag" size={24} color="#1B4332" />
        <Text style={styles.menuLabel}>العروض</Text>
        <Ionicons name="chevron-back" size={20} color="#ADB5BD" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
        <Ionicons name="information-circle" size={24} color="#1B4332" />
        <Text style={styles.menuLabel}>عن التطبيق</Text>
        <Ionicons name="chevron-back" size={20} color="#ADB5BD" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleContact}>
        <Ionicons name="call" size={24} color="#1B4332" />
        <Text style={styles.menuLabel}>تواصل معنا</Text>
        <Ionicons name="chevron-back" size={20} color="#ADB5BD" />
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcome: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 16,
  },
  userName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#D4A843',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  roleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  signOutButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signOutButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#1A1A1A',
  },
  loginButton: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
  },
  providerMenuItem: {
    backgroundColor: '#FFFBEB',
    borderColor: '#D4A843',
    borderWidth: 1,
  },
  providerMenuLabel: {
    fontFamily: 'Cairo_700Bold',
    color: '#D4A843',
  },
})
