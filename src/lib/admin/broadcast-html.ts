export type BroadcastEmailDesign = 'classic' | 'premium' | 'announcement' | 'minimal';

export const EMAIL_DESIGN_OPTIONS: {
  value: BroadcastEmailDesign;
  label: string;
  description: string;
}[] = [
  { value: 'premium', label: 'Premium', description: 'En-tête dégradé, carte élégante' },
  { value: 'announcement', label: 'Annonce', description: 'Bandeau accent, style événement' },
  { value: 'classic', label: 'Classique', description: 'Mise en page sobre et lisible' },
  { value: 'minimal', label: 'Minimal', description: 'Texte épuré, sans fioritures' },
];

export function stripHtmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function hasMeaningfulHtml(html: string): boolean {
  const stripped = stripHtmlToPlainText(html);
  return stripped.length > 0 || /<img\s/i.test(html);
}

export function resolveBroadcastBodies(
  message: string,
  messageHtml?: string
): {
  plain: string;
  html: string;
} {
  const html = (messageHtml || '').trim();
  if (html && hasMeaningfulHtml(html)) {
    const plain = stripHtmlToPlainText(html) || message.trim();
    return { plain, html };
  }
  const plain = message.trim();
  const escaped = plain
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return { plain, html: `<p>${escaped}</p>` };
}
