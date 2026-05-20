import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Offer } from '../types'

export function useOffers(area: string) {
  return useQuery<Offer[]>({
    queryKey: ['offers', area],
    queryFn: async () => {
      const now = new Date().toISOString()
      const { data, error } = await supabase
        .from('offers')
        .select(`*, place:places(id, name_ar, image_url, area)`)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .or('expires_at.is.null,expires_at.gt.' + now)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).filter((o) => o.place?.area === area)
    },
  })
}
