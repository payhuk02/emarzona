/**
 * Tests unitaires pour le système d'import/export
 * Date: Janvier 2026
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  importFromCSV,
  importFromJSON,
  previewImport,
  exportImportErrorsToCSV,
  exportPreviewResultsToCSV,
  validateSlugUniqueness,
  retryOperation,
  sanitizeHtml,
  importRow
} from '@/lib/import-export/import-export';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })) })),
      delete: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) }))
    })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } } }))
    }
  }
}));

describe('Import/Export System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateSlugUniqueness', () => {
    it('should detect duplicate slugs', () => {
      const rows = [
        { slug: 'produit-1' },
        { slug: 'produit-2' },
        { slug: 'produit-1' }, // Duplicate
        { slug: 'produit-3' }
      ];

      const result = validateSlugUniqueness(rows, 'store-id');

      expect(result.valid).toBe(false);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].slug).toBe('produit-1');
      expect(result.duplicates[0].row).toBe(2); // 0-based index + 1
      expect(result.duplicates[0].duplicateRow).toBe(0);
    });

    it('should pass when all slugs are unique', () => {
      const rows = [
        { slug: 'produit-1' },
        { slug: 'produit-2' },
        { slug: 'produit-3' }
      ];

      const result = validateSlugUniqueness(rows, 'store-id');

      expect(result.valid).toBe(true);
      expect(result.duplicates).toHaveLength(0);
    });
  });

  describe('previewImport', () => {
    it('should validate products and provide preview', async () => {
      const testData = [
        {
          name: 'Produit valide',
          slug: 'produit-valide',
          price: '100',
          category: 'digital'
        },
        {
          name: 'Produit invalide',
          slug: 'produit invalide', // Invalid slug
          price: '0', // Invalid price
        }
      ];

      const result = await previewImport('store-id', 'products', testData);

      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
      expect(result.validationResults).toHaveLength(2);
      expect(result.validationResults[0].isValid).toBe(true);
      expect(result.validationResults[1].isValid).toBe(false);
    });

    it('should detect categories usage', async () => {
      const testData = [
        { name: 'Produit 1', slug: 'produit-1', price: '100', category: 'ebook' },
        { name: 'Produit 2', slug: 'produit-2', price: '200', category: 'ebook' },
        { name: 'Produit 3', slug: 'produit-3', price: '150', category: 'formation' }
      ];

      const result = await previewImport('store-id', 'products', testData);

      expect(result.categoriesFound).toHaveLength(2);
      const ebookCat = result.categoriesFound.find(c => c.name === 'ebook');
      const formationCat = result.categoriesFound.find(c => c.name === 'formation');

      expect(ebookCat?.count).toBe(2);
      expect(formationCat?.count).toBe(1);
    });
  });

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');

      const result = await retryOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await retryOperation(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry validation errors', async () => {
      const error = { code: '23505', message: 'Duplicate key' };
      const operation = vi.fn().mockRejectedValue(error);

      await expect(retryOperation(operation)).rejects.toEqual(error);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should give up after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent network error'));

      await expect(retryOperation(operation)).rejects.toThrow('Persistent network error');
      expect(operation).toHaveBeenCalledTimes(3); // maxRetries = 3
    });
  });

  describe('exportImportErrorsToCSV', () => {
    it('should export errors to CSV format', () => {
      const errors = [
        { row: 2, error: 'Nom requis' },
        { row: 5, field: 'price', error: 'Prix invalide' },
        { row: 10, error: 'Slug dupliqué' }
      ];

      const csv = exportImportErrorsToCSV(errors);

      expect(csv).toContain('"Ligne","Champ","Erreur"');
      expect(csv).toContain('2,,Nom requis');
      expect(csv).toContain('5,price,Prix invalide');
      expect(csv).toContain('10,,Slug dupliqué');
    });
  });

  describe('exportPreviewResultsToCSV', () => {
    it('should export preview results to CSV format', () => {
      const previewResult = {
        totalRows: 3,
        validRows: 2,
        invalidRows: 1,
        validationResults: [
          {
            row: 1,
            isValid: true,
            errors: [],
            data: { name: 'Produit 1', price: 100, category: 'ebook' }
          },
          {
            row: 2,
            isValid: false,
            errors: [{ field: 'slug', message: 'Slug invalide' }],
            data: undefined
          },
          {
            row: 3,
            isValid: true,
            errors: [],
            data: { name: 'Produit 3', price: 200, category: 'formation' }
          }
        ],
        categoriesFound: [],
        warnings: []
      };

      const csv = exportPreviewResultsToCSV(previewResult);

      expect(csv).toContain('"Ligne","Statut","Erreurs","Nom","Prix","Catégorie"');
      expect(csv).toContain('1,Valide,,Produit 1,100,ebook');
      expect(csv).toContain('2,Erreur,slug: Slug invalide,,,');
      expect(csv).toContain('3,Valide,,Produit 3,200,formation');
    });
  });

  describe('importFromJSON', () => {
    it('should reject files with too many products', async () => {
      const largeData = Array.from({ length: 1001 }, (_, i) => ({
        name: `Produit ${i}`,
        slug: `produit-${i}`,
        price: '100'
      }));

      const result = await importFromJSON('store-id', 'products', largeData);

      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('Maximum: 1000 produits par import');
    });

    it('should reject files with duplicate slugs', async () => {
      const dataWithDuplicates = [
        { name: 'Produit 1', slug: 'produit-1', price: '100' },
        { name: 'Produit 2', slug: 'produit-1', price: '200' } // Duplicate slug
      ];

      const result = await importFromJSON('store-id', 'products', dataWithDuplicates);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.error.includes('Slug dupliqué'))).toBe(true);
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("danger")</script><p>Safe content</p>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert("danger")');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should remove style tags', () => {
      const input = '<style>body { color: red; }</style><div>Content</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('body { color: red; }');
      expect(result).toContain('<div>Content</div>');
    });

    it('should remove event handlers', () => {
      const input = '<a href="#" onclick="alert(\'danger\')">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert(\'danger\')');
    });

    it('should remove javascript URLs', () => {
      const input = '<a href="javascript:alert(\'danger\')">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeHtml(null)).toBeNull();
      expect(sanitizeHtml(undefined)).toBeNull();
      expect(sanitizeHtml('')).toBeNull();
    });

    it('should preserve safe HTML', () => {
      const input = '<p><strong>Bold text</strong></p><br/><em>Italic</em>';
      const result = sanitizeHtml(input);
      expect(result).toBe(input); // Should remain unchanged
    });
  });

  describe('Integration tests', () => {
    it('should handle promotional price validation', async () => {
      const data = [{
        name: 'Produit avec promo',
        slug: 'produit-promo',
        price: '100',
        promotional_price: '150' // Invalid: promo > normal
      }];

      const preview = await previewImport('store-id', 'products', data);
      const invalidResult = preview.validationResults.find(r => !r.isValid);

      expect(invalidResult).toBeDefined();
      expect(invalidResult?.errors[0].message).toContain('prix promotionnel');
    });

    it('should validate slug format', async () => {
      const data = [{
        name: 'Produit invalide',
        slug: 'PRODUIT-INVALIDE', // Invalid: uppercase and spaces
        price: '100'
      }];

      const preview = await previewImport('store-id', 'products', data);
      const invalidResult = preview.validationResults.find(r => !r.isValid);

      expect(invalidResult).toBeDefined();
      expect(invalidResult?.errors[0].message).toContain('slug');
    });

    it('should detect duplicate SKUs in file', async () => {
      const data = [
        { name: 'Produit 1', slug: 'produit-1', sku: 'SKU-001', price: '100' },
        { name: 'Produit 2', slug: 'produit-2', sku: 'SKU-001', price: '200' } // Duplicate SKU
      ];

      const preview = await previewImport('store-id', 'products', data);
      const invalidResults = preview.validationResults.filter(r => !r.isValid);

      expect(invalidResults).toHaveLength(1);
      expect(invalidResults[0].errors[0].field).toBe('sku');
      expect(invalidResults[0].errors[0].message).toContain('dupliqué');
    });

    it('should handle SKU field correctly', async () => {
      const data = [
        { name: 'Produit avec SKU', slug: 'produit-sku', sku: 'SKU-123', price: '100' },
        { name: 'Produit sans SKU', slug: 'produit-sans-sku', price: '200' }
      ];

      const preview = await previewImport('store-id', 'products', data);
      const validResults = preview.validationResults.filter(r => r.isValid);

      expect(validResults).toHaveLength(2);
      expect(validResults[0].data?.sku).toBe('SKU-123');
      expect(validResults[1].data?.sku).toBeNull();
    });
  });

  describe('importFromCSV', () => {
    it('should import valid CSV data successfully', async () => {
      // Mock successful imports
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const csvContent = `name,slug,price,category
Produit 1,produit-1,100,Digital
Produit 2,produit-2,200,Formation`;

      const result = await importFromCSV('store-id', 'products', csvContent);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle CSV with errors gracefully', async () => {
      const csvContent = `name,slug,price,category
Produit 1,produit-1,100,Digital
Produit 2,invalid-slug,200,Formation`; // Invalid slug

      const result = await importFromCSV('store-id', 'products', csvContent);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(1); // Only first product imported
      expect(result.failed).toBe(1); // Second product failed
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('slug');
    });

    it('should reject invalid storeId', async () => {
      const csvContent = `name,slug,price,category
Produit 1,produit-1,100,Digital`;

      const result = await importFromCSV('', 'products', csvContent);

      expect(result.success).toBe(false);
      expect(result.errors[0].error).toContain('Store ID');
    });
  });

  describe('importRow', () => {
    it('should validate product data correctly', async () => {
      const mockSupabase = vi.mocked(supabase);
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      const validRow = {
        name: 'Produit Test',
        slug: 'produit-test',
        sku: 'SKU-123',
        price: '100',
        description: '<p>Description sécurisée</p>',
        category: 'Digital'
      };

      const result = await importRow('store-id', 'products', validRow);

      expect(result.success).toBe(true);
    });

    it('should reject invalid product name', async () => {
      const invalidRow = {
        name: '', // Invalid: empty name
        slug: 'produit-test',
        price: '100'
      };

      const result = await importRow('store-id', 'products', invalidRow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('3 caractères');
    });

    it('should reject invalid slug format', async () => {
      const invalidRow = {
        name: 'Produit Test',
        slug: 'PRODUIT-INVALID', // Invalid: uppercase and spaces
        price: '100'
      };

      const result = await importRow('store-id', 'products', invalidRow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('slug');
    });

    it('should reject negative price', async () => {
      const invalidRow = {
        name: 'Produit Test',
        slug: 'produit-test',
        price: '-100' // Invalid: negative price
      };

      const result = await importRow('store-id', 'products', invalidRow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('positif');
    });

    it('should sanitize HTML in descriptions', async () => {
      const mockSupabase = vi.mocked(supabase);
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      } as any);

      const dangerousRow = {
        name: 'Produit Test',
        slug: 'produit-test',
        price: '100',
        description: '<script>alert("danger")</script><p>Contenu sûr</p>' // Dangerous HTML
      };

      await importRow('store-id', 'products', dangerousRow);

      // Vérifier que le script a été supprimé mais pas le paragraphe
      const insertCall = mockInsert.mock.calls[0][0];
      expect(insertCall.description).not.toContain('<script>');
      expect(insertCall.description).toContain('<p>Contenu sûr</p>');
    });
  });
});