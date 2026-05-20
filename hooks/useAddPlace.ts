import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface PlaceData {
  provider_id: string
  area: string
  place_type: 'shop' | 'person'
  name_ar: string
  phone: string
  whatsapp: string | null
  description_ar: string | null
  address_text: string | null
}

interface ServiceData {
  name_ar: string
  description_ar: string | null
}

export function useAddPlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      placeData,
      categoryIds,
      services,
    }: {
      placeData: PlaceData
      categoryIds: number[]
      services: ServiceData[]
    }) => {
      const { data: placeDataResult, error: placeError } = await supabase
        .from('places')
        .insert({
          ...placeData,
          status: 'pending',
        })
        .select()
        .single()

      if (placeError) throw placeError

      const placeId = placeDataResult.id

      for (const categoryId of categoryIds) {
        await supabase.from('place_categories').insert({
          place_id: placeId,
          category_id: categoryId,
        })
      }

      const validServices = services.filter((s) => s.name_ar.trim())
      for (const service of validServices) {
        await supabase.from('place_services').insert({
          place_id: placeId,
          name_ar: service.name_ar.trim(),
          description_ar: service.description_ar?.trim() || null,
        })
      }

      return placeDataResult
    },
    onSuccess: (_, { placeData }) => {
      queryClient.invalidateQueries({ queryKey: ['provider-places', placeData.provider_id] })
    },
  })
}
