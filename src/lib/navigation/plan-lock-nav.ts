import type { TFunction } from 'i18next';
import type { NavigateFunction } from 'react-router-dom';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { getNavItemPath } from '@/config/navigation.helpers';
import {
  hasPhysicalFeatureAccess,
  requiredPlanForFeature,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';
import {
  requiredPhysicalFeatureForPath,
  requiredPlanLabelForPath,
} from '@/lib/billing/physical-route-capabilities';
import { shouldApplyPhysicalPlanGating } from '@/lib/billing/store-commerce-access';

export const PLAN_LOCK_BILLING_PATH = '/dashboard/billing/physical';

export function isNavPathPlanLocked(
  urlOrPath: string,
  planSlug: string | null | undefined,
  commerceType?: StoreCommerceType | null
): boolean {
  if (!shouldApplyPhysicalPlanGating(commerceType)) {
    return false;
  }

  const path = getNavItemPath(urlOrPath);
  const feature = requiredPhysicalFeatureForPath(path);
  if (!feature) return false;
  if (!planSlug) return true;
  return !hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, feature);
}

export type PlanLockToastPayload = {
  title: string;
  description: string;
};

export function getPlanLockToastMessages(
  itemTitle: string,
  itemUrlOrPath: string,
  t: TFunction
): PlanLockToastPayload {
  const path = getNavItemPath(itemUrlOrPath);
  const planLabel = requiredPlanLabelForPath(path) ?? t('sidebar.chrome.planLockFallbackPlan');
  const feature = requiredPhysicalFeatureForPath(path);

  return {
    title: t('sidebar.context.planLockTitle', { defaultValue: 'Fonctionnalité verrouillée' }),
    description: feature
      ? t('sidebar.context.planLockRequiresPlan', {
          defaultValue: '{{item}} requiert le plan {{plan}}.',
          item: itemTitle,
          plan: planLabel,
        })
      : t('sidebar.context.planLockRequiresUpgrade', {
          defaultValue: '{{item}} nécessite un plan supérieur.',
          item: itemTitle,
        }),
  };
}

export function getPlanLockNavigationState(itemUrlOrPath: string) {
  const path = getNavItemPath(itemUrlOrPath);
  const feature = requiredPhysicalFeatureForPath(path);
  const requiredPlan = feature
    ? requiredPlanForFeature(feature).replace('physical_', '').toUpperCase()
    : undefined;

  return { blockedPath: path, requiredFeature: feature, requiredPlan };
}

export function notifyPlanLockedNav(options: {
  itemTitle: string;
  itemUrl: string;
  navigate: NavigateFunction;
  toast: (payload: PlanLockToastPayload) => void;
  t: TFunction;
}) {
  options.toast(getPlanLockToastMessages(options.itemTitle, options.itemUrl, options.t));
  options.navigate(PLAN_LOCK_BILLING_PATH, {
    state: getPlanLockNavigationState(options.itemUrl),
  });
}
