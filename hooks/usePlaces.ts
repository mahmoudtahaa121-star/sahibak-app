import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Place } from '../types';
import { logger } from '../utils/logger';
import { performanceMonitor } from '../utils/performance';

const PLACES_PER_PAGE = 20;

export function usePlaces(area: string) {
  return useInfiniteQuery({
    queryKey: ['places', area, 'infinite'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      performanceMonitor.startTimer('fetchPlaces');
      
      const from = pageParam * PLACES_PER_PAGE;
      const to = from + PLACES_PER_PAGE - 1;

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
        .range(from, to);

      if (error) {
        logger.supabaseError('fetchPlaces', error, { area, page: pageParam });
        performanceMonitor.endTimer('fetchPlaces', 'api', { area, page: pageParam, status: 'error' });
        throw error;
      }

      performanceMonitor.endTimer('fetchPlaces', 'api', { 
        area, 
        page: pageParam, 
        status: 'success',
        count: data?.length || 0 
      });

      return (data ?? []).map((p: any) => ({
        ...p,
        categories: p.categories?.map((c: any) => c.category) ?? [],
        services: p.services ?? [],
      }));
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PLACES_PER_PAGE) {
        return undefined; // No more pages
      }
      return allPages.length;
    },
  });
}

// Keep the original non-paginated hook for backward compatibility
export function usePlacesSimple(area: string) {
  return useQuery<Place[]>({
    queryKey: ['places', area, 'simple'],
    queryFn: async () => {
      performanceMonitor.startTimer('fetchPlacesSimple');
      
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
        logger.supabaseError('fetchPlacesSimple', error, { area });
        performanceMonitor.endTimer('fetchPlacesSimple', 'api', { area, status: 'error' });
        throw error;
      }
      
      performanceMonitor.endTimer('fetchPlacesSimple', 'api', { 
        area, 
        status: 'success',
        count: data?.length || 0 
      });
      
      return (data ?? []).map((p: any) => ({
        ...p,
        categories: p.categories?.map((c: any) => c.category) ?? [],
        services: p.services ?? [],
      }));
    },
  });
}
