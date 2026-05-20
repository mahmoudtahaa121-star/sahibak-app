import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Place } from '../types'

export function useFavorites(userId: string | undefined) {
  return useQuery<Place[]>({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('favorites')
        .select('*, places(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data?.map((f) => f.places).filter(Boolean) || []
    },
    enabled: !!userId,
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, placeId, isFavorite }: { userId: string; placeId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('place_id', placeId)
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: userId, place_id: placeId })
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
    },
  })
}
