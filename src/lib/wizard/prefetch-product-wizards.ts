/**
 * Prefetch routes + chunks JS des wizards produit selon le commerce_type de la boutique.
 */
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import {
  getPrimaryProductCreatePath,
  getVendorProductListPath,
} from '@/lib/commerce/store-capability-map';

const WIZARD_SHELL_IMPORT: Record<StoreCommerceType, () => Promise<unknown>> = {
  physical: () => import('@/components/products/create/physical/CreatePhysicalProductWizard_v2'),
  digital: () => import('@/components/products/create/digital/CreateDigitalProductWizard_v2'),
  service: () => import('@/components/products/create/service/CreateServiceWizard_v2'),
  course: () => import('@/components/courses/create/CreateCourseWizard'),
  artist: () => import('@/components/products/create/artist/CreateArtistProductWizard'),
};

const FIRST_STEP_PREFETCH: Record<StoreCommerceType, () => void> = {
  physical: () => {
    void import('@/components/products/create/physical/physical-wizard-steps').then(m =>
      m.prefetchPhysicalWizardFirstStep()
    );
  },
  digital: () => {
    void import('@/components/products/create/digital/digital-wizard-steps').then(m =>
      m.prefetchDigitalWizardFirstStep()
    );
  },
  service: () => {
    void import('@/components/products/create/service/service-wizard-steps').then(m =>
      m.prefetchServiceWizardFirstStep()
    );
  },
  course: () => {
    void import('@/components/courses/create/course-wizard-steps').then(m =>
      m.prefetchCourseWizardFirstStep()
    );
  },
  artist: () => {
    void import('@/components/products/create/artist/ArtistBasicInfoForm');
  },
};

/** Routes document à prefetch pour un vendeur typé. */
export function getVendorWizardPrefetchRoutes(
  commerceType?: StoreCommerceType | null
): readonly string[] {
  const type = parseStoreCommerceType(commerceType);
  const createPath = getPrimaryProductCreatePath(type);
  const listPath = getVendorProductListPath(type);
  const routes = new Set<string>([createPath]);
  if (listPath !== createPath) {
    routes.add(listPath);
  }
  return [...routes];
}

/** Précharge le shell wizard + l'étape 1 (idle, non bloquant). */
export function prefetchProductWizardChunks(commerceType?: StoreCommerceType | null): void {
  const type = parseStoreCommerceType(commerceType);
  void WIZARD_SHELL_IMPORT[type]?.();
  FIRST_STEP_PREFETCH[type]?.();
}
