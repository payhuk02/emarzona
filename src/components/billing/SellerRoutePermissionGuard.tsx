import { ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import {
  canAccessSellerPath,
  requiredPlanLabelForPath,
  requiredPhysicalFeatureForPath,
} from '@/lib/billing/physical-route-capabilities';
import { isPhysicalOnlySellerPath } from '@/lib/billing/store-commerce-access';
import {
  canAccessCommercePath,
  getRouteCapabilityRule,
  resolveStoreCommerceTypeFromStore,
} from '@/lib/commerce/store-capability-map';

type SellerRoutePermissionGuardProps = {
  children: ReactNode;
};

/**
 * Guard seller routes that require higher physical plan tiers.
 * Blocks direct URL access and redirects to billing upsell.
 */
export function SellerRoutePermissionGuard({ children }: SellerRoutePermissionGuardProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const { planSlug, loading: accessLoading } = useStorePhysicalAccess(store?.id ?? null);
  const commerceType = store ? resolveStoreCommerceTypeFromStore(store) : 'physical';

  const requiredFeature = requiredPhysicalFeatureForPath(location.pathname);
  const allowed = canAccessSellerPath(location.pathname, planSlug, commerceType);
  const physicalOnlyBlocked =
    commerceType != null &&
    commerceType !== 'physical' &&
    isPhysicalOnlySellerPath(location.pathname);
  const commerceRule = getRouteCapabilityRule(location.pathname);
  const commerceTypeBlocked = !canAccessCommercePath(location.pathname, commerceType);

  useEffect(() => {
    if (storeLoading || accessLoading) return;

    if (physicalOnlyBlocked) {
      toast({
        title: 'Fonctionnalité non disponible',
        description:
          'Cette section concerne uniquement les boutiques produits physiques. Choisissez ce type à la création de boutique pour y accéder.',
        variant: 'destructive',
      });
      navigate('/dashboard', { replace: true });
      return;
    }

    if (commerceTypeBlocked) {
      toast({
        title: 'Fonctionnalité non disponible',
        description:
          commerceRule != null
            ? `Cette section est réservée au type de boutique correspondant (${commerceRule.label}).`
            : 'Cette section n’est pas disponible pour le type de boutique sélectionné.',
        variant: 'destructive',
      });
      navigate('/dashboard', { replace: true });
      return;
    }

    if (!requiredFeature || allowed) return;

    const requiredPlan = requiredPlanLabelForPath(location.pathname);
    toast({
      title: 'Accès restreint par plan',
      description: `Cette section requiert le plan ${requiredPlan ?? 'supérieur'}.`,
      variant: 'destructive',
    });
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
  ]);

  if (storeLoading || accessLoading) return null;
  if (physicalOnlyBlocked) return null;
  if (commerceTypeBlocked) return null;
  if (requiredFeature && !allowed) return null;

  return <>{children}</>;
}
