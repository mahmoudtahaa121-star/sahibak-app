import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { News } from '../types'

export function useNews() {
  return useQuery<News[]>({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) {
        console.error('useNews error:', error)
        throw error
      }
      return data ?? []
    },
  })
}

