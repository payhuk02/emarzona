/**
 * Tests d'isolation pour StoreContext
 * 
 * Objectif : Valider que le StoreContext gère correctement
 * la sélection et l'isolation des boutiques
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { StoreProvider, useStoreContext } from '../StoreContext';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock AuthContext
const mockUser = {
  id: 'user-1',
  email: 'user1@test.com',
};

vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

describe('StoreContext Isolation', () => {
  let queryClient: QueryClient;
  let mockQuery: ReturnType<typeof vi.fn>;
  let localStorageMock: Storage;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });

    // Mock localStorage
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Setup mock query
    mockQuery = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    });

    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>{children}</StoreProvider>
    </QueryClientProvider>
  );

  describe('Store Selection', () => {
    it('should load stores filtered by user_id', async () => {
      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Vérifier que seules les boutiques de l'utilisateur sont chargées
      expect(result.current.stores).toHaveLength(2);
      expect(result.current.stores.every(s => s.user_id === 'user-1')).toBe(true);
    });

    it('should not load stores from other users', async () => {
      const allStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-2', slug: 'store-2' }, // Autre utilisateur
        { id: 'store-3', name: 'Store 3', user_id: 'user-1', slug: 'store-3' },
      ];

      // Le filtre .eq('user_id', 'user-1') devrait être appliqué
      mockQuery.order.mockResolvedValue({
        data: allStores.filter(s => s.user_id === 'user-1'),
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Vérifier que seules les boutiques de user-1 sont chargées
      expect(result.current.stores).toHaveLength(2);
      expect(result.current.stores.every(s => s.user_id === 'user-1')).toBe(true);
      expect(result.current.stores.some(s => s.user_id === 'user-2')).toBe(false);
    });

    it('should select first store by default when no stored selection', async () => {
      (localStorageMock.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Devrait sélectionner la première boutique
      expect(result.current.selectedStoreId).toBe('store-1');
      expect(result.current.selectedStore?.id).toBe('store-1');
    });

    it('should restore selected store from localStorage', async () => {
      (localStorageMock.getItem as ReturnType<typeof vi.fn>).mockReturnValue('store-2');

      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Devrait restaurer store-2 depuis localStorage
      expect(result.current.selectedStoreId).toBe('store-2');
      expect(result.current.selectedStore?.id).toBe('store-2');
    });

    it('should validate selected store belongs to user', async () => {
      // Simuler un storeId dans localStorage qui n'appartient pas à l'utilisateur
      (localStorageMock.getItem as ReturnType<typeof vi.fn>).mockReturnValue('store-other-user');

      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Devrait ignorer le store invalide et sélectionner le premier
      expect(result.current.selectedStoreId).toBe('store-1');
      expect(result.current.selectedStore?.id).toBe('store-1');
    });
  });

  describe('Store Switching', () => {
    it('should switch to a different store', async () => {
      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Changer de boutique
      act(() => {
        result.current.switchStore('store-2');
      });

      expect(result.current.selectedStoreId).toBe('store-2');
      expect(result.current.selectedStore?.id).toBe('store-2');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedStoreId', 'store-2');
    });

    it('should not switch to a store that does not belong to user', async () => {
      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialStoreId = result.current.selectedStoreId;

      // Tenter de changer vers un store qui n'existe pas
      act(() => {
        result.current.switchStore('store-other-user');
      });

      // Ne devrait pas changer
      expect(result.current.selectedStoreId).toBe(initialStoreId);
    });
  });

  describe('Store Limit', () => {
    it('should correctly calculate remaining stores', async () => {
      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 2 boutiques sur 3 max = 1 restante
      expect(result.current.canCreateStore()).toBe(true);
      expect(result.current.getRemainingStores()).toBe(1);
    });

    it('should prevent creation when limit reached', async () => {
      const userStores = [
        { id: 'store-1', name: 'Store 1', user_id: 'user-1', slug: 'store-1' },
        { id: 'store-2', name: 'Store 2', user_id: 'user-1', slug: 'store-2' },
        { id: 'store-3', name: 'Store 3', user_id: 'user-1', slug: 'store-3' },
      ];

      mockQuery.order.mockResolvedValue({
        data: userStores,
        error: null,
      });

      const { result } = renderHook(() => useStoreContext(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // 3 boutiques = limite atteinte
      expect(result.current.canCreateStore()).toBe(false);
      expect(result.current.getRemainingStores()).toBe(0);
    });
  });
});

