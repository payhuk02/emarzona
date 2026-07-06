import { describe, expect, it } from 'vitest';
import { countPlainTextWords, htmlToPlainTextForCount } from '@/lib/string-utils';

describe('countPlainTextWords', () => {
  it('ignores HTML tags when counting words', () => {
    const html = '<p>Hello <strong>world</strong></p><ul><li>One</li><li>Two</li></ul>';
    expect(countPlainTextWords(html)).toBe(4);
  });

  it('decodes common HTML entities', () => {
    expect(htmlToPlainTextForCount('Tom&amp;Jerry')).toBe('Tom&Jerry');
    expect(countPlainTextWords('<p>caf&eacute; noir</p>')).toBe(2);
  });

  it('returns 0 for empty or tag-only content', () => {
    expect(countPlainTextWords('')).toBe(0);
    expect(countPlainTextWords('<br><hr>')).toBe(0);
  });
});
