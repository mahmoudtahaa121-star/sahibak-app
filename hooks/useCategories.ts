import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Category } from '../types'

export function useParentCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories', 'parents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .eq('show_on_home', true)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })
}

export function useChildCategories(parentId: number | null) {
  return useQuery<Category[]>({
    queryKey: ['categories', 'children', parentId],
    queryFn: async () => {
      if (!parentId) return []
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
    enabled: !!parentId,
  })
}
