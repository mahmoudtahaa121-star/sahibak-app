import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Place } from '../types'

type FilterType = 'all' | 'shop' | 'person'

export function useCategoryPlaces(categoryId: string | undefined, area: string, filter: FilterType) {
  return useQuery<Place[]>({
    queryKey: ['category-places', categoryId, area, filter],
    queryFn: async () => {
      if (!categoryId) return []
      
      let query = supabase
        .from('places')
        .select('*, place_categories!inner(category_id), place_services(id, name_ar, description_ar)')
        .eq('status', 'approved')
        .is('deleted_at', null)
        .eq('place_categories.category_id', parseInt(categoryId))
        .eq('area', area)

      if (filter !== 'all') {
        query = query.eq('place_type', filter)
      }

      const { data, error } = await query

      if (error) throw error

      return data as Place[]
    },
    enabled: !!categoryId,
  })
}

export function useCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', parseInt(categoryId))
        .single()

      if (error) throw error
      return data
    },
    enabled: !!categoryId,
  })
}
