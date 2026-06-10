import { describe, expect, it } from 'vitest';
import {
  extractAttachmentPath,
  parseAttachmentStorageRef,
  toAttachmentStorageRef,
} from '@/lib/attachments/storage-ref';

describe('attachment storage-ref', () => {
  it('round-trips canonical refs', () => {
    const ref = toAttachmentStorageRef('returns/u1/o1/photo.jpg');
    expect(parseAttachmentStorageRef(ref)).toEqual({
      bucket: 'attachments',
      path: 'returns/u1/o1/photo.jpg',
    });
  });

  it('extracts path from legacy public URL', () => {
    expect(
      extractAttachmentPath(
        'https://x.supabase.co/storage/v1/object/public/attachments/returns/u1/o1/a.jpg'
      )
    ).toBe('returns/u1/o1/a.jpg');
  });
});
