import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import {
  getStoreCustomizationStepDefs,
  type StoreCustomizationStep,
} from '@/lib/commerce/store-customization-steps';

export function useStoreCustomizationSteps(
  commerceType?: StoreCommerceType | null
): StoreCustomizationStep[] {
  const { t } = useTranslation();
  const defs = useMemo(() => getStoreCustomizationStepDefs(commerceType), [commerceType]);

  return useMemo(
    () =>
      defs.map(step => ({
        ...step,
        title: t(step.titleKey),
        description: t(step.descriptionKey),
      })),
    [defs, t]
  );
}
