import { ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import { Skeleton } from '@/components/ui/skeleton';
import {
  canAccessSellerPath,
  requiredPlanLabelForPath,
  requiredPhysicalFeatureForPath,
} from '@/lib/billing/physical-route-capabilities';
import { isPhysicalOnlySellerPath } from '@/lib/billing/store-commerce-access';
import {
  canAccessCommercePath,
  getRouteCapabilityRule,
  getPrimaryProductCreatePath,
  isGenericProductCreateChooser,
  resolveStoreCommerceTypeFromStore,
} from '@/lib/commerce/store-capability-map';
import { isAccountSettingsPath } from '@/lib/billing/account-settings-paths';

type SellerRoutePermissionGuardProps = {
  children: ReactNode;
};

function GuardLoadingFallback() {
  return (
    <div
      className="flex min-h-[40vh] w-full flex-col gap-4 p-6"
      data-testid="seller-route-guard-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <Skeleton className="h-40 w-full rounded-lg" />
    </div>
  );
}

/**
 * Guard seller routes that require higher physical plan tiers.
 * Blocks direct URL access and redirects to billing upsell.
 */
export function SellerRoutePermissionGuard({ children }: SellerRoutePermissionGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const accountSettingsRoute = isAccountSettingsPath(location.pathname);
  const { store, loading: storeLoading } = useStore();
  const { planSlug, loading: accessLoading } = useStorePhysicalAccess(store?.id ?? null);
  const commerceType = store ? resolveStoreCommerceTypeFromStore(store) : 'physical';
  const toastedPathRef = useRef<string | null>(null);

  const requiredFeature = requiredPhysicalFeatureForPath(location.pathname);
  const allowed = canAccessSellerPath(location.pathname, planSlug, commerceType);
  const physicalOnlyBlocked =
    commerceType != null &&
    commerceType !== 'physical' &&
    isPhysicalOnlySellerPath(location.pathname);
  const commerceRule = getRouteCapabilityRule(location.pathname);
  const commerceTypeBlocked = !canAccessCommercePath(location.pathname, commerceType, {
    storeMetadata: store?.metadata ?? null,
  });
  const planBlocked = Boolean(requiredFeature && !allowed);
  const isRedirecting = physicalOnlyBlocked || commerceTypeBlocked || planBlocked;

  useEffect(() => {
    toastedPathRef.current = null;
  }, [location.pathname]);

  useEffect(() => {
    if (accountSettingsRoute) return;
    if (storeLoading || accessLoading) return;

    const toastOnce = (title: string, description: string) => {
      if (toastedPathRef.current === location.pathname) return;
      toastedPathRef.current = location.pathname;
      toast({ title, description, variant: 'destructive' });
    };

    if (physicalOnlyBlocked) {
      toastOnce(
        'Fonctionnalité non disponible',
        'Cette section concerne uniquement les boutiques produits physiques. Choisissez ce type à la création de boutique pour y accéder.'
      );
      navigate('/dashboard', { replace: true });
      return;
    }

    if (commerceTypeBlocked) {
      toastOnce(
        'Fonctionnalité non disponible',
        commerceRule != null
          ? `Cette section est réservée au type de boutique correspondant (${commerceRule.label}).`
          : isGenericProductCreateChooser(location.pathname)
            ? 'Utilisez le wizard de création adapté à votre type de boutique.'
            : 'Cette section n’est pas disponible pour le type de boutique sélectionné.'
      );
      const redirectTo = isGenericProductCreateChooser(location.pathname)
        ? getPrimaryProductCreatePath(commerceType)
        : '/dashboard';
      navigate(redirectTo, { replace: true });
      return;
    }

    if (!requiredFeature || allowed) return;

    const requiredPlan = requiredPlanLabelForPath(location.pathname);
    toastOnce(
      'Accès restreint par plan',
      `Cette section requiert le plan ${requiredPlan ?? 'supérieur'}.`
    );
    navigate('/dashboard/billing/physical', {
      replace: true,
      state: {
        blockedPath: location.pathname,
        requiredFeature,
        requiredPlan,
      },
    });
  }, [
    storeLoading,
    accessLoading,
    requiredFeature,
    allowed,
    physicalOnlyBlocked,
    commerceTypeBlocked,
    commerceRule,
    toast,
    navigate,
    location.pathname,
    accountSettingsRoute,
    commerceType,
  ]);

  if (accountSettingsRoute) {
    return <>{children}</>;
  }

  if (storeLoading || accessLoading || isRedirecting) {
    return <GuardLoadingFallback />;
  }

  return <>{children}</>;
}
