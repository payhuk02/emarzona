import { describe, expect, it } from 'vitest';
import { buildDigitalProductFilesPayload } from '@/lib/digital/build-digital-product-files-payload';

describe('buildDigitalProductFilesPayload', () => {
  it('maps downloadable_files when present', () => {
    const rows = buildDigitalProductFilesPayload({
      downloadable_files: [
        {
          name: 'ebook.pdf',
          url: 'products:digital/store/ebook.pdf',
          size: 2 * 1024 * 1024,
          format: 'pdf',
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].is_main).toBe(true);
    expect(rows[0].file_url).toContain('ebook.pdf');
  });

  it('synthesizes main file row from main_file_url alone', () => {
    const rows = buildDigitalProductFilesPayload({
      main_file_url: 'products:digital/store/main.zip',
      main_file_version: '2.0',
      mainFileMeta: { name: 'bundle.zip', size: 5 * 1024 * 1024, type: 'zip' },
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'bundle.zip',
      file_url: 'products:digital/store/main.zip',
      file_type: 'zip',
      is_main: true,
      version: '2.0',
    });
  });

  it('returns empty array when no files', () => {
    expect(buildDigitalProductFilesPayload({})).toEqual([]);
  });
});
