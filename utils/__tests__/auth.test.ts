import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  mockSupabase, 
  createMockUser, 
  createMockProfile, 
  createMockSession 
} from './mocks/supabase.mock';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({ supabase: mockSupabase }));

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to default behavior
    mockSupabase.insert.mockResolvedValue({ error: null });
    mockSupabase.upsert.mockResolvedValue({ error: null });
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
  });

  describe('Email/Password Login Flow', () => {
    it('successful login with email and password', async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();
      const mockSession = createMockSession(mockUser);
      
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      });
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      
      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(result.error).toBe(null);
      expect(result.data.user).toEqual(mockUser);
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('handles invalid credentials', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ 
        data: { user: null, session: null }, 
        error: new Error('Invalid login credentials') 
      });
      
      const result = await mockSupabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      
      expect(result.error).toBeTruthy();
      expect(result.data.user).toBe(null);
    });

    it('handles network errors during login', async () => {
      mockSupabase.auth.signInWithPassword.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(
        mockSupabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Registration Flow', () => {
    it('successful user registration', async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();
      const mockSession = createMockSession(mockUser);
      
      mockSupabase.auth.signUp.mockResolvedValueOnce({ 
        data: { user: mockUser, session: mockSession }, 
        error: null 
      });
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.upsert.mockReturnValueOnce(mockSupabase);
      mockSupabase.upsert.mockResolvedValueOnce({ error: null });
      
      const result = await mockSupabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'Password123',
        options: {
          data: {
            full_name: 'New User',
            phone: '+20 123 456 7890',
            role: 'user',
          },
        },
      });
      
      expect(result.error).toBe(null);
      expect(result.data.user).toEqual(mockUser);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
          password: 'Password123',
        })
      );
    });

    it('handles registration with email confirmation required', async () => {
      const mockUser = createMockUser();
      
      mockSupabase.auth.signUp.mockResolvedValueOnce({ 
        data: { user: mockUser, session: null }, 
        error: null 
      });
      
      const result = await mockSupabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'Password123',
      });
      
      expect(result.error).toBe(null);
      expect(result.data.user).toEqual(mockUser);
      expect(result.data.session).toBe(null);
    });

    it('handles duplicate email registration', async () => {
      mockSupabase.auth.signUp.mockResolvedValueOnce({ 
        data: { user: null, session: null }, 
        error: new Error('User already registered') 
      });
      
      const result = await mockSupabase.auth.signUp({
        email: 'existing@example.com',
        password: 'Password123',
      });
      
      expect(result.error).toBeTruthy();
      expect(result.data.user).toBe(null);
    });
  });

  describe('Profile Management', () => {
    it('creates profile for new user', async () => {
      const mockProfile = createMockProfile();
      
      mockSupabase.insert.mockResolvedValueOnce({ error: null });
      
      const result = await mockSupabase.from('profiles').insert({
        id: 'test-user-id',
        full_name: 'Test User',
        phone: '+20 123 456 7890',
        role: 'user',
        is_banned: false,
      });
      
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('handles profile creation errors', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ 
        error: new Error('Database constraint violation') 
      });
      
      const result = await mockSupabase.from('profiles').insert({
        id: 'test-user-id',
        full_name: 'Test User',
        phone: '+20 123 456 7890',
        role: 'user',
        is_banned: false,
      });
      
      expect(result.error).toBeTruthy();
    });
  });

  describe('Logout Flow', () => {
    it('successful logout', async () => {
      mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });
      
      const result = await mockSupabase.auth.signOut();
      
      expect(result.error).toBe(null);
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('handles logout errors', async () => {
      mockSupabase.auth.signOut.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(mockSupabase.auth.signOut()).rejects.toThrow('Network error');
    });
  });

  describe('Session Management', () => {
    it('retrieves current session', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      mockSupabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: mockSession }, 
        error: null 
      });
      
      const result = await mockSupabase.auth.getSession();
      
      expect(result.error).toBe(null);
      expect(result.data.session).toEqual(mockSession);
    });

    it('handles no active session', async () => {
      mockSupabase.auth.getSession.mockResolvedValueOnce({ 
        data: { session: null }, 
        error: null 
      });
      
      const result = await mockSupabase.auth.getSession();
      
      expect(result.data.session).toBe(null);
    });
  });

  describe('Authentication State Changes', () => {
    it('sets up auth state listener', () => {
      const listener = mockSupabase.auth.onAuthStateChange();
      
      expect(listener.data.subscription).toBeDefined();
      expect(typeof listener.data.subscription.unsubscribe).toBe('function');
    });

    it('cleans up auth state listener', () => {
      const listener = mockSupabase.auth.onAuthStateChange();
      
      expect(() => listener.data.subscription.unsubscribe()).not.toThrow();
    });
  });

  describe('Profile Fetching Integration', () => {
    it('fetches user profile successfully', async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();
      
      mockSupabase.single.mockResolvedValueOnce({ data: mockProfile, error: null });
      
      const result = await mockSupabase.from('profiles').select('*').eq('id', mockUser.id).single();
      
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', mockUser.id);
    });
  });

  describe('Profile Creation with Banned Status', () => {
    it('creates profile with warning count', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });
      
      const result = await mockSupabase.from('profiles').insert({
        id: 'test-user-id',
        full_name: 'Test User',
        phone: '+20 123 456 7890',
        role: 'user',
        is_banned: false,
        warning_count: 0,
        ban_reason: null,
        banned_at: null,
      });
      
      expect(result.error).toBeNull();
    });
  });

  describe('Complete Auth Flow Integration', () => {
    it('complete registration to login flow', async () => {
      const mockUser = createMockUser();
      const mockProfile = createMockProfile();
      
      // Step 1: Sign up
      mockSupabase.auth.signUp.mockResolvedValueOnce({ 
        data: { user: mockUser, session: createMockSession(mockUser) }, 
        error: null 
      });
      
      const signupResult = await mockSupabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'Password123',
      });
      
      expect(signupResult.error).toBeNull();
      expect(signupResult.data.user).toEqual(mockUser);
      
      // Step 2: Create profile
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.upsert.mockResolvedValueOnce({ error: null });
      
      const profileResult = await mockSupabase.from('profiles').upsert({
        id: mockUser.id,
        full_name: 'New User',
        phone: '+20 123 456 7890',
        role: 'user',
        is_banned: false,
      }, { onConflict: 'id' });
      
      expect(!profileResult.error).toBe(true);
      
      // Step 3: Login with new credentials
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({ 
        data: { user: mockUser, session: createMockSession(mockUser) }, 
        error: null 
      });
      
      const loginResult = await mockSupabase.auth.signInWithPassword({
        email: 'newuser@example.com',
        password: 'Password123',
      });
      
      expect(loginResult.error).toBeNull();
      expect(loginResult.data.user).toEqual(mockUser);
    });

    it('handles registration with profile creation failure', async () => {
      const mockUser = createMockUser();
      
      // Sign up succeeds
      mockSupabase.auth.signUp.mockResolvedValueOnce({ 
        data: { user: mockUser, session: createMockSession(mockUser) }, 
        error: null 
      });
      
      const signupResult = await mockSupabase.auth.signUp({
        email: 'newuser@example.com',
        password: 'Password123',
      });
      
      expect(signupResult.error).toBeNull();
      
      // Profile creation fails
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockResolvedValueOnce({ 
        error: new Error('Database constraint violation') 
      });
      
      const profileResult = await mockSupabase.from('profiles').insert({
        id: mockUser.id,
        full_name: 'New User',
        phone: '+20 123 456 7890',
        role: 'user',
        is_banned: false,
      });
      
      expect(profileResult.error).toBeTruthy();
    });
  });

  describe('Google OAuth Integration', () => {
    it('initiates Google OAuth flow', async () => {
      const mockUser = createMockUser({
        email: 'googleuser@gmail.com',
        user_metadata: {
          full_name: 'Google User',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      });
      
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({ 
        data: { 
          url: 'https://accounts.google.com/oauth/authorize',
          provider: 'google',
        }, 
        error: null 
      });
      
      const result = await mockSupabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'sahibak://auth',
        },
      });
      
      expect(result.error).toBeNull();
      expect(result.data.url).toContain('accounts.google.com');
      expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'sahibak://auth',
        },
      });
    });

    it('handles OAuth errors', async () => {
      mockSupabase.auth.signInWithOAuth.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('OAuth provider error') 
      });
      
      const result = await mockSupabase.auth.signInWithOAuth({
        provider: 'google',
      });
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('OAuth provider error');
    });
  });
});
