import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Category } from '../../types'

type Step = 1 | 2 | 3 | 4
type PlaceType = 'shop' | 'person'

interface Service {
  id: string
  name_ar: string
  description_ar: string
}

export default function AddPlaceScreen() {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedParent, setSelectedParent] = useState<Category | null>(null)
  
  const [placeType, setPlaceType] = useState<PlaceType | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [nameAr, setNameAr] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [addressText, setAddressText] = useState('')
  const [services, setServices] = useState<Service[]>([
    { id: '1', name_ar: '', description_ar: '' }
  ])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('parent_id', null)
      .eq('is_active', true)
      .order('sort_order')

    if (data && !error) {
      setCategories(data)
    }
  }

  const fetchChildCategories = async (parentId: number) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('is_active', true)
      .order('sort_order')

    if (data && !error) {
      setSelectedParent({ ...selectedParent!, children: data } as any)
    }
  }

  const handleParentSelect = (category: Category) => {
    setSelectedParent(category)
    fetchChildCategories(category.id)
  }

  const handleCategoryToggle = (categoryId: number) => {
    const maxSelection = placeType === 'person' ? 2 : 1
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId))
    } else if (selectedCategories.length < maxSelection) {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const addService = () => {
    setServices([...services, { id: Date.now().toString(), name_ar: '', description_ar: '' }])
  }

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter(s => s.id !== id))
    }
  }

  const updateService = (id: string, field: keyof Service, value: string) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const validateStep1 = () => {
    if (!placeType) {
      Alert.alert('خطأ', 'الرجاء اختيار نوع المكان')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    const minSelection = placeType === 'person' ? 1 : 1
    if (selectedCategories.length < minSelection) {
      Alert.alert('خطأ', placeType === 'person' ? 'الرجاء اختيار تصنيف واحد على الأقل' : 'الرجاء اختيار تصنيف')
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!nameAr.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال اسم المكان')
      return false
    }
    if (!phone.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم التليفون')
      return false
    }
    if (placeType === 'shop' && !addressText.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال العنوان')
      return false
    }
    return true
  }

  const validateStep4 = () => {
    const validServices = services.filter(s => s.name_ar.trim())
    if (validServices.length === 0) {
      Alert.alert('خطأ', 'الرجاء إضافة خدمة واحدة على الأقل')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: placeData, error: placeError } = await supabase
        .from('places')
        .insert({
          provider_id: user.id,
          area: 'المنصورية',
          place_type: placeType,
          name_ar: nameAr.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || null,
          description_ar: descriptionAr.trim() || null,
          address_text: placeType === 'shop' ? addressText.trim() : null,
          status: 'pending',
        })
        .select()
        .single()

      if (placeError) throw placeError

      const placeId = placeData.id

      for (const categoryId of selectedCategories) {
        await supabase.from('place_categories').insert({
          place_id: placeId,
          category_id: categoryId,
        })
      }

      const validServices = services.filter(s => s.name_ar.trim())
      for (const service of validServices) {
        await supabase.from('place_services').insert({
          place_id: placeId,
          name_ar: service.name_ar.trim(),
          description_ar: service.description_ar.trim() || null,
        })
      }

      Alert.alert(
        'تم الإرسال',
        'تم إرسال طلبك للمراجعة! سيتم الرد خلال 24 ساعة',
        [{ text: 'حسناً', onPress: () => router.replace('/provider/dashboard') }]
      )
    } catch (error) {
      Alert.alert('خطأ', 'فشل إرسال الطلب')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
    else if (step === 3 && validateStep3()) setStep(4)
    else if (step === 4 && validateStep4()) handleSubmit()
  }

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>نوع المكان</Text>
      <Text style={styles.stepSubtitle}>اختر نوع المكان الذي تريد إضافته</Text>

      <TouchableOpacity
        style={[
          styles.typeCard,
          placeType === 'shop' && styles.typeCardSelected,
        ]}
        onPress={() => setPlaceType('shop')}
      >
        <Text style={styles.typeEmoji}>🏪</Text>
        <Text style={styles.typeName}>محل أو مكان</Text>
        {placeType === 'shop' && (
          <Ionicons name="checkmark-circle" size={24} color="#1B4332" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeCard,
          placeType === 'person' && styles.typeCardSelected,
        ]}
        onPress={() => setPlaceType('person')}
      >
        <Text style={styles.typeEmoji}>👤</Text>
        <Text style={styles.typeName}>شخص / مهنة</Text>
        {placeType === 'person' && (
          <Ionicons name="checkmark-circle" size={24} color="#1B4332" />
        )}
      </TouchableOpacity>
    </View>
  )

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>التصنيف</Text>
      <Text style={styles.stepSubtitle}>
        اختر التصنيف المناسب {placeType === 'person' ? '(يمكن اختيار تصنيفين)' : '(تصنيف واحد)'}
      </Text>

      {!selectedParent ? (
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleParentSelect(category)}
            >
              <Text style={styles.categoryEmoji}>{category.icon || '📁'}</Text>
              <Text style={styles.categoryName}>{category.name_ar}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedParent(null)}
          >
            <Ionicons name="chevron-back" size={20} color="#1B4332" />
            <Text style={styles.backButtonText}>عودة</Text>
          </TouchableOpacity>

          <Text style={styles.parentCategoryName}>{selectedParent.name_ar}</Text>

          <View style={styles.categoriesGrid}>
            {(selectedParent as any).children?.map((child: Category) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.categoryCard,
                  selectedCategories.includes(child.id) && styles.categoryCardSelected,
                ]}
                onPress={() => handleCategoryToggle(child.id)}
              >
                <Text style={styles.categoryEmoji}>{child.icon || '📁'}</Text>
                <Text style={styles.categoryName}>{child.name_ar}</Text>
                {selectedCategories.includes(child.id) && (
                  <Ionicons name="checkmark-circle" size={20} color="#1B4332" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  )

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>المعلومات الأساسية</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>اسم المكان أو الشخص *</Text>
        <TextInput
          style={styles.input}
          value={nameAr}
          onChangeText={setNameAr}
          placeholder="أدخل الاسم"
          placeholderTextColor="#ADB5BD"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>رقم التليفون *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="أدخل رقم التليفون"
          placeholderTextColor="#ADB5BD"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>رقم واتساب (اختياري)</Text>
        <TextInput
          style={styles.input}
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="أدخل رقم واتساب"
          placeholderTextColor="#ADB5BD"
          keyboardType="phone-pad"
        />
      </View>

      {placeType === 'shop' && (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>العنوان بالتفصيل *</Text>
          <TextInput
            style={styles.input}
            value={addressText}
            onChangeText={setAddressText}
            placeholder="أدخل العنوان"
            placeholderTextColor="#ADB5BD"
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>وصف مختصر (اختياري)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={descriptionAr}
          onChangeText={setDescriptionAr}
          placeholder="أدخل وصفاً مختصراً"
          placeholderTextColor="#ADB5BD"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  )

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>الخدمات</Text>
      <Text style={styles.stepSubtitle}>أضف الخدمات اللي بتقدمها</Text>

      {services.map((service, index) => (
        <View key={service.id} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceNumber}>الخدمة {index + 1}</Text>
            {services.length > 1 && (
              <TouchableOpacity onPress={() => removeService(service.id)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.input}
            value={service.name_ar}
            onChangeText={(value) => updateService(service.id, 'name_ar', value)}
            placeholder="اسم الخدمة *"
            placeholderTextColor="#ADB5BD"
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            value={service.description_ar}
            onChangeText={(value) => updateService(service.id, 'description_ar', value)}
            placeholder="وصف الخدمة (اختياري)"
            placeholderTextColor="#ADB5BD"
            multiline
            numberOfLines={2}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.addServiceButton} onPress={addService}>
        <Ionicons name="add-circle" size={20} color="#1B4332" />
        <Text style={styles.addServiceButtonText}>إضافة خدمة</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1B4332" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة مكان جديد</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={styles.progressStep}>
              <View
                style={[
                  styles.progressCircle,
                  step >= s && styles.progressCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.progressNumber,
                    step >= s && styles.progressNumberActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
              {s < 4 && <View style={[styles.progressLine, step > s && styles.progressLineActive]} />}
            </View>
          ))}
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 4 ? 'إرسال' : 'التالي'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1B4332',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  progressStep: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#1B4332',
  },
  progressNumber: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#6C757D',
  },
  progressNumberActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E9ECEF',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#1B4332',
  },
  stepContainer: {
    gap: 16,
  },
  stepTitle: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 20,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
  },
  typeCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  typeCardSelected: {
    borderColor: '#1B4332',
  },
  typeEmoji: {
    fontSize: 40,
  },
  typeName: {
    flex: 1,
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#1A1A1A',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  categoryCardSelected: {
    borderColor: '#1B4332',
  },
  categoryEmoji: {
    fontSize: 32,
  },
  categoryName: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 13,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#1B4332',
  },
  parentCategoryName: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 18,
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 12,
  },
  serviceHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serviceNumber: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#1A1A1A',
  },
  addServiceButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1B4332',
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  addServiceButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    color: '#1B4332',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  nextButton: {
    backgroundColor: '#1B4332',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
})
