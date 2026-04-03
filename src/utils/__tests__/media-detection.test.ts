/**
 * Tests unitaires pour media-detection.ts
 */

import { describe, it, expect } from 'vitest';
import {
  detectMediaType,
  isImage,
  isVideo,
  isFile,
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
} from '../media-detection';

describe('media-detection', () => {
  describe('detectMediaType', () => {
    describe('Détection par extension (prioritaire)', () => {
      it('should detect image by extension', () => {
        expect(detectMediaType('photo.jpg', '')).toBe('image');
        expect(detectMediaType('image.png', '')).toBe('image');
        expect(detectMediaType('photo.JPEG', '')).toBe('image'); // Case insensitive
        expect(detectMediaType('image.GIF', '')).toBe('image');
        expect(detectMediaType('photo.webp', '')).toBe('image');
        expect(detectMediaType('icon.svg', '')).toBe('image');
        expect(detectMediaType('image.bmp', '')).toBe('image');
        expect(detectMediaType('favicon.ico', '')).toBe('image');
        expect(detectMediaType('photo.heic', '')).toBe('image');
        expect(detectMediaType('photo.heif', '')).toBe('image');
      });

      it('should detect video by extension', () => {
        expect(detectMediaType('video.mp4', '')).toBe('video');
        expect(detectMediaType('movie.webm', '')).toBe('video');
        expect(detectMediaType('clip.ogg', '')).toBe('video');
        expect(detectMediaType('film.mov', '')).toBe('video');
        expect(detectMediaType('video.avi', '')).toBe('video');
        expect(detectMediaType('movie.mkv', '')).toBe('video');
        expect(detectMediaType('clip.flv', '')).toBe('video');
        expect(detectMediaType('video.wmv', '')).toBe('video');
      });

      it('should detect file for unknown extensions', () => {
        expect(detectMediaType('document.pdf', '')).toBe('file');
        expect(detectMediaType('file.txt', '')).toBe('file');
        expect(detectMediaType('archive.zip', '')).toBe('file');
        expect(detectMediaType('script.js', '')).toBe('file');
      });
    });

    describe('Détection par type MIME (fallback)', () => {
      it('should detect image by MIME type', () => {
        expect(detectMediaType('file', 'image/jpeg')).toBe('image');
        expect(detectMediaType('file', 'image/png')).toBe('image');
        expect(detectMediaType('file', 'image/gif')).toBe('image');
        expect(detectMediaType('file', 'image/webp')).toBe('image');
        expect(detectMediaType('file', 'image/svg+xml')).toBe('image');
        expect(detectMediaType('file', 'image/bmp')).toBe('image');
        expect(detectMediaType('file', 'image/x-icon')).toBe('image');
        expect(detectMediaType('file', 'image/heic')).toBe('image');
        expect(detectMediaType('file', 'image/heif')).toBe('image');
      });

      it('should detect video by MIME type', () => {
        expect(detectMediaType('file', 'video/mp4')).toBe('video');
        expect(detectMediaType('file', 'video/mpeg')).toBe('video');
        expect(detectMediaType('file', 'video/quicktime')).toBe('video');
        expect(detectMediaType('file', 'video/x-msvideo')).toBe('video');
        expect(detectMediaType('file', 'video/webm')).toBe('video');
        expect(detectMediaType('file', 'video/ogg')).toBe('video');
      });

      it('should detect file for unknown MIME types', () => {
        expect(detectMediaType('file', 'application/pdf')).toBe('file');
        expect(detectMediaType('file', 'text/plain')).toBe('file');
        expect(detectMediaType('file', 'application/json')).toBe('file');
      });
    });

    describe('Priorité extension > MIME', () => {
      it('should prioritize extension over MIME type', () => {
        // Extension image, MIME video → should be image
        expect(detectMediaType('photo.jpg', 'video/mp4')).toBe('image');
        
        // Extension video, MIME image → should be video
        expect(detectMediaType('video.mp4', 'image/jpeg')).toBe('video');
        
        // Extension file, MIME image → should be file (extension prioritaire, mais PDF n'est pas une image)
        // Note: Si l'extension n'est pas reconnue comme image/video, on utilise le MIME type
        expect(detectMediaType('document.pdf', 'image/jpeg')).toBe('image'); // MIME type utilisé car extension non reconnue
      });
    });

    describe('Cas limites', () => {
      it('should handle empty strings', () => {
        expect(detectMediaType('', '')).toBe('file');
        expect(detectMediaType('file', '')).toBe('file');
        expect(detectMediaType('', 'image/jpeg')).toBe('image');
      });

      it('should handle null/undefined-like values', () => {
        expect(detectMediaType('file', null as any)).toBe('file');
        expect(detectMediaType(null as any, 'image/jpeg')).toBe('image');
      });

      it('should handle case insensitive extensions', () => {
        expect(detectMediaType('PHOTO.JPG', '')).toBe('image');
        expect(detectMediaType('IMAGE.PNG', '')).toBe('image');
        expect(detectMediaType('VIDEO.MP4', '')).toBe('video');
      });

      it('should handle case insensitive MIME types', () => {
        expect(detectMediaType('file', 'IMAGE/JPEG')).toBe('image');
        expect(detectMediaType('file', 'Video/Mp4')).toBe('video');
      });

      it('should handle files with multiple dots', () => {
        expect(detectMediaType('photo.backup.jpg', '')).toBe('image');
        expect(detectMediaType('video.old.mp4', '')).toBe('video');
      });

      it('should handle files without extension', () => {
        expect(detectMediaType('file', 'image/jpeg')).toBe('image');
        expect(detectMediaType('file', 'video/mp4')).toBe('video');
        expect(detectMediaType('file', 'application/pdf')).toBe('file');
      });
    });
  });

  describe('isImage', () => {
    it('should return true for images', () => {
      expect(isImage('photo.jpg', 'image/jpeg')).toBe(true);
      expect(isImage('image.png', '')).toBe(true);
      expect(isImage('file', 'image/jpeg')).toBe(true);
    });

    it('should return false for non-images', () => {
      expect(isImage('video.mp4', 'video/mp4')).toBe(false);
      expect(isImage('document.pdf', 'application/pdf')).toBe(false);
    });
  });

  describe('isVideo', () => {
    it('should return true for videos', () => {
      expect(isVideo('video.mp4', 'video/mp4')).toBe(true);
      expect(isVideo('movie.webm', '')).toBe(true);
      expect(isVideo('file', 'video/mp4')).toBe(true);
    });

    it('should return false for non-videos', () => {
      expect(isVideo('photo.jpg', 'image/jpeg')).toBe(false);
      expect(isVideo('document.pdf', 'application/pdf')).toBe(false);
    });
  });

  describe('isFile', () => {
    it('should return true for generic files', () => {
      expect(isFile('document.pdf', 'application/pdf')).toBe(true);
      expect(isFile('file.txt', 'text/plain')).toBe(true);
      expect(isFile('archive.zip', 'application/zip')).toBe(true);
    });

    it('should return false for images and videos', () => {
      expect(isFile('photo.jpg', 'image/jpeg')).toBe(false);
      expect(isFile('video.mp4', 'video/mp4')).toBe(false);
    });
  });

  describe('Constants', () => {
    it('should have IMAGE_EXTENSIONS defined', () => {
      expect(IMAGE_EXTENSIONS).toBeDefined();
      expect(IMAGE_EXTENSIONS.length).toBeGreaterThan(0);
      expect(IMAGE_EXTENSIONS).toContain('.jpg');
      expect(IMAGE_EXTENSIONS).toContain('.png');
    });

    it('should have VIDEO_EXTENSIONS defined', () => {
      expect(VIDEO_EXTENSIONS).toBeDefined();
      expect(VIDEO_EXTENSIONS.length).toBeGreaterThan(0);
      expect(VIDEO_EXTENSIONS).toContain('.mp4');
      expect(VIDEO_EXTENSIONS).toContain('.webm');
    });
  });
});







