/**
 * Service Packages Grid Component
 * Date: 1 Février 2025
 * 
 * Grille de packages de services
 */

import { ServicePackageCard, type ServicePackage } from './ServicePackageCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServicePackagesGridProps {
  packages: ServicePackage[];
  isLoading?: boolean;
  onPackagePurchase?: (packageId: string) => void;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export const ServicePackagesGrid = ({
  packages,
  isLoading = false,
  onPackagePurchase,
  className,
  columns = 3,
}: ServicePackagesGridProps) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-6', gridCols[columns], className)}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96" />
        ))}
      </div>
    );
  }

  if (!packages || packages.length === 0) {
    return (
      <Alert className={className}>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Aucun package disponible pour ce service.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {packages.map((pkg) => (
        <ServicePackageCard
          key={pkg.id}
          package={pkg}
          onPurchase={onPackagePurchase}
        />
      ))}
    </div>
  );
};







