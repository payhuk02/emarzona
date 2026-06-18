/**
 * Utilitaires pour afficher du contenu texte brut (sans balises HTML).
 */

const HTML_TAG_PATTERN = /<[a-z][\s\S]*?>/i;

export function looksLikeHtml(content: string): boolean {
  return HTML_TAG_PATTERN.test(content);
}

/** Convertit un fragment HTML legacy en texte lisible (paragraphes séparés par une ligne vide). */
export function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  text = text
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

export function normalizeContentForDisplay(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '';
  return looksLikeHtml(trimmed) ? htmlToPlainText(trimmed) : trimmed;
}

export function splitPlainTextParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map(block => block.trim())
    .filter(Boolean);
}

export function isPlainTextListBlock(block: string): boolean {
  const lines = block
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  return lines.length > 0 && lines.every(line => line.startsWith('- '));
}

export function listItemsFromBlock(block: string): string[] {
  return block
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('- '))
    .map(line => line.slice(2).trim());
}

/** Titres de section du type « 1. Acceptation des conditions ». */
export function isPlainTextSectionHeading(block: string): boolean {
  const firstLine = block.split('\n')[0]?.trim() ?? '';
  return /^\d+\.\s+\S/.test(firstLine) && !block.includes('\n\n') && block.split('\n').length === 1;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convertit un contenu texte brut structuré en HTML pour l'éditeur riche et l'affichage. */
export function plainTextToPageHtml(text: string): string {
  const blocks = splitPlainTextParagraphs(text);
  if (blocks.length === 0) return '';

  return blocks
    .map(block => {
      if (isPlainTextListBlock(block)) {
        const items = listItemsFromBlock(block)
          .map(item => `<li>${escapeHtml(item)}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      if (isPlainTextSectionHeading(block)) {
        return `<h2>${escapeHtml(block)}</h2>`;
      }
      return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
}

/** Prépare le contenu pour l'éditeur riche : conserve le HTML existant ou convertit le texte brut. */
export function toRichEditorContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '';
  return looksLikeHtml(trimmed) ? trimmed : plainTextToPageHtml(trimmed);
}
