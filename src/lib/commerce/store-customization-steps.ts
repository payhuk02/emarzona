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

export interface StoreCustomizationStepDef {
  id: number;
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  key: StoreCustomizationStepKey;
  /** Visible only for these commerce types (omit = all types). */
  commerceTypes?: readonly StoreCommerceType[];
}

export interface StoreCustomizationStep extends Omit<
  StoreCustomizationStepDef,
  'titleKey' | 'descriptionKey'
> {
  title: string;
  description: string;
}

export const STORE_CUSTOMIZATION_STEP_DEFS: readonly StoreCustomizationStepDef[] = [
  {
    id: 1,
    titleKey: 'store.customization.steps.settings.title',
    descriptionKey: 'store.customization.steps.settings.description',
    icon: Info,
    key: 'settings',
  },
  {
    id: 2,
    titleKey: 'store.customization.steps.appearance.title',
    descriptionKey: 'store.customization.steps.appearance.description',
    icon: Palette,
    key: 'appearance',
  },
  {
    id: 3,
    titleKey: 'store.customization.steps.location.title',
    descriptionKey: 'store.customization.steps.location.description',
    icon: MapPin,
    key: 'location',
  },
  {
    id: 4,
    titleKey: 'store.customization.steps.seo.title',
    descriptionKey: 'store.customization.steps.seo.description',
    icon: Search,
    key: 'seo',
  },
  {
    id: 5,
    titleKey: 'store.customization.steps.legal.title',
    descriptionKey: 'store.customization.steps.legal.description',
    icon: FileText,
    key: 'legal',
  },
  {
    id: 6,
    titleKey: 'store.customization.steps.url.title',
    descriptionKey: 'store.customization.steps.url.description',
    icon: Globe,
    key: 'url',
  },
  {
    id: 7,
    titleKey: 'store.customization.steps.marketing.title',
    descriptionKey: 'store.customization.steps.marketing.description',
    icon: MessageSquare,
    key: 'marketing',
  },
  {
    id: 8,
    titleKey: 'store.customization.steps.analytics.title',
    descriptionKey: 'store.customization.steps.analytics.description',
    icon: BarChart3,
    key: 'analytics',
  },
  {
    id: 9,
    titleKey: 'store.customization.steps.commerce.title',
    descriptionKey: 'store.customization.steps.commerce.description',
    icon: Truck,
    key: 'commerce',
    commerceTypes: ['physical'],
  },
  {
    id: 10,
    titleKey: 'store.customization.steps.notifications.title',
    descriptionKey: 'store.customization.steps.notifications.description',
    icon: Bell,
    key: 'notifications',
  },
];

/** @deprecated Use getStoreCustomizationStepDefs + useStoreCustomizationSteps */
export const STORE_CUSTOMIZATION_STEPS = STORE_CUSTOMIZATION_STEP_DEFS;

export function getStoreCustomizationStepDefs(
  commerceType?: StoreCommerceType | null
): StoreCustomizationStepDef[] {
  const effectiveType = parseStoreCommerceType(commerceType);
  const showLocation = getStoreVerticalProfile(effectiveType).showLocationTab;
  return STORE_CUSTOMIZATION_STEP_DEFS.filter(step => {
    if (step.key === 'location' && !showLocation) return false;
    if (!step.commerceTypes) return true;
    return step.commerceTypes.includes(effectiveType);
  }).map((step, index) => ({
    ...step,
    id: index + 1,
  }));
}

export function getStoreCustomizationSteps(
  commerceType?: StoreCommerceType | null
): StoreCustomizationStepDef[] {
  return getStoreCustomizationStepDefs(commerceType);
}

export function isStoreCustomizationTabVisible(
  tabKey: StoreCustomizationStepKey,
  commerceType?: StoreCommerceType | null
): boolean {
  return getStoreCustomizationStepDefs(commerceType).some(step => step.key === tabKey);
}
