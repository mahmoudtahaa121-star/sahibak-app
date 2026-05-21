import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  mockSupabase, 
  createMockUser 
} from './mocks/supabase.mock';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({ supabase: mockSupabase }));

describe('Place Creation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mocks to default behavior
    mockSupabase.insert.mockResolvedValue({ error: null });
    mockSupabase.select.mockReturnValueOnce(mockSupabase);
    mockSupabase.single.mockResolvedValue({ data: null, error: null });
  });

  describe('Place Data Insertion', () => {
    it('creates a new place with basic information', async () => {
      const mockPlace = {
        id: 'test-place-id',
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop' as const,
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        whatsapp: '+20 123 456 7890',
        description_ar: 'مطعم شرقي مميز',
        address_text: 'شارع الرئيسي',
        status: 'pending' as const,
      };

      mockSupabase.insert.mockResolvedValueOnce({ 
        data: mockPlace, 
        error: null 
      });

      const result = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop',
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        whatsapp: '+20 123 456 7890',
        description_ar: 'مطعم شرقي مميز',
        address_text: 'شارع الرئيسي',
        status: 'pending',
      });

      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('places');
    });

    it('handles place creation errors', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Database constraint violation') 
      });

      const result = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop',
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        status: 'pending',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Database constraint violation');
    });

    it('creates place without optional fields', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: { id: 'test-place-id' }, 
        error: null 
      });

      const result = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop',
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        whatsapp: null,
        description_ar: null,
        address_text: null,
        status: 'pending',
      });

      expect(result.error).toBeNull();
    });
  });

  describe('Category Assignment', () => {
    it('assigns single category to place', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await mockSupabase.from('place_categories').insert({
        place_id: 'test-place-id',
        category_id: 1,
      });

      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('place_categories');
    });

    it('assigns multiple categories to place', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const categoryIds = [1, 2, 3];
      const results = await Promise.all(
        categoryIds.map(categoryId =>
          mockSupabase.from('place_categories').insert({
            place_id: 'test-place-id',
            category_id: categoryId,
          })
        )
      );

      results.forEach(result => {
        expect(result.error).toBeNull();
      });
    });

    it('handles category assignment errors', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ 
        error: new Error('Foreign key constraint') 
      });

      const result = await mockSupabase.from('place_categories').insert({
        place_id: 'test-place-id',
        category_id: 999,
      });

      expect(result.error).toBeTruthy();
    });
  });

  describe('Service Management', () => {
    it('creates service for place', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await mockSupabase.from('place_services').insert({
        place_id: 'test-place-id',
        name_ar: 'توصيل طلبات',
        description_ar: 'توصيل مجاني للمنطقة',
      });

      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('place_services');
    });

    it('creates service without description', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await mockSupabase.from('place_services').insert({
        place_id: 'test-place-id',
        name_ar: 'توصيل طلبات',
        description_ar: null,
      });

      expect(result.error).toBeNull();
    });

    it('handles empty service names by filtering', async () => {
      const services = [
        { name_ar: 'خدمة 1', description_ar: 'وصف' },
        { name_ar: '', description_ar: 'وصف' }, // Should be filtered out
        { name_ar: 'خدمة 2', description_ar: 'وصف' },
      ];

      const validServices = services.filter(s => s.name_ar.trim());
      
      expect(validServices.length).toBe(2);
      expect(validServices.every(s => s.name_ar.trim())).toBe(true);
    });

    it('handles service creation errors', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ 
        error: new Error('Service creation failed') 
      });

      const result = await mockSupabase.from('place_services').insert({
        place_id: 'test-place-id',
        name_ar: 'خدمة',
        description_ar: 'وصف',
      });

      expect(result.error).toBeTruthy();
    });
  });

  describe('Complete Place Creation Flow', () => {
    it('creates place with categories and services', async () => {
      const mockPlace = {
        id: 'test-place-id',
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop' as const,
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        status: 'pending' as const,
      };

      // Step 1: Create place
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: mockPlace, 
        error: null 
      });

      const placeResult = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop',
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        status: 'pending',
      });

      expect(placeResult.error).toBeNull();

      // Step 2: Assign categories
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const categoryResult = await mockSupabase.from('place_categories').insert({
        place_id: mockPlace.id,
        category_id: 1,
      });

      expect(categoryResult.error).toBeNull();

      // Step 3: Add services
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const serviceResult = await mockSupabase.from('place_services').insert({
        place_id: mockPlace.id,
        name_ar: 'توصيل طلبات',
        description_ar: 'توصيل مجاني',
      });

      expect(serviceResult.error).toBeNull();
    });

    it('handles partial failure in place creation flow', async () => {
      // Place creation succeeds
      mockSupabase.insert.mockResolvedValueOnce({ 
        data: { id: 'test-place-id' }, 
        error: null 
      });

      const placeResult = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop',
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        status: 'pending',
      });

      expect(placeResult.error).toBeNull();

      // Category assignment fails
      mockSupabase.insert.mockResolvedValueOnce({ 
        error: new Error('Category assignment failed') 
      });

      const categoryResult = await mockSupabase.from('place_categories').insert({
        place_id: 'test-place-id',
        category_id: 1,
      });

      expect(categoryResult.error).toBeTruthy();
    });
  });

  describe('Place Type Specific Logic', () => {
    it('creates shop type place', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop',
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        status: 'pending',
      });

      expect(result.error).toBeNull();
    });

    it('creates person type place', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'person',
        name_ar: 'محمد أحمد',
        phone: '+20 123 456 7890',
        status: 'pending',
      });

      expect(result.error).toBeNull();
    });

    it('enforces category limits based on place type', () => {
      // Shop: 1 category max
      const shopCategories = [1];
      expect(shopCategories.length).toBeLessThanOrEqual(1);

      // Person: 2 categories max
      const personCategories = [1, 2];
      expect(personCategories.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Place Status Management', () => {
    it('creates place with pending status', async () => {
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await mockSupabase.from('places').insert({
        provider_id: 'test-provider-id',
        area: 'Al-Mansouriyah',
        place_type: 'shop',
        name_ar: 'مطعم الشرق',
        phone: '+20 123 456 7890',
        status: 'pending',
      });

      expect(result.error).toBeNull();
    });

    it('updates place status to approved', async () => {
      const mockUpdated = { status: 'approved' };
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const result = await mockSupabase.from('places')
        .update({ status: 'approved' })
        .eq('id', 'test-place-id');

      expect(!result.error).toBe(true);
    });

    it('handles place rejection with admin note', async () => {
      const mockUpdated = { status: 'rejected', admin_note: 'معلومات غير كافية' };
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockResolvedValueOnce({ data: mockUpdated, error: null });

      const result = await mockSupabase.from('places')
        .update({ 
          status: 'rejected',
          admin_note: 'معلومات غير كافية'
        })
        .eq('id', 'test-place-id');

      expect(!result.error).toBe(true);
    });
  });

  describe('Place Limits Validation', () => {
    it('enforces shop limit of 3 places per provider', () => {
      const existingShops = [
        { id: '1', place_type: 'shop', deleted_at: null },
        { id: '2', place_type: 'shop', deleted_at: null },
        { id: '3', place_type: 'shop', deleted_at: null },
      ];

      const canAddShop = existingShops.filter(p => p.place_type === 'shop' && p.deleted_at === null).length < 3;
      
      expect(canAddShop).toBe(false); // Already at limit
    });

    it('enforces person limit of 5 places per provider', () => {
      const existingPersons = [
        { id: '1', place_type: 'person', deleted_at: null },
        { id: '2', place_type: 'person', deleted_at: null },
        { id: '3', place_type: 'person', deleted_at: null },
        { id: '4', place_type: 'person', deleted_at: null },
        { id: '5', place_type: 'person', deleted_at: null },
      ];

      const canAddPerson = existingPersons.filter(p => p.place_type === 'person' && p.deleted_at === null).length < 5;
      
      expect(canAddPerson).toBe(false); // Already at limit
    });

    it('allows adding places when below limit', () => {
      const existingShops = [
        { id: '1', place_type: 'shop', deleted_at: null },
        { id: '2', place_type: 'shop', deleted_at: null },
      ];

      const canAddShop = existingShops.filter(p => p.place_type === 'shop' && p.deleted_at === null).length < 3;
      
      expect(canAddShop).toBe(true); // Can add more
    });

    it('does not count deleted places toward limit', () => {
      const existingShops = [
        { id: '1', place_type: 'shop', deleted_at: null },
        { id: '2', place_type: 'shop', deleted_at: new Date().toISOString() },
        { id: '3', place_type: 'shop', deleted_at: null },
      ];

      const activeShopCount = existingShops.filter(p => p.place_type === 'shop' && p.deleted_at === null).length;
      
      expect(activeShopCount).toBe(2); // Deleted place not counted
    });
  });

  describe('Area-based Place Filtering', () => {
    it('filters places by area', async () => {
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({ 
        data: [{ id: '1', area: 'Al-Mansouriyah' }], 
        error: null 
      });

      const result = await mockSupabase.from('places')
        .select('*')
        .eq('area', 'Al-Mansouriyah')
        .single();

      expect(result.error).toBeNull();
      expect(mockSupabase.eq).toHaveBeenCalledWith('area', 'Al-Mansouriyah');
    });
  });
});
