export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: 'user' | 'provider' | 'admin'
  is_banned: boolean
  warning_count: number
  ban_reason: string | null
  banned_at: string | null
  created_at: string
  updated_at: string
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
  children?: Category[]
}

export interface PlaceService {
  id: string
  place_id: string
  name_ar: string
  description_ar: string | null
  sort_order: number
  created_at: string
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
  admin_note: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  categories?: Category[]
  services?: PlaceService[]
  images?: PlaceImage[]
  likes_count?: number
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
  admin_note: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  place?: Pick<Place, 'id' | 'name_ar' | 'image_url' | 'place_type'>
}

export interface AppConfig {
  key: string
  value: string
}

export interface PlaceImage {
  id: string
  place_id: string
  url: string
  is_cover: boolean
  sort_order: number
  created_at: string
}

export interface Like {
  user_id: string
  place_id: string
  created_at: string
}

export interface Favorite {
  user_id: string
  place_id: string
  created_at: string
}

export interface DeviceToken {
  id: string
  user_id: string
  token: string
  platform: 'android' | 'ios' | 'web' | null
  created_at: string
}

export interface PlaceEditRequest {
  id: string
  place_id: string
  provider_id: string
  field_name: string
  old_value: string | null
  new_value: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  place_id: string
  user_id: string | null
  reason: string
  status: 'pending' | 'reviewed' | 'resolved'
  created_at: string
}

export interface AuditLog {
  id: string
  admin_id: string | null
  action: string
  target_type: string
  target_id: string
  note: string | null
  created_at: string
}
