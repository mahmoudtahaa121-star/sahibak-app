export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: 'user' | 'provider' | 'admin'
  is_banned: boolean
}

export interface Category {
  id: number
  parent_id: number | null
  name_ar: string
  name_en: string | null
  icon: string | null
  color: string | null
  sort_order: number
  is_active: boolean
  show_on_home: boolean
  place_type_hint: 'shop' | 'person' | 'both'
}

export interface PlaceService {
  id: string
  place_id: string
  name_ar: string
  description_ar: string | null
  sort_order: number
}

export interface Place {
  id: string
  provider_id: string | null
  area: string
  place_type: 'shop' | 'person'
  name_ar: string
  name_en: string | null
  description_ar: string | null
  phone: string
  whatsapp: string | null
  address_text: string | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  deleted_at: string | null
  created_at: string
  categories?: Category[]
  services?: PlaceService[]
}

export interface News {
  id: string
  title_ar: string
  body_ar: string | null
  image_url: string | null
  is_pinned: boolean
  created_at: string
}

export interface Offer {
  id: string
  place_id: string
  place_service_id: string | null
  title_ar: string
  description_ar: string | null
  expires_at: string | null
  status: 'pending' | 'approved' | 'rejected'
  place?: Pick<Place, 'id' | 'name_ar' | 'image_url'>
}

export interface AppConfig {
  key: string
  value: string
}
