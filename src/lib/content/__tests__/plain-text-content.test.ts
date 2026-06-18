import { describe, expect, it } from 'vitest';
import {
  htmlToPlainText,
  isPlainTextListBlock,
  isPlainTextSectionHeading,
  looksLikeHtml,
  normalizeContentForDisplay,
  plainTextToPageHtml,
  splitPlainTextParagraphs,
  toRichEditorContent,
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

  it('converts structured plain text to HTML', () => {
    const plain = '1. Introduction\n\nParagraphe.\n\n- Un\n- Deux';
    const html = plainTextToPageHtml(plain);
    expect(html).toContain('<h2>1. Introduction</h2>');
    expect(html).toContain('<p>Paragraphe.</p>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Un</li>');
  });

  it('toRichEditorContent preserves HTML and converts plain text', () => {
    expect(toRichEditorContent('<p>Hi</p>')).toBe('<p>Hi</p>');
    expect(toRichEditorContent('Hello')).toContain('<p>Hello</p>');
  });
});
