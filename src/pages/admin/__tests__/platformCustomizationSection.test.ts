import { describe, it, expect } from 'vitest';
import { parseActiveSection, buildSectionHref } from '@/pages/admin/PlatformCustomization';

describe('platform customization section routing', () => {
  it('defaults to design when section is missing', () => {
    expect(parseActiveSection('')).toBe('design');
    expect(parseActiveSection('?')).toBe('design');
  });

  it('parses valid section from search string', () => {
    expect(parseActiveSection('?section=settings')).toBe('settings');
    expect(parseActiveSection('?section=security')).toBe('security');
    expect(parseActiveSection('?section=footer')).toBe('footer');
  });

  it('falls back to design for invalid section', () => {
    expect(parseActiveSection('?section=invalid')).toBe('design');
    expect(parseActiveSection('?section=')).toBe('design');
  });

  it('builds stable admin URLs per section', () => {
    expect(buildSectionHref('settings')).toBe('/admin/platform-customization?section=settings');
    expect(buildSectionHref('pages')).toBe('/admin/platform-customization?section=pages');
  });
});
