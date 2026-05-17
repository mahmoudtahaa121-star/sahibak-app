import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'

type Role = 'user' | 'provider'

export default function RegisterScreen() {
  const [role, setRole] = useState<Role | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!role) {
      Alert.alert('خطأ', 'الرجاء اختيار نوع الحساب')
      return
    }
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم الكامل')
      return
    }
    if (!phone.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف')
      return
    }
    if (!email.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني')
      return
    }
    if (!password) {
      Alert.alert('خطأ', 'الرجاء إدخال كلمة المرور')
      return
    }
    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (authError) {
        Alert.alert('خطأ', authError.message)
        return
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          full_name: fullName.trim(),
          phone: phone.trim(),
          role,
          is_banned: false,
        })

        if (profileError) {
          Alert.alert('خطأ', 'فشل إنشاء الملف الشخصي')
          return
        }

        Alert.alert('نجاح', 'تم إنشاء الحساب! تحقق من بريدك', [
          {
            text: 'حسناً',
            onPress: () => router.replace('/auth/login'),
          },
        ])
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.logo}>صاحبك</Text>
          <Text style={styles.subtitle}>إنشاء حساب جديد</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>نوع الحساب</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, role === 'user' && styles.roleButtonActive]}
              onPress={() => setRole('user')}
            >
              <Text style={styles.roleEmoji}>👤</Text>
              <Text style={[styles.roleText, role === 'user' && styles.roleTextActive]}>
                مقيم / زائر
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, role === 'provider' && styles.roleButtonActive]}
              onPress={() => setRole('provider')}
            >
              <Text style={styles.roleEmoji}>🏪</Text>
              <Text style={[styles.roleText, role === 'provider' && styles.roleTextActive]}>
                صاحب خدمة
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>المعلومات الشخصية</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#ADB5BD" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="الاسم الكامل"
              placeholderTextColor="#ADB5BD"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#ADB5BD" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="رقم الهاتف"
              placeholderTextColor="#ADB5BD"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#ADB5BD" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              placeholderTextColor="#ADB5BD"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#ADB5BD" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              placeholderTextColor="#ADB5BD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>إنشاء الحساب</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
          <Text style={styles.loginLinkText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 48,
    color: '#1B4332',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 18,
    color: '#6C757D',
  },
  form: {
    gap: 20,
  },
  sectionTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#1B4332',
    borderColor: '#1B4332',
  },
  roleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  roleText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#6C757D',
  },
  roleTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
  },
  primaryButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  loginText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  loginLinkText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#1B4332',
  },
})

