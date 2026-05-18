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
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'

WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const ensureProfileExists = async (userId: string, email: string, fullName?: string) => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()

    if (!existingProfile) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: fullName || email.split('@')[0],
        phone: '',
        role: 'user',
        is_banned: false,
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
      }
    }
  }

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني')
      return
    }
    if (!password) {
      Alert.alert('خطأ', 'الرجاء إدخال كلمة المرور')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        Alert.alert('خطأ في تسجيل الدخول', 'البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else if (data.user) {
        await ensureProfileExists(data.user.id, data.user.email || '', data.user.user_metadata?.full_name)
        router.replace('/')
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const redirectUrl = AuthSession.makeRedirectUrl({
        scheme: 'sahibak2',
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
        },
      })

      if (error) {
        Alert.alert('خطأ', 'فشل تسجيل الدخول عبر جوجل')
        setLoading(false)
        return
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

        if (result.type === 'success') {
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData.session?.user) {
            await ensureProfileExists(
              sessionData.session.user.id,
              sessionData.session.user.email || '',
              sessionData.session.user.user_metadata?.full_name
            )
            router.replace('/')
          }
        }
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
          <Text style={styles.subtitle}>تسجيل الدخول</Text>
        </View>

        <View style={styles.form}>
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
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>تسجيل الدخول</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={loading}
          >
            <Ionicons name="logo-google" size={20} color="#1A1A1A" />
            <Text style={styles.googleButtonText}>تسجيل الدخول بجوجل</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={styles.registerText}>ليس لديك حساب؟</Text>
          <Text style={styles.registerLinkText}>إنشاء حساب جديد</Text>
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
    marginBottom: 40,
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
    gap: 16,
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
  googleButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  googleButtonText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  registerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 4,
  },
  registerText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
  },
  registerLinkText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#1B4332',
  },
})

