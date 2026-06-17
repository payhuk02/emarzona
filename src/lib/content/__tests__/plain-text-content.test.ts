import { describe, expect, it } from 'vitest';
import {
  htmlToPlainText,
  isPlainTextListBlock,
  isPlainTextSectionHeading,
  looksLikeHtml,
  normalizeContentForDisplay,
  splitPlainTextParagraphs,
} from '@/lib/content/plain-text-content';

describe('plain-text-content', () => {
  it('detects HTML fragments', () => {
    expect(looksLikeHtml('<p>Hello</p>')).toBe(true);
    expect(looksLikeHtml('Bonjour\n\nParagraphe deux.')).toBe(false);
  });

  it('converts legacy HTML to plain text', () => {
    const html = '<p>Intro</p><ul><li>Item un</li><li>Item deux</li></ul>';
    expect(normalizeContentForDisplay(html)).toContain('Intro');
    expect(normalizeContentForDisplay(html)).toContain('- Item un');
    expect(normalizeContentForDisplay(html)).not.toContain('<');
  });

  it('splits paragraphs on blank lines', () => {
    expect(splitPlainTextParagraphs('A\n\nB\n\nC')).toEqual(['A', 'B', 'C']);
  });

  it('recognizes list blocks and section headings', () => {
    expect(isPlainTextListBlock('- Un\n- Deux')).toBe(true);
    expect(isPlainTextSectionHeading('1. Acceptation des conditions')).toBe(true);
    expect(isPlainTextSectionHeading('1. Acceptation\nDétail')).toBe(false);
  });

  it('strips tags from htmlToPlainText', () => {
    expect(htmlToPlainText('<strong>Test</strong>')).toBe('Test');
  });
});
