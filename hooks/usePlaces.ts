import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Place } from '../types';
import { logger } from '../utils/logger';

export function usePlaces(area: string) {
  return useQuery<Place[]>({
    queryKey: ['places', area],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select(
          `
          *,
          categories:place_categories(
            category:categories(id, name_ar, icon, color)
          ),
          services:place_services(
            id, name_ar, description_ar, sort_order
          )
        `
        )
        .eq('status', 'approved')
        .is('deleted_at', null)
        .eq('area', area)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        logger.supabaseError('fetchPlaces', error, { area });
        throw error;
      }
      return (data ?? []).map((p: any) => ({
        ...p,
        categories: p.categories?.map((c: any) => c.category) ?? [],
        services: p.services ?? [],
      }));
    },
  });
}
