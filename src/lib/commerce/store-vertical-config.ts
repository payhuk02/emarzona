import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import { getPrimaryProductCreatePath } from '@/lib/commerce/store-capability-map';

export interface StoreOnboardingStep {
  id: string;
  title: string;
  description: string;
  href: string;
  optional?: boolean;
}

export interface StoreVerticalProfile {
  label: string;
  tagline: string;
  defaultThemeTemplateId: string;
  recommendedThemeTemplateIds: readonly string[];
  /** Steps shown on post-creation onboarding checklist */
  onboardingSteps: readonly StoreOnboardingStep[];
  /** Whether location tab is relevant in customization wizard */
  showLocationTab: boolean;
}

const BASE_ONBOARDING = {
  customize: (storeId: string): StoreOnboardingStep => ({
    id: 'customize',
    title: 'Personnaliser la boutique',
    description: 'Logo, couleurs et identité visuelle',
    href: `/dashboard/store?storeId=${encodeURIComponent(storeId)}`,
  }),
  payments: {
    id: 'payments',
    title: 'Configurer les paiements',
    description: 'Moneroo, Stripe ou PayPal',
    href: '/dashboard/payment-connections',
  },
  seo: (storeId: string): StoreOnboardingStep => ({
    id: 'seo',
    title: 'Optimiser le référencement',
    description: 'Meta title, description et URL publique',
    href: `/dashboard/store?storeId=${encodeURIComponent(storeId)}&tab=seo`,
    optional: true,
  }),
};

export const STORE_VERTICAL_PROFILES: Record<StoreCommerceType, StoreVerticalProfile> = {
  physical: {
    label: 'Produits physiques',
    tagline: 'Vendez et expédiez vos produits avec logistique intégrée.',
    defaultThemeTemplateId: 'nature-green',
    recommendedThemeTemplateIds: ['nature-green', 'modern-blue', 'minimal-gray'],
    showLocationTab: true,
    onboardingSteps: [
      {
        id: 'first-product',
        title: 'Ajouter votre premier produit physique',
        description: 'Stock, variantes et politique de retour',
        href: '/dashboard/products/new/physical',
      },
      BASE_ONBOARDING.customize(''),
      {
        id: 'shipping',
        title: 'Configurer la livraison',
        description: 'Zones, tarifs et transporteurs',
        href: '/dashboard/shipping',
      },
      BASE_ONBOARDING.payments,
      {
        id: 'subscription',
        title: 'Activer votre essai gratuit',
        description: '30 jours pour tester la logistique physique',
        href: '/dashboard/onboarding/physical-subscription',
        optional: true,
      },
    ],
  },
  digital: {
    label: 'Produits digitaux',
    tagline: 'Vendez fichiers, licences et contenus téléchargeables.',
    defaultThemeTemplateId: 'dark-mode',
    recommendedThemeTemplateIds: ['dark-mode', 'modern-blue', 'elegant-purple'],
    showLocationTab: false,
    onboardingSteps: [
      {
        id: 'first-product',
        title: 'Publier votre premier produit digital',
        description: 'Fichiers, licences et limites de téléchargement',
        href: '/dashboard/products/new/digital',
      },
      BASE_ONBOARDING.customize(''),
      BASE_ONBOARDING.payments,
      {
        id: 'licenses',
        title: 'Configurer les licences',
        description: 'Gestion des clés et téléchargements',
        href: '/dashboard/license-management',
        optional: true,
      },
    ],
  },
  service: {
    label: 'Services',
    tagline: 'Proposez des rendez-vous et prestations réservables.',
    defaultThemeTemplateId: 'modern-blue',
    recommendedThemeTemplateIds: ['modern-blue', 'minimal-gray', 'elegant-purple'],
    showLocationTab: true,
    onboardingSteps: [
      {
        id: 'first-service',
        title: 'Créer votre premier service',
        description: 'Durée, créneaux et tarification',
        href: '/dashboard/products/new/service',
      },
      BASE_ONBOARDING.customize(''),
      {
        id: 'calendar',
        title: 'Configurer le calendrier',
        description: 'Disponibilités et réservations',
        href: '/dashboard/bookings',
      },
      BASE_ONBOARDING.payments,
    ],
  },
  course: {
    label: 'Cours en ligne',
    tagline: 'Structurez modules, leçons et parcours pédagogiques.',
    defaultThemeTemplateId: 'elegant-purple',
    recommendedThemeTemplateIds: ['elegant-purple', 'modern-blue', 'dark-mode'],
    showLocationTab: false,
    onboardingSteps: [
      {
        id: 'first-course',
        title: 'Créer votre premier cours',
        description: 'Modules, leçons et objectifs pédagogiques',
        href: '/dashboard/courses/new',
      },
      BASE_ONBOARDING.customize(''),
      BASE_ONBOARDING.payments,
      {
        id: 'cohorts',
        title: 'Configurer les cohortes',
        description: 'Sessions et inscriptions groupées',
        href: '/dashboard/cohorts',
        optional: true,
      },
    ],
  },
  artist: {
    label: "Oeuvres d'artiste",
    tagline: 'Exposez portfolio, collections et enchères.',
    defaultThemeTemplateId: 'elegant-purple',
    recommendedThemeTemplateIds: ['elegant-purple', 'dark-mode', 'minimal-gray'],
    showLocationTab: true,
    onboardingSteps: [
      {
        id: 'first-artwork',
        title: 'Publier votre première oeuvre',
        description: 'Certificat, éditions et authenticité',
        href: '/dashboard/products/new/artist',
      },
      BASE_ONBOARDING.customize(''),
      {
        id: 'portfolio',
        title: 'Configurer le portfolio',
        description: 'Galerie publique de vos créations',
        href: '/dashboard/portfolios',
        optional: true,
      },
      BASE_ONBOARDING.payments,
    ],
  },
};

export function getStoreVerticalProfile(
  commerceType?: StoreCommerceType | null
): StoreVerticalProfile {
  return STORE_VERTICAL_PROFILES[parseStoreCommerceType(commerceType)];
}

export function getStoreOnboardingSteps(
  commerceType: StoreCommerceType | null | undefined,
  storeId: string
): StoreOnboardingStep[] {
  const profile = getStoreVerticalProfile(commerceType);
  const productCreatePath = getPrimaryProductCreatePath(commerceType);

  return profile.onboardingSteps.map(step => {
    let href = step.href;

    if (
      step.id === 'first-product' ||
      step.id === 'first-service' ||
      step.id === 'first-course' ||
      step.id === 'first-artwork'
    ) {
      href = productCreatePath;
    }
    if (step.id === 'customize') {
      href = `/dashboard/store?storeId=${encodeURIComponent(storeId)}`;
    }
    if (step.id === 'seo') {
      href = `/dashboard/store?storeId=${encodeURIComponent(storeId)}&tab=seo`;
    }
    if (step.id === 'subscription' && commerceType === 'physical') {
      href = `/dashboard/onboarding/physical-subscription?storeId=${encodeURIComponent(storeId)}`;
    }
    if (step.id === 'licenses' && commerceType === 'digital') {
      href = '/dashboard/license-management';
    }

    return { ...step, href };
  });
}

export function getStoreOnboardingPath(
  storeId: string,
  commerceType?: StoreCommerceType | null
): string {
  const type = parseStoreCommerceType(commerceType);
  if (type === 'physical') {
    return `/dashboard/onboarding/physical-subscription?storeId=${encodeURIComponent(storeId)}`;
  }
  return `/dashboard/onboarding/store?storeId=${encodeURIComponent(storeId)}&type=${type}`;
}
