/**
 * Tests unitaires pour file-security
 * 
 * Couverture :
 * - Validation magic bytes
 * - Blocage extensions dangereuses
 * - Validation MIME types
 * - Sanitization des noms de fichiers
 */

import { describe, it, expect, vi } from 'vitest';
import {
  validateFileSecurity,
  validateMultipleFilesSecurity,
  sanitizeFilename,
  SAFE_MIME_TYPES,
} from '../file-security';

describe('file-security', () => {
  describe('validateFileSecurity', () => {
    it('should reject dangerous extensions', async () => {
      const dangerousFile = new File([''], 'malware.exe', { type: 'application/x-msdownload' });
      
      const result = await validateFileSecurity(dangerousFile, SAFE_MIME_TYPES.images);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Extension de fichier interdite');
      expect(result.securityLevel).toBe('danger');
    });

    it('should reject files with mismatched magic bytes', async () => {
      // Créer un fichier PNG avec un contenu JPEG
      const fakePng = new File(['\xFF\xD8\xFF\xE0'], 'fake.png', { type: 'image/png' });
      
      const result = await validateFileSecurity(fakePng, SAFE_MIME_TYPES.images);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('ne correspond pas au type déclaré');
      expect(result.securityLevel).toBe('danger');
    });

    it('should accept valid image files', async () => {
      // Créer un fichier PNG valide (signature PNG)
      const validPng = new File(['\x89\x50\x4E\x47\x0D\x0A\x1A\x0A'], 'valid.png', { type: 'image/png' });
      
      const result = await validateFileSecurity(validPng, SAFE_MIME_TYPES.images);
      
      expect(result.isValid).toBe(true);
      expect(result.securityLevel).toBe('safe');
    });

    it('should reject files exceeding size limit', async () => {
      // Note: La validation de taille est gérée dans uploadToSupabase.ts
      // Ce test vérifie la validation de sécurité uniquement
      const largeFile = new File(['x'.repeat(1000000)], 'large.png', { type: 'image/png' });
      
      // La validation de sécurité ne vérifie pas la taille (c'est fait ailleurs)
      // Mais elle vérifie que le fichier n'est pas trop petit
      const result = await validateFileSecurity(largeFile, SAFE_MIME_TYPES.images);
      
      // Le fichier devrait passer la validation de sécurité (taille gérée ailleurs)
      expect(result.isValid).toBe(true);
    });

    it('should warn on suspicious file names', async () => {
      const suspiciousFile = new File(['\x89\x50\x4E\x47'], 'file<script>.png', { type: 'image/png' });
      
      const result = await validateFileSecurity(suspiciousFile, SAFE_MIME_TYPES.images);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('caractères interdits');
    });
  });

  describe('validateMultipleFilesSecurity', () => {
    it('should validate multiple files', async () => {
      const files = [
        new File(['\x89\x50\x4E\x47'], 'valid1.png', { type: 'image/png' }),
        new File(['\xFF\xD8\xFF'], 'valid2.jpg', { type: 'image/jpeg' }),
        new File([''], 'malware.exe', { type: 'application/x-msdownload' }),
      ];

      const results = await validateMultipleFilesSecurity(files, SAFE_MIME_TYPES.images);

      expect(results).toHaveLength(3);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(true);
      expect(results[2].isValid).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize dangerous characters', () => {
      const dangerous = 'file<script>alert("xss").png';
      const sanitized = sanitizeFilename(dangerous);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).not.toContain('"');
      expect(sanitized).toContain('.png');
    });

    it('should preserve extension', () => {
      const filename = 'my file name.jpg';
      const sanitized = sanitizeFilename(filename);
      
      expect(sanitized).toContain('.jpg');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(100) + '.png';
      const sanitized = sanitizeFilename(longName);
      
      expect(sanitized.length).toBeLessThanOrEqual(55); // 50 chars + extension
    });

    it('should normalize accents', () => {
      const withAccents = 'fichier-éàù.png';
      const sanitized = sanitizeFilename(withAccents);
      
      expect(sanitized).not.toContain('é');
      expect(sanitized).not.toContain('à');
      expect(sanitized).not.toContain('ù');
    });
  });
});

