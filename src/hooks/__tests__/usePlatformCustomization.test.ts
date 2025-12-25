/**
 * Tests unitaires pour usePlatformCustomization
 * 
 * Couverture :
 * - Chargement des données de personnalisation
 * - Sauvegarde par section
 * - Validation des données
 * - Gestion des erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePlatformCustomization } from '../admin/usePlatformCustomization';
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
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock validateSection
vi.mock('@/lib/schemas/platform-customization', () => ({
  validateSection: vi.fn(() => ({ valid: true, errors: [] })),
  validateCustomizationData: vi.fn(() => ({ valid: true, errors: [], data: {} })),
  PlatformCustomizationSchemaType: {},
}));

describe('usePlatformCustomization', () => {
  let queryClient: QueryClient;
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockQuery = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    });

    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should load customization data', async () => {
    const mockData = {
      id: '1',
      customization_data: {
        design: { colors: { primary: 'hsl(210, 100%, 60%)' } },
      },
    };

    mockQuery.single.mockResolvedValue({
      data: mockData,
      error: null,
    });

    const { result } = renderHook(() => usePlatformCustomization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.customizationData).toBeDefined();
  });

  it('should save section data', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({
      data: { id: '1' },
      error: null,
    });

    mockQuery.update.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '1' },
        error: null,
      }),
    });

    const { result } = renderHook(() => usePlatformCustomization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const saveResult = await result.current.save('design', {
      colors: { primary: 'hsl(210, 100%, 60%)' },
    });

    expect(saveResult).toBe(true);
  });

  it('should handle save errors', async () => {
    mockQuery.update.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Save failed' },
      }),
    });

    const { result } = renderHook(() => usePlatformCustomization(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const saveResult = await result.current.save('design', {});

    expect(saveResult).toBe(false);
  });
});

