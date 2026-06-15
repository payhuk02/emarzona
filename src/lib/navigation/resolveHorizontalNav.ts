import type { TFunction } from 'i18next';
import {
  BUYER_HORIZONTAL_NAV_SECTIONS,
  HORIZONTAL_MEGA_SUBGROUPS,
  SELLER_HORIZONTAL_NAV_SECTIONS,
  type HorizontalNavSectionSpec,
} from '@/config/navigation.horizontal';
import { PHASE6_CONTEXT_CONFIGS } from '@/config/navigation.context.phase6';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { getNavItemPath, isNavItemActive } from '@/config/navigation.helpers';
import { resolveNavItemIcon } from '@/config/navigation.icons';
import { translateNavSections } from '@/config/navigation.i18n';
import { userMenuSections } from '@/config/navigation.menus';
import { filterSellerNavSectionsByAccess } from '@/config/navigation.rbac';
import type { NavItem, NavSection, SidebarPersona } from '@/config/navigation.types';
import { isNavPathPlanLocked } from '@/lib/navigation/plan-lock-nav';

export type HorizontalNavLink = {
  title: string;
  url: string;
  path: string;
  icon: NavItem['icon'];
  locked: boolean;
};

export type HorizontalNavSubgroup = {
  groupKey: string;
  label: string;
  items: HorizontalNavLink[];
};

export type HorizontalNavDomain = HorizontalNavSectionSpec & {
  label: string;
  items: HorizontalNavLink[];
  subgroups: HorizontalNavSubgroup[] | null;
  isActive: boolean;
};

function pathMatches(itemUrl: string, pattern: string): boolean {
  const itemPath = itemUrl.split('?')[0];
  const patternPath = pattern.split('?')[0];
  return itemUrl === pattern || itemPath === patternPath || itemPath.startsWith(`${patternPath}/`);
}

function toLink(item: NavItem, planSlug: string | null | undefined): HorizontalNavLink {
  const path = getNavItemPath(item.url);
  return {
    title: item.title,
    url: item.url,
    path,
    icon: resolveNavItemIcon(item.url, item.icon),
    locked: isNavPathPlanLocked(path, planSlug),
  };
}

function buildSubgroups(
  sectionKey: string,
  items: HorizontalNavLink[],
  t: TFunction
): HorizontalNavSubgroup[] | null {
  const defs = HORIZONTAL_MEGA_SUBGROUPS[sectionKey];
  if (!defs?.length) return null;

  const assigned = new Set<string>();
  const subgroups: HorizontalNavSubgroup[] = [];

  for (const def of defs) {
    const groupItems = items.filter(
      i => def.paths.includes(i.path) || def.paths.some(p => i.path.startsWith(`${p}/`))
    );
    groupItems.forEach(i => assigned.add(i.path));
    if (groupItems.length === 0) continue;
    subgroups.push({
      groupKey: def.groupKey,
      label: t(`sidebar.contextGroups.${def.groupKey}`, { defaultValue: def.defaultLabel }),
      items: groupItems,
    });
  }

  const others = items.filter(i => !assigned.has(i.path));
  if (others.length > 0) {
    subgroups.push({
      groupKey: 'other',
      label: t('sidebar.contextGroups.other', { defaultValue: 'Autres' }),
      items: others,
    });
  }

  return subgroups.length > 0 ? subgroups : null;
}

function collectBuyerAccountItems(sections: NavSection[]): NavItem[] {
  const config = PHASE6_CONTEXT_CONFIGS.account;
  const keys = [config.sectionKey, ...(config.additionalSectionKeys ?? [])];
  const seen = new Set<string>();
  const items: NavItem[] = [];

  for (const key of keys) {
    const section = sections.find(s => s.sectionKey === key);
    if (!section) continue;
    for (const item of section.items) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      items.push(item);
    }
  }

  if (!config.includePaths?.length) return items;
  return items.filter(item => config.includePaths!.some(p => pathMatches(item.url, p)));
}

function resolveSellerHorizontalNavDomains(
  input: {
    isPlatformAdmin: boolean;
    physicalPlanSlug?: string | null;
    pathname: string;
    search: string;
    t: TFunction;
  },
  sections: ReturnType<typeof translateNavSections>
): HorizontalNavDomain[] {
  const byKey = new Map(sections.map(s => [s.sectionKey, s]));
  const domains: HorizontalNavDomain[] = [];

  for (const spec of SELLER_HORIZONTAL_NAV_SECTIONS) {
    const section = byKey.get(spec.sectionKey);
    if (!section || section.items.length === 0) continue;

    const items = section.items.map(item => toLink(item, input.physicalPlanSlug));
    const isActive = items.some(item =>
      isNavItemActive(item.url, input.pathname, input.search, 'prefix')
    );
    const shortLabel = spec.shortLabelKey
      ? input.t(spec.shortLabelKey, { defaultValue: spec.shortLabel })
      : spec.shortLabel;

    domains.push({
      ...spec,
      shortLabel,
      label: section.label,
      items,
      subgroups: buildSubgroups(spec.sectionKey, items, input.t),
      isActive,
    });
  }

  return domains;
}

function resolveBuyerHorizontalNavDomains(input: {
  pathname: string;
  search: string;
  t: TFunction;
}): HorizontalNavDomain[] {
  const sections = translateNavSections(enrichNavSections(userMenuSections), input.t);
  const accountItems = collectBuyerAccountItems(sections);
  const accountConfig = PHASE6_CONTEXT_CONFIGS.account;
  const domains: HorizontalNavDomain[] = [];

  for (const spec of BUYER_HORIZONTAL_NAV_SECTIONS) {
    const group = accountConfig.groups.find(g => g.groupKey === spec.domainKey);
    const groupPaths = group?.paths ?? [];
    const items = accountItems
      .filter(item => groupPaths.some(p => pathMatches(item.url, p)))
      .map(item => toLink(item, null));

    if (items.length === 0) continue;

    const isActive = items.some(item =>
      isNavItemActive(item.url, input.pathname, input.search, 'prefix')
    );
    const shortLabel = spec.shortLabelKey
      ? input.t(spec.shortLabelKey, { defaultValue: spec.shortLabel })
      : spec.shortLabel;
    const label = group
      ? input.t(`sidebar.contextGroups.${group.groupKey}`, { defaultValue: group.defaultLabel })
      : shortLabel;

    domains.push({
      ...spec,
      shortLabel,
      label,
      items,
      subgroups: null,
      isActive,
    });
  }

  return domains;
}

export function resolveHorizontalNavDomains(input: {
  persona?: SidebarPersona;
  isPlatformAdmin: boolean;
  physicalPlanSlug?: string | null;
  pathname: string;
  search: string;
  t: TFunction;
}): HorizontalNavDomain[] {
  const persona = input.persona ?? 'seller';

  if (persona === 'buyer') {
    return resolveBuyerHorizontalNavDomains(input);
  }

  let sections = filterNavSections(enrichNavSections(userMenuSections), 'seller', {
    sidebarOnly: false,
  });
  sections = filterSellerNavSectionsByAccess(sections, {
    isPlatformAdmin: input.isPlatformAdmin,
  });
  sections = translateNavSections(sections, input.t);

  return resolveSellerHorizontalNavDomains(input, sections);
}
