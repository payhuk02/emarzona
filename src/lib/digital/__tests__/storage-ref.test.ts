import { describe, expect, it } from 'vitest';
import {
  fileNameFromRef,
  normalizeFileStorageRef,
  parseFileRef,
  toCanonicalStorageRef,
} from '@/lib/digital/storage-ref';

describe('storage-ref', () => {
  it('normalizes relative paths to products bucket canonical ref', () => {
    expect(normalizeFileStorageRef('digital/abc/file.pdf')).toBe('products:digital/abc/file.pdf');
  });

  it('normalizes public supabase storage URLs', () => {
    const url = 'https://project.supabase.co/storage/v1/object/public/products/digital/x/file.zip';
    expect(normalizeFileStorageRef(url)).toBe('products:digital/x/file.zip');
  });

  it('preserves external URLs', () => {
    const external = 'https://cdn.example.com/files/ebook.pdf';
    expect(normalizeFileStorageRef(external)).toBe(external);
  });

  it('parses canonical storage refs', () => {
    expect(parseFileRef('products:digital/a.pdf')).toEqual({
      kind: 'storage',
      bucket: 'products',
      path: 'digital/a.pdf',
    });
  });

  it('extracts file names', () => {
    expect(fileNameFromRef('products:digital/a/my-ebook.pdf')).toBe('my-ebook.pdf');
    expect(toCanonicalStorageRef('products', '/digital/a.pdf')).toBe('products:digital/a.pdf');
  });
});
