import type {
  AdminPlatformFaqCategory,
  AdminPlatformFaqItem,
} from '@/hooks/admin/useAdminPlatformFaq';
import type { PlatformFaqTranslations } from '@/lib/platform/platformFaqLocale';

export interface PlatformFaqExportPayload {
  version: 1;
  exportedAt: string;
  source: 'emarzona-admin';
  categories: Array<
    AdminPlatformFaqCategory & {
      translations: PlatformFaqTranslations;
      items: Array<AdminPlatformFaqItem & { translations: PlatformFaqTranslations }>;
    }
  >;
}

export function buildPlatformFaqExport(
  categories: AdminPlatformFaqCategory[],
  items: AdminPlatformFaqItem[]
): PlatformFaqExportPayload {
  const itemsByCategory = new Map<string, AdminPlatformFaqItem[]>();
  for (const item of items) {
    const list = itemsByCategory.get(item.category_id) ?? [];
    list.push(item);
    itemsByCategory.set(item.category_id, list);
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: 'emarzona-admin',
    categories: categories.map(cat => ({
      ...cat,
      translations:
        (cat as AdminPlatformFaqCategory & { translations?: PlatformFaqTranslations })
          .translations ?? {},
      items: (itemsByCategory.get(cat.id) ?? [])
        .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))
        .map(item => ({
          ...item,
          translations:
            (item as AdminPlatformFaqItem & { translations?: PlatformFaqTranslations })
              .translations ?? {},
        })),
    })),
  };
}

export function downloadPlatformFaqJson(
  categories: AdminPlatformFaqCategory[],
  items: AdminPlatformFaqItem[],
  filename = `emarzona-platform-faq-${new Date().toISOString().slice(0, 10)}.json`
): void {
  const payload = buildPlatformFaqExport(categories, items);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
