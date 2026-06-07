import type { TFunction } from 'i18next';
import type { FlatNavEntry, NavItem, NavSection } from '@/config/navigation.types';

export function urlToSidebarItemKey(url: string): string {
  const path = url.split('?')[0];
  return (
    path
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'root'
  );
}

export function sectionLabelToKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function translateNavItemTitle(item: Pick<NavItem, 'title' | 'url'>, t: TFunction): string {
  const key = `sidebar.items.${urlToSidebarItemKey(item.url)}`;
  return t(key, { defaultValue: item.title });
}

export function translateNavSectionLabel(
  section: Pick<NavSection, 'label' | 'sectionKey'>,
  t: TFunction
): string {
  const key = `sidebar.sections.${section.sectionKey}`;
  return t(key, { defaultValue: section.label });
}

export function translateNavSections(sections: NavSection[], t: TFunction): NavSection[] {
  return sections.map(section => ({
    ...section,
    label: translateNavSectionLabel(section, t),
    items: section.items.map(item => ({
      ...item,
      title: translateNavItemTitle(item, t),
    })),
  }));
}

export function translateFlatNavEntries(entries: FlatNavEntry[], t: TFunction): FlatNavEntry[] {
  return entries.map(entry => ({
    ...entry,
    title: translateNavItemTitle(entry, t),
    sectionLabel: translateNavSectionLabel(
      { label: entry.sectionLabel, sectionKey: entry.sectionKey },
      t
    ),
  }));
}

/** Validates that every sidebar item has an i18n key (defaults cover gaps). */
export function collectSidebarI18nKeys(sections: NavSection[]): {
  sectionKeys: string[];
  itemKeys: string[];
} {
  return {
    sectionKeys: sections.map(s => `sidebar.sections.${s.sectionKey}`),
    itemKeys: sections.flatMap(s =>
      s.items.map(i => `sidebar.items.${urlToSidebarItemKey(i.url)}`)
    ),
  };
}
