import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Place, Offer } from '../types'

export function usePlace(id: string | undefined) {
  return useQuery<Place & { offers: Offer[] }>({
    queryKey: ['place', id],
    queryFn: async () => {
      if (!id) throw new Error('Place ID is required')
      
      const { data, error } = await supabase
        .from('places')
        .select(`
          *,
          categories:place_categories(
            category:categories(id, name_ar, icon, color)
          ),
          services:place_services(
            id, name_ar, description_ar, sort_order
          ),
          offers:offers(
            id, title_ar, description_ar, expires_at, status
          )
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .single()

      if (error) throw error

      const approvedOffers = data.offers?.filter((o: Offer) => o.status === 'approved') || []

      return {
        ...data,
        categories: data.categories?.map((c: any) => c.category) || [],
        services: data.services?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [],
        offers: approvedOffers,
      } as Place & { offers: Offer[] }
    },
    enabled: !!id,
  })
}
