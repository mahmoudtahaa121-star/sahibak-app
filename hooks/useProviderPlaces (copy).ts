import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Place } from '../types'

export function useProviderPlaces(userId: string | undefined) {
  return useQuery<Place[]>({
    queryKey: ['provider-places', userId],
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('places')
        .select('*, place_categories(category:categories(*))')
        .eq('provider_id', userId)
        .is('deleted_at', null)

      if (error) throw error
      return data || []
    },
    enabled: !!userId,
  })
}
