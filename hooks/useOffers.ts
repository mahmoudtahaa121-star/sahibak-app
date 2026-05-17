import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Offer } from '../types'

export function useOffers(area: string) {
  return useQuery<Offer[]>({
    queryKey: ['offers', area],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offers')
        .select(`*, place:places(id, name_ar, image_url, area)`)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).filter((o: any) => o.place?.area === area)
    },
  })
}
