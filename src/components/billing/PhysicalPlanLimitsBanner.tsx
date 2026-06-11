import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useStorePhysicalPlanLimits } from '@/hooks/billing/useStorePhysicalPlanLimits';
import { physicalPlanLabel } from '@/lib/billing/physical-plan-display';
import type { PhysicalPlanSlug } from '@/lib/billing/physical-plan-capabilities';

type PhysicalPlanLimitsBannerProps = {
  storeId: string;
};

export function PhysicalPlanLimitsBanner({ storeId }: PhysicalPlanLimitsBannerProps) {
  const navigate = useNavigate();
  const { data: limits, isLoading } = useStorePhysicalPlanLimits(storeId);

  if (isLoading || !limits?.allowed || limits.max_products == null) {
    return null;
  }

  const atLimit = limits.active_physical_products >= limits.max_products;
  const nearLimit = limits.active_physical_products >= limits.max_products * 0.9;

  if (!nearLimit && !atLimit) {
    return null;
  }

  return (
    <Alert variant={atLimit ? 'destructive' : 'default'}>
      <Package className="h-4 w-4" />
      <AlertTitle>{atLimit ? 'Limite produits atteinte' : 'Limite produits proche'}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Plan {physicalPlanLabel(limits.plan_slug as PhysicalPlanSlug)} :{' '}
          {limits.active_physical_products}/{limits.max_products} produits physiques actifs.
        </p>
        {atLimit && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => navigate('/dashboard/billing/physical')}
          >
            Changer de plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
