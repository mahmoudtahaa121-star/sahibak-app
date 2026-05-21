import { useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { isValidEgyptianPhone, isValidPassword, isValidEmail } from '../../utils/validation';
import { logger } from '../../utils/logger';

type Role = 'user' | 'provider';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    // Redirect to the intended page or home if not specified
    const targetPath = redirect || '/';
    router.replace(targetPath);
  };

  const handleRegister = async () => {
    if (!role) {
      Alert.alert('خطأ', 'الرجاء اختيار نوع الحساب');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم الكامل');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }
    if (!isValidEgyptianPhone(phone.trim())) {
      Alert.alert('خطأ', 'رقم الهاتف غير صالح. يجب أن يكون رقم هاتف مصري صحيح');
      return;
    }
    if (!email.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني');
      return;
    }
    if (!isValidEmail(email.trim())) {
      Alert.alert('خطأ', 'البريد الإلكتروني غير صالح');
      return;
    }
    if (!password) {
      Alert.alert('خطأ', 'الرجاء إدخال كلمة المرور');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على أرقام وحروف');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Sign Up with metadata to store role and phone temporarily
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role,
          },
        },
      });

      if (authError) {
        logger.authError('signup', authError);
        Alert.alert('خطأ', `فشل التسجيل: ${authError.message}`);
        return;
      }

      const user = authData?.user;
      const session = authData?.session;

      if (!user) {
        Alert.alert('خطأ', 'لم يتم إنشاء المستخدم');
        return;
      }

      // 2️⃣ If session exists (email confirmation disabled), upsert profile
      // (handle_new_user trigger may have already created it — upsert is safe either way)
      if (session) {
        try {
          const { error: profileError } = await supabase.from('profiles').upsert(
            {
              id: user.id,
              full_name: fullName.trim(),
              phone: phone.trim(),
              role,
              is_banned: false,
              warning_count: 0,
              ban_reason: null,
              banned_at: null,
            },
            { onConflict: 'id' }
          );

          if (profileError) {
            logger.supabaseError('upsertProfile', profileError, { userId: authData?.user?.id });

            // Try insert instead if upsert fails
            const { error: insertError } = await supabase.from('profiles').insert({
              id: user.id,
              full_name: fullName.trim(),
              phone: phone.trim(),
              role,
              is_banned: false,
              warning_count: 0,
              ban_reason: null,
              banned_at: null,
            });

            if (insertError) {
              logger.supabaseError('insertProfile', insertError, { userId: authData?.user?.id });
              Alert.alert('خطأ', `فشل إنشاء الملف الشخصي: ${insertError.message}`);
              return;
            }
          }

          Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح!', [
            {
              text: 'حسناً',
              onPress: () => router.replace(redirect || '/'),
            },
          ]);
        } catch (error) {
          logger.error('Profile creation error', { error, userId: authData?.user?.id });
          Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الملف الشخصي');
          return;
        }
      } else {
        // 3️⃣ No session (email confirmation required) - profile will be created on first login
        Alert.alert('نجاح', 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد التسجيل', [
          {
            text: 'حسناً',
            onPress: () =>
              router.replace({
                pathname: '/auth/login',
                params: redirect ? { redirect } : undefined,
              }),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          {redirect && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="chevron-forward" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          )}
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
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#ADB5BD"
              style={styles.inputIcon}
            />
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

        <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
          <Text style={styles.loginLinkText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
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
    gap: 24,
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
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
});
