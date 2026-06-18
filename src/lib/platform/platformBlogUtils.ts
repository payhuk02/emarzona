import { looksLikeHtml } from '@/lib/content/plain-text-content';

export function slugifyBlog(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96);
}

export function estimateReadingTimeMinutes(content: string): number {
  const plain = looksLikeHtml(content) ? content.replace(/<[^>]+>/g, ' ') : content;
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
}
