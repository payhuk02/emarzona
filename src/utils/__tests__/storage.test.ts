/**
 * Tests unitaires pour storage.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCorrectedFileUrl,
  extractStoragePath,
  isValidSupabaseStorageUrl,
} from '../storage';

// Mock de l'environnement
const mockSupabaseUrl = 'https://test.supabase.co';

describe('storage', () => {
  beforeEach(() => {
    // Mock VITE_SUPABASE_URL
    vi.stubEnv('VITE_SUPABASE_URL', mockSupabaseUrl);
  });

  describe('getCorrectedFileUrl', () => {
    it('should correct a valid Supabase Storage URL', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/public/attachments/vendor-message-attachments/file.png`;
      const corrected = getCorrectedFileUrl(url);
      
      expect(corrected).toContain('/storage/v1/object/public/attachments/');
      expect(corrected).toContain('vendor-message-attachments/file.png');
    });

    it('should handle URLs with encoded paths', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/public/attachments/vendor-message-attachments/file%20with%20spaces.png`;
      const corrected = getCorrectedFileUrl(url);
      
      expect(corrected).toContain('vendor-message-attachments');
      expect(corrected).toContain('file');
    });

    it('should use storage_path when provided', () => {
      const storagePath = 'vendor-message-attachments/file.png';
      const corrected = getCorrectedFileUrl('', storagePath);
      
      expect(corrected).toBe(`${mockSupabaseUrl}/storage/v1/object/public/attachments/vendor-message-attachments/file.png`);
    });

    it('should clean storage_path prefixes', () => {
      const testCases = [
        { input: 'attachments/file.png', expected: 'file.png' },
        { input: '/attachments/file.png', expected: 'file.png' },
        { input: 'storage/v1/object/public/attachments/file.png', expected: 'file.png' },
        { input: `${mockSupabaseUrl}/storage/v1/object/public/attachments/file.png`, expected: 'file.png' },
      ];

      testCases.forEach(({ input, expected }) => {
        const corrected = getCorrectedFileUrl('', input);
        expect(corrected).toContain(expected);
      });
    });

    it('should handle relative paths', () => {
      const relativePath = 'vendor-message-attachments/file.png';
      const corrected = getCorrectedFileUrl(relativePath);
      
      expect(corrected).toBe(`${mockSupabaseUrl}/storage/v1/object/public/attachments/vendor-message-attachments/file.png`);
    });

    it('should encode path segments correctly', () => {
      const pathWithSpaces = 'folder with spaces/file name.png';
      const corrected = getCorrectedFileUrl('', pathWithSpaces);
      
      expect(corrected).toContain('folder%20with%20spaces');
      expect(corrected).toContain('file%20name.png');
    });

    it('should return original URL if VITE_SUPABASE_URL is not defined', () => {
      vi.unstubAllEnvs();
      const originalUrl = 'https://example.com/file.png';
      const corrected = getCorrectedFileUrl(originalUrl);
      
      expect(corrected).toBe(originalUrl);
      vi.stubEnv('VITE_SUPABASE_URL', mockSupabaseUrl);
    });

    it('should handle URLs with trailing slashes in base URL', () => {
      vi.stubEnv('VITE_SUPABASE_URL', `${mockSupabaseUrl}/`);
      const corrected = getCorrectedFileUrl('', 'file.png');
      
      // Vérifier qu'il n'y a pas de double slash après le protocole (https:// est normal)
      expect(corrected).not.toMatch(/https?:\/\/[^/]+\/\//);
      expect(corrected).toContain('/storage/v1/object/public/attachments/file.png');
      expect(corrected).toBe(`${mockSupabaseUrl}/storage/v1/object/public/attachments/file.png`);
    });

    it('should return original URL as fallback', () => {
      const externalUrl = 'https://example.com/image.jpg';
      const corrected = getCorrectedFileUrl(externalUrl);
      
      // Si l'URL ne correspond à aucun pattern, retourner l'originale
      expect(corrected).toBe(externalUrl);
    });
  });

  describe('extractStoragePath', () => {
    it('should extract path from public URL', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/public/attachments/vendor-message-attachments/file.png`;
      const path = extractStoragePath(url);
      
      expect(path).toBe('vendor-message-attachments/file.png');
    });

    it('should extract path from signed URL', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/sign/attachments/vendor-message-attachments/file.png?token=abc123`;
      const path = extractStoragePath(url);
      
      expect(path).toBe('vendor-message-attachments/file.png');
    });

    it('should handle encoded paths', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/public/attachments/vendor-message-attachments/file%20with%20spaces.png`;
      const path = extractStoragePath(url);
      
      expect(path).toBe('vendor-message-attachments/file with spaces.png');
    });

    it('should return null for invalid URLs', () => {
      expect(extractStoragePath('')).toBeNull();
      expect(extractStoragePath('https://example.com/file.png')).toBeNull();
      expect(extractStoragePath('not-a-url')).toBeNull();
    });

    it('should handle signed URLs without query params', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/sign/attachments/file.png`;
      const path = extractStoragePath(url);
      
      expect(path).toBe('file.png');
    });

    it('should handle nested paths', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/public/attachments/folder1/folder2/file.png`;
      const path = extractStoragePath(url);
      
      expect(path).toBe('folder1/folder2/file.png');
    });
  });

  describe('isValidSupabaseStorageUrl', () => {
    it('should return true for valid public URLs', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/public/attachments/file.png`;
      expect(isValidSupabaseStorageUrl(url)).toBe(true);
    });

    it('should return true for valid signed URLs', () => {
      const url = `${mockSupabaseUrl}/storage/v1/object/sign/attachments/file.png?token=abc123`;
      expect(isValidSupabaseStorageUrl(url)).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidSupabaseStorageUrl('')).toBe(false);
      expect(isValidSupabaseStorageUrl('https://example.com/file.png')).toBe(false);
      expect(isValidSupabaseStorageUrl('not-a-url')).toBe(false);
      expect(isValidSupabaseStorageUrl('file:///path/to/file.png')).toBe(false);
    });

    it('should return false for non-HTTP URLs', () => {
      expect(isValidSupabaseStorageUrl('ftp://example.com/file.png')).toBe(false);
    });
  });
});







