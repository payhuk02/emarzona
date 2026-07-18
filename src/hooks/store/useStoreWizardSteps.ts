import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Info,
  Image as ImageIcon,
  Globe,
  Palette,
  Search,
  MapPin,
  FileText,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type StoreWizardStepKey =
  | 'basic'
  | 'branding'
  | 'contact'
  | 'theme'
  | 'seo'
  | 'location'
  | 'legal'
  | 'analytics';

export interface StoreWizardStep {
  id: number;
  key: StoreWizardStepKey;
  icon: LucideIcon;
  title: string;
  description: string;
}

const STEP_DEFS: ReadonlyArray<{
  id: number;
  key: StoreWizardStepKey;
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
}> = [
  {
    id: 1,
    key: 'basic',
    icon: Info,
    titleKey: 'store.wizard.steps.basic.title',
    descriptionKey: 'store.wizard.steps.basic.description',
  },
  {
    id: 2,
    key: 'branding',
    icon: ImageIcon,
    titleKey: 'store.wizard.steps.branding.title',
    descriptionKey: 'store.wizard.steps.branding.description',
  },
  {
    id: 3,
    key: 'contact',
    icon: Globe,
    titleKey: 'store.wizard.steps.contact.title',
    descriptionKey: 'store.wizard.steps.contact.description',
  },
  {
    id: 4,
    key: 'theme',
    icon: Palette,
    titleKey: 'store.wizard.steps.theme.title',
    descriptionKey: 'store.wizard.steps.theme.description',
  },
  {
    id: 5,
    key: 'seo',
    icon: Search,
    titleKey: 'store.wizard.steps.seo.title',
    descriptionKey: 'store.wizard.steps.seo.description',
  },
  {
    id: 6,
    key: 'location',
    icon: MapPin,
    titleKey: 'store.wizard.steps.location.title',
    descriptionKey: 'store.wizard.steps.location.description',
  },
  {
    id: 7,
    key: 'legal',
    icon: FileText,
    titleKey: 'store.wizard.steps.legal.title',
    descriptionKey: 'store.wizard.steps.legal.description',
  },
  {
    id: 8,
    key: 'analytics',
    icon: BarChart3,
    titleKey: 'store.wizard.steps.analytics.title',
    descriptionKey: 'store.wizard.steps.analytics.description',
  },
];

export function useStoreWizardSteps(): StoreWizardStep[] {
  const { t } = useTranslation();

  return useMemo(
    () =>
      STEP_DEFS.map(step => ({
        id: step.id,
        key: step.key,
        icon: step.icon,
        title: t(step.titleKey),
        description: t(step.descriptionKey),
      })),
    [t]
  );
}
