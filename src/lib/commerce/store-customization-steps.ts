import type { LucideIcon } from 'lucide-react';
import {
  Info,
  Palette,
  MapPin,
  Search,
  FileText,
  Globe,
  MessageSquare,
  BarChart3,
  Truck,
  Bell,
} from 'lucide-react';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import { getStoreVerticalProfile } from '@/lib/commerce/store-vertical-config';

export type StoreCustomizationStepKey =
  | 'settings'
  | 'appearance'
  | 'location'
  | 'seo'
  | 'legal'
  | 'url'
  | 'marketing'
  | 'analytics'
  | 'commerce'
  | 'notifications';

export interface StoreCustomizationStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  key: StoreCustomizationStepKey;
  /** Visible only for these commerce types (omit = all types). */
  commerceTypes?: readonly StoreCommerceType[];
}

export const STORE_CUSTOMIZATION_STEPS: readonly StoreCustomizationStep[] = [
  {
    id: 1,
    title: 'Informations',
    description: 'Nom, description, contact',
    icon: Info,
    key: 'settings',
  },
  {
    id: 2,
    title: 'Apparence',
    description: 'Logo, bannière, thème',
    icon: Palette,
    key: 'appearance',
  },
  {
    id: 3,
    title: 'Localisation',
    description: 'Adresse, horaires',
    icon: MapPin,
    key: 'location',
  },
  {
    id: 4,
    title: 'SEO',
    description: 'Référencement',
    icon: Search,
    key: 'seo',
  },
  {
    id: 5,
    title: 'Pages Légales',
    description: 'CGV, confidentialité',
    icon: FileText,
    key: 'legal',
  },
  {
    id: 6,
    title: 'URL',
    description: 'Domaine personnalisé',
    icon: Globe,
    key: 'url',
  },
  {
    id: 7,
    title: 'Marketing',
    description: 'Contenu marketing',
    icon: MessageSquare,
    key: 'marketing',
  },
  {
    id: 8,
    title: 'Analytics',
    description: 'Statistiques',
    icon: BarChart3,
    key: 'analytics',
  },
  {
    id: 9,
    title: 'Commerce',
    description: 'Livraison, taxes, paiements',
    icon: Truck,
    key: 'commerce',
    commerceTypes: ['physical'],
  },
  {
    id: 10,
    title: 'Notifications',
    description: 'Alertes et notifications',
    icon: Bell,
    key: 'notifications',
  },
];

export function getStoreCustomizationSteps(
  commerceType?: StoreCommerceType | null
): StoreCustomizationStep[] {
  const effectiveType = parseStoreCommerceType(commerceType);
  const showLocation = getStoreVerticalProfile(effectiveType).showLocationTab;
  return STORE_CUSTOMIZATION_STEPS.filter(step => {
    if (step.key === 'location' && !showLocation) return false;
    if (!step.commerceTypes) return true;
    return step.commerceTypes.includes(effectiveType);
  }).map((step, index) => ({
    ...step,
    id: index + 1,
  }));
}

export function isStoreCustomizationTabVisible(
  tabKey: StoreCustomizationStepKey,
  commerceType?: StoreCommerceType | null
): boolean {
  return getStoreCustomizationSteps(commerceType).some(step => step.key === tabKey);
}
