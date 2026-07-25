import type { ComponentType } from 'react';
import { Calendar, Camera, Download, GraduationCap, ShoppingBag } from '@/components/icons';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import type { NavItem, NavSection } from '@/config/navigation.types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import { PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE } from '@/lib/commerce/store-capability-map';

type NavIcon = ComponentType<{ className?: string }>;

/** Single source of truth for the seller CRÉER entry (label + icon + path). */
export const PRIMARY_CREATE_NAV_BY_TYPE: Record<
  StoreCommerceType,
  { title: string; url: string; icon: NavIcon }
> = {
  physical: {
    title: 'Créer un produit physique',
    url: PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE.physical,
    icon: ShoppingBag,
  },
  digital: {
    title: 'Créer un produit digital',
    url: PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE.digital,
    icon: Download,
  },
  service: {
    title: 'Créer un service',
    url: PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE.service,
    icon: Calendar,
  },
  course: {
    title: 'Créer un cours',
    url: PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE.course,
    icon: GraduationCap,
  },
  artist: {
    title: "Créer une œuvre d'artiste",
    url: PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE.artist,
    icon: Camera,
  },
};

function isCreateSection(section: NavSection): boolean {
  return section.sectionKey === 'creer' || section.label === 'Créer';
}

function buildPrimaryCreateItem(commerceType: StoreCommerceType): NavItem {
  const meta = PRIMARY_CREATE_NAV_BY_TYPE[commerceType];
  return {
    title: meta.title,
    url: meta.url,
    icon: meta.icon,
    personas: ['seller'],
    tier: 'primary',
    createGroup: true,
  };
}

/**
 * Force the CRÉER sidebar section to the single wizard for this store vertical.
 * Prevents cross-type create leaks if filtering ever misses an item.
 * When commerce type is unknown, hide CRÉER entirely (fail closed).
 */
export function pinPrimaryCreateNavSection(
  sections: NavSection[],
  commerceType?: StoreCommerceType | null
): NavSection[] {
  if (commerceType == null) {
    return sections.filter(section => !isCreateSection(section));
  }

  const type = parseStoreCommerceType(commerceType);
  const primaryItem = buildPrimaryCreateItem(type);
  let replaced = false;

  const next = sections.map(section => {
    if (!isCreateSection(section)) return section;
    replaced = true;
    return { ...section, items: [primaryItem], defaultOpen: true };
  });

  if (replaced) return next.filter(section => section.items.length > 0);

  // Create section missing (e.g. buyer persona) — nothing to pin.
  return next;
}
