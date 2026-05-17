import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Linking from 'expo-linking'

export default function MoreScreen() {
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

  return (
    <ScrollView style={styles.container}>
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
})
