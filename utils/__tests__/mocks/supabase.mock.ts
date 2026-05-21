import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabase = {
  auth: {
    signUp: vi.fn() as any,
    signInWithPassword: vi.fn() as any,
    signInWithOAuth: vi.fn() as any,
    signOut: vi.fn() as any,
    getSession: vi.fn() as any,
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })) as any,
    getUser: vi.fn() as any,
  },
  from: vi.fn(() => mockSupabase) as any,
  select: vi.fn(() => mockSupabase) as any,
  insert: vi.fn(() => Promise.resolve({ error: null })) as any,
  upsert: vi.fn(() => Promise.resolve({ error: null })) as any,
  update: vi.fn(() => mockSupabase) as any,
  eq: vi.fn(() => mockSupabase) as any,
  single: vi.fn(() => Promise.resolve({ data: null, error: null })) as any,
  order: vi.fn(() => mockSupabase) as any,
  limit: vi.fn(() => mockSupabase) as any,
  range: vi.fn(() => mockSupabase) as any,
  gte: vi.fn(() => mockSupabase) as any,
  lt: vi.fn(() => mockSupabase) as any,
  delete: vi.fn(() => mockSupabase) as any,
};

// Helper to create mock user
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    phone: '+20 123 456 7890',
    role: 'user',
  },
  ...overrides,
});

// Helper to create mock profile
export const createMockProfile = (overrides = {}) => ({
  id: 'test-user-id',
  full_name: 'Test User',
  phone: '+20 123 456 7890',
  role: 'user',
  is_banned: false,
  warning_count: 0,
  ban_reason: null,
  banned_at: null,
  ...overrides,
});

// Helper to create mock session
export const createMockSession = (user = createMockUser()) => ({
  user,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600000,
});
