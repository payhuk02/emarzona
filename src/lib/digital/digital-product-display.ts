import { getCategoriesForProductType } from '@/constants/product-categories';

const CATEGORY_TO_DIGITAL_TYPE: Record<string, string> = {
  formation: 'video',
  cours: 'course_files',
  ebook: 'ebook',
  template: 'template',
  logiciel: 'software',
  guide: 'document',
  checklist: 'document',
  audio: 'music',
  video: 'video',
  app: 'app',
  plugin: 'plugin',
  extension: 'plugin',
  theme: 'template',
  preset: 'template',
  script: 'software',
  font: 'document',
  icone: 'graphic',
  graphisme: 'graphic',
  '3d': 'graphic',
  pack: 'other',
  autre: 'other',
};

export function mapCategoryToDigitalType(category: string | null | undefined): string {
  if (!category?.trim()) return 'other';
  const key = category.trim().toLowerCase();
  return CATEGORY_TO_DIGITAL_TYPE[key] ?? 'other';
}

export function getDigitalCategoryLabel(category: string | null | undefined): string {
  if (!category?.trim()) return '';
  const categories = getCategoriesForProductType('digital');
  const found = categories.find(cat => cat.value === category);
  if (found) return found.label;
  return category.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export function listedSizeToMb(size: number | null | undefined, unit: 'mb' | 'gb' = 'mb'): number {
  if (!size || size <= 0) return 0;
  return unit === 'gb' ? size * 1024 : size;
}

export function formatDigitalFileSizeMb(sizeMb: number | null | undefined): string {
  if (!sizeMb || sizeMb <= 0) return '—';
  if (sizeMb >= 1024) {
    return `${(sizeMb / 1024).toFixed(sizeMb >= 10240 ? 1 : 2)} Go`;
  }
  return `${sizeMb.toFixed(sizeMb >= 100 ? 0 : 2)} Mo`;
}

export function formatDigitalFileFormat(format: string | null | undefined): string {
  if (!format?.trim()) return '—';
  const normalized = format.trim().toLowerCase();
  if (
    normalized === 'unknown' ||
    normalized === 'octet-stream' ||
    normalized === 'application/octet-stream'
  ) {
    return '—';
  }
  return format.trim().toUpperCase();
}

export function resolveDigitalDisplayPrice(
  price: number,
  promotionalPrice: number | null | undefined
): { displayPrice: number; compareAtPrice: number | null; hasPromo: boolean } {
  const hasPromo = promotionalPrice != null && promotionalPrice >= 0 && promotionalPrice < price;
  return {
    displayPrice: hasPromo ? promotionalPrice : price,
    compareAtPrice: hasPromo ? price : null,
    hasPromo,
  };
}
