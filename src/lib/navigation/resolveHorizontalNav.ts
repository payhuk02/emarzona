import type { TFunction } from 'i18next';
import {
  HORIZONTAL_MEGA_SUBGROUPS,
  SELLER_HORIZONTAL_NAV_SECTIONS,
  type HorizontalNavSectionSpec,
} from '@/config/navigation.horizontal';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { getNavItemPath, isNavItemActive } from '@/config/navigation.helpers';
import { resolveNavItemIcon } from '@/config/navigation.icons';
import { translateNavSections } from '@/config/navigation.i18n';
import { userMenuSections } from '@/config/navigation.menus';
import { filterSellerNavSectionsByAccess } from '@/config/navigation.rbac';
import type { NavItem, SidebarPersona } from '@/config/navigation.types';
import {
  hasPhysicalFeatureAccess,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';
import { requiredPhysicalFeatureForPath } from '@/lib/billing/physical-route-capabilities';

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

function toLink(item: NavItem, planSlug: string | null | undefined): HorizontalNavLink {
  const path = getNavItemPath(item.url);
  const feature = requiredPhysicalFeatureForPath(path);
  const locked =
    Boolean(feature) &&
    (!planSlug || !hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, feature));

  return {
    title: item.title,
    url: item.url,
    path,
    icon: resolveNavItemIcon(item.url, item.icon),
    locked,
  };
}

function buildSubgroups(
  sectionKey: string,
  items: HorizontalNavLink[],
  t: TFunction
): HorizontalNavSubgroup[] | null {
  const defs = HORIZONTAL_MEGA_SUBGROUPS[sectionKey];
  if (!defs?.length) return null;

  const pathSet = new Set(items.map(i => i.path));
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

export function resolveHorizontalNavDomains(input: {
  persona?: SidebarPersona;
  isPlatformAdmin: boolean;
  physicalPlanSlug?: string | null;
  pathname: string;
  search: string;
  t: TFunction;
}): HorizontalNavDomain[] {
  const persona = input.persona ?? 'seller';
  let sections = filterNavSections(enrichNavSections(userMenuSections), persona, {
    sidebarOnly: false,
  });
  sections = filterSellerNavSectionsByAccess(sections, {
    isPlatformAdmin: input.isPlatformAdmin,
  });
  sections = translateNavSections(sections, input.t);

  const byKey = new Map(sections.map(s => [s.sectionKey, s]));
  const domains: HorizontalNavDomain[] = [];

  for (const spec of SELLER_HORIZONTAL_NAV_SECTIONS) {
    const section = byKey.get(spec.sectionKey);
    if (!section || section.items.length === 0) continue;

    const items = section.items.map(item => toLink(item, input.physicalPlanSlug));
    const isActive = items.some(item => isNavItemActive(item.url, input.pathname, input.search));

    domains.push({
      ...spec,
      label: section.label,
      items,
      subgroups: buildSubgroups(spec.sectionKey, items, input.t),
      isActive,
    });
  }

  return domains;
}
