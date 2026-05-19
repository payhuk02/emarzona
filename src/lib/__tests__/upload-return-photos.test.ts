import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadReturnPhotos } from '../returns/upload-return-photos';

vi.mock('@/services/fileUploadService', () => ({
  uploadFileToStorage: vi.fn(),
}));

import { uploadFileToStorage } from '@/services/fileUploadService';

describe('uploadReturnPhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne les URLs publiques', async () => {
    vi.mocked(uploadFileToStorage).mockResolvedValue({
      path: 'returns/u1/o1/photo.jpg',
      publicUrl: 'https://example.com/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1000,
    });

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    const urls = await uploadReturnPhotos([file], 'u1', 'o1');

    expect(urls).toEqual(['https://example.com/photo.jpg']);
    expect(uploadFileToStorage).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ bucket: 'attachments', folder: 'returns/u1/o1' })
    );
  });

  it('retourne un tableau vide sans fichiers', async () => {
    const urls = await uploadReturnPhotos([], 'u1', 'o1');
    expect(urls).toEqual([]);
    expect(uploadFileToStorage).not.toHaveBeenCalled();
  });
});
