import {
  replaceDeliveryPackages,
  replaceGigExtras,
} from '@/lib/services/service-delivery-commerce';
import {
  draftsToExtrasPayload,
  draftsToReplacePayload,
  type ServiceGigExtraDraft,
  type ServiceGigPackageDraft,
} from '@/lib/services/service-gig-package-drafts';
import {
  resolvePersistedFulfillmentMode,
  type ServiceWizardFormFields,
} from '@/lib/service-wizard-step-validation';
import type { ServiceCategoryTreeNode } from '@/lib/services/service-categories';

export async function persistWizardGigPackages(input: {
  formData: Pick<
    ServiceWizardFormFields,
    'fulfillment_mode' | 'category' | 'category_id' | 'parent_category_id'
  > & {
    delivery_packages?: ServiceGigPackageDraft[];
    gig_extras?: ServiceGigExtraDraft[];
  };
  categoryTree?: ServiceCategoryTreeNode[];
  serviceProductId: string;
  productId: string;
  storeId: string;
}): Promise<void> {
  const mode = resolvePersistedFulfillmentMode(input.formData, input.categoryTree);
  if (mode !== 'project' && mode !== 'both') return;
  if (!input.serviceProductId || !input.storeId) return;

  if (input.formData.delivery_packages) {
    const packages = draftsToReplacePayload(input.formData.delivery_packages);
    if (packages.length > 0) {
      await replaceDeliveryPackages({
        serviceProductId: input.serviceProductId,
        productId: input.productId,
        storeId: input.storeId,
        packages,
      });
    }
  }
  if (input.formData.gig_extras) {
    await replaceGigExtras({
      serviceProductId: input.serviceProductId,
      storeId: input.storeId,
      extras: draftsToExtrasPayload(input.formData.gig_extras),
    });
  }
}
