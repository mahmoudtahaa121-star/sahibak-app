import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'
import { useAuth } from '../../hooks/useAuth'

export default function MoreScreen() {
  const { user, profile, signOut } = useAuth()
  const [showAboutModal, setShowAboutModal] = useState(false)

  const handleAbout = () => {
    setShowAboutModal(true)
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
    <View>
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

        {profile?.role === 'admin' && (
          <TouchableOpacity
            style={[styles.menuItem, styles.adminMenuItem]}
            onPress={() => router.push('/admin/dashboard')}
          >
            <Ionicons name="shield" size={24} color="#FFFFFF" />
            <Text style={[styles.menuLabel, styles.adminMenuLabel]}>لوحة الإدارة</Text>
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
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

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/')}>
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

      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAboutModal(false)}
        >
          <View style={styles.aboutModalContent}>
            <Text style={styles.appName}>صاحبك</Text>
            <Text style={styles.version}>الإصدار 1.0.0</Text>
            <Text style={styles.description}>دليلك للخدمات المحلية في المنصورية</Text>
            <Text style={styles.loveText}>تم التطوير بـ ❤️ للمنصورية</Text>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.closeModalButtonText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  adminMenuItem: {
    backgroundColor: '#1B4332',
  },
  adminMenuLabel: {
    fontFamily: 'Cairo_700Bold',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    margin: 40,
    gap: 12,
  },
  appName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 32,
    color: '#1B4332',
    marginBottom: 4,
  },
  version: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  loveText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  closeModalButton: {
    backgroundColor: '#1B4332',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  closeModalButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
})
