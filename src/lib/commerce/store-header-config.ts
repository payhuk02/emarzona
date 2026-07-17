import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Calendar,
  Download,
  GraduationCap,
  Headphones,
  Palette,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import type { Store } from '@/hooks/useStores';

export type StoreHeaderTrustBadge = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type StoreHeaderValueProp = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type StoreHeaderTabConfig = {
  /** i18n key for the products tab label */
  productsLabelKey: string;
  showAbout: boolean;
  showReviews: boolean;
  showContact: boolean;
};

export type StoreHeaderProfile = {
  /** Default hero subtitle when none is configured */
  heroSubtitle: string;
  trustBadges: readonly StoreHeaderTrustBadge[];
  valueProps: readonly StoreHeaderValueProp[];
  tabs: StoreHeaderTabConfig;
};

export const STORE_HEADER_PROFILES: Record<StoreCommerceType, StoreHeaderProfile> = {
  physical: {
    heroSubtitle: 'Des produits de qualité, livrés chez vous.',
    trustBadges: [
      { id: 'secure-payment', label: 'Paiement 100% sécurisé', icon: ShieldCheck },
      { id: 'tracked-shipping', label: 'Expédition suivie', icon: Truck },
    ],
    valueProps: [
      { id: 'quality', label: 'Qualité premium', icon: Award },
      { id: 'shipping', label: 'Livraison sécurisée', icon: Truck },
      { id: 'secure', label: 'Paiement sécurisé', icon: ShieldCheck },
      { id: 'support', label: 'Support réactif', icon: Headphones },
    ],
    tabs: {
      productsLabelKey: 'storefront.tabs.products',
      showAbout: true,
      showReviews: true,
      showContact: true,
    },
  },
  digital: {
    heroSubtitle: 'Des formations digitales de qualité pour booster vos compétences.',
    trustBadges: [
      { id: 'secure-payment', label: 'Paiement 100% sécurisé', icon: ShieldCheck },
      { id: 'instant-access', label: 'Accès immédiat', icon: Zap },
    ],
    valueProps: [
      { id: 'complete', label: 'Formations complètes', icon: GraduationCap },
      { id: 'premium', label: 'Contenus premium', icon: Download },
      { id: 'secure', label: 'Paiement sécurisé', icon: ShieldCheck },
      { id: 'support', label: 'Support réactif', icon: Headphones },
    ],
    tabs: {
      productsLabelKey: 'storefront.tabs.productsDigital',
      showAbout: true,
      showReviews: true,
      showContact: true,
    },
  },
  service: {
    heroSubtitle: 'Réservez vos prestations en ligne, simplement.',
    trustBadges: [
      { id: 'secure-payment', label: 'Paiement 100% sécurisé', icon: ShieldCheck },
      { id: 'online-booking', label: 'Réservation en ligne', icon: Calendar },
    ],
    valueProps: [
      { id: 'experts', label: 'Experts certifiés', icon: Award },
      { id: 'booking', label: 'Créneaux flexibles', icon: Calendar },
      { id: 'secure', label: 'Paiement sécurisé', icon: ShieldCheck },
      { id: 'support', label: 'Support réactif', icon: Headphones },
    ],
    tabs: {
      productsLabelKey: 'storefront.tabs.services',
      showAbout: true,
      showReviews: true,
      showContact: true,
    },
  },
  course: {
    heroSubtitle: 'Apprenez à votre rythme avec des parcours structurés.',
    trustBadges: [
      { id: 'secure-payment', label: 'Paiement 100% sécurisé', icon: ShieldCheck },
      { id: 'lifetime-access', label: 'Accès à vie', icon: Zap },
    ],
    valueProps: [
      { id: 'modules', label: 'Modules structurés', icon: GraduationCap },
      { id: 'progress', label: 'Progression suivie', icon: Award },
      { id: 'secure', label: 'Paiement sécurisé', icon: ShieldCheck },
      { id: 'support', label: 'Support réactif', icon: Headphones },
    ],
    tabs: {
      productsLabelKey: 'storefront.tabs.courses',
      showAbout: true,
      showReviews: true,
      showContact: true,
    },
  },
  artist: {
    heroSubtitle: 'Découvrez des œuvres authentiques et des collections exclusives.',
    trustBadges: [
      { id: 'secure-payment', label: 'Paiement 100% sécurisé', icon: ShieldCheck },
      { id: 'authenticity', label: 'Authenticité garantie', icon: Palette },
    ],
    valueProps: [
      { id: 'authentic', label: 'Authenticité garantie', icon: Award },
      { id: 'certificate', label: 'Certificat disponible', icon: ShieldCheck },
      { id: 'limited', label: 'Éditions limitées', icon: Palette },
      { id: 'support', label: 'Support réactif', icon: Headphones },
    ],
    tabs: {
      productsLabelKey: 'storefront.tabs.artworks',
      showAbout: true,
      showReviews: true,
      showContact: true,
    },
  },
};

export function getStoreHeaderProfile(commerceType?: StoreCommerceType | null): StoreHeaderProfile {
  return STORE_HEADER_PROFILES[parseStoreCommerceType(commerceType)];
}

export function resolveStorefrontCommerceType(
  store: Pick<Store, 'commerce_type'> | null | undefined,
  products?: ReadonlyArray<{ product_type?: string | null }>
): StoreCommerceType {
  if (store?.commerce_type) {
    return parseStoreCommerceType(store.commerce_type);
  }

  if (products?.length) {
    const counts = new Map<StoreCommerceType, number>();
    for (const product of products) {
      const type = parseStoreCommerceType(product.product_type);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    let best: StoreCommerceType = 'physical';
    let bestCount = 0;
    for (const [type, count] of counts) {
      if (count > bestCount) {
        best = type;
        bestCount = count;
      }
    }
    return best;
  }

  return 'physical';
}

export function storeHasContactSection(store: Store | null | undefined): boolean {
  if (!store) return false;
  return Boolean(
    store.contact_email ||
    store.contact_phone ||
    store.address_line1 ||
    store.city ||
    store.opening_hours
  );
}

export function resolveStoreHeaderTabs(
  commerceType: StoreCommerceType | null | undefined,
  store: Store | null | undefined
): StoreHeaderTabConfig {
  const profile = getStoreHeaderProfile(commerceType);
  const hasContact = storeHasContactSection(store);

  return {
    ...profile.tabs,
    showContact: profile.tabs.showContact && hasContact,
  };
}

export function resolveStoreHeroTitle(storeName: string, customTitle?: string | null): string {
  const trimmed = customTitle?.trim();
  if (trimmed && trimmed !== 'Boutique') {
    return trimmed;
  }
  return storeName;
}

export function resolveStoreHeroSubtitle(
  commerceType: StoreCommerceType | null | undefined,
  options?: {
    customSubtitle?: string | null;
    storeDescription?: string | null;
  }
): string | null {
  const custom = options?.customSubtitle?.trim();
  if (custom && custom !== 'Découvrez nos produits') {
    return custom;
  }
  const description = options?.storeDescription?.trim();
  if (description) return description;
  return getStoreHeaderProfile(commerceType).heroSubtitle;
}

/** Whether the location block is relevant for the contact tab */
export function showStoreLocationInContact(
  commerceType: StoreCommerceType | null | undefined
): boolean {
  const type = parseStoreCommerceType(commerceType);
  return type === 'physical' || type === 'service' || type === 'artist';
}

export function storeHeaderLocationHint(
  commerceType: StoreCommerceType | null | undefined
): string {
  const type = parseStoreCommerceType(commerceType);
  if (type === 'service') return 'Adresse & horaires de rendez-vous';
  if (type === 'artist') return 'Atelier & expositions';
  return 'Adresse & horaires';
}
