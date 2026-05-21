import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { News } from '../types';
import { logger } from '../utils/logger';

export function useNews() {
  return useQuery<News[]>({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) {
        logger.supabaseError('fetchNews', error);
        throw error;
      }
      return data ?? [];
    },
  });
}
