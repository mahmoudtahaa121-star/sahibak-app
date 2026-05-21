import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { storage } from '../lib/storage';
import { Profile } from '../types';
import { performanceMonitor } from '../utils/performance';

export function useAuth() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    performanceMonitor.startTimer('fetchProfile');
    
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (data && !error) {
      if (data.is_banned) {
        await signOut();
        Alert.alert('تم حظر حسابك', 'تم حظر حسابك من قبل الإدارة');
        performanceMonitor.endTimer('fetchProfile', 'api', { userId, status: 'banned' });
        return;
      }
      setProfile(data);
      performanceMonitor.endTimer('fetchProfile', 'api', { userId, status: 'success' });
    } else if (error) {
      setProfile(null);
      performanceMonitor.endTimer('fetchProfile', 'api', { userId, status: 'error' });
    }
  };

  const signOut = async () => {
    performanceMonitor.startTimer('signOut');
    
    await supabase.auth.signOut();
    queryClient.clear();
    storage?.clearAll();
    
    performanceMonitor.endTimer('signOut', 'api');
  };

  return { user, profile, loading, signOut };
}
