import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CrossTypeBundleManager } from '@/components/bundles/CrossTypeBundleManager';
import { Layers } from 'lucide-react';

export default function CrossTypeBundlesPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Layers className="h-7 w-7 text-primary" aria-hidden />
            Packs cross-type
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Digital, physique, cours et artiste — un checkout, plusieurs fulfillments.
          </p>
        </div>
        <CrossTypeBundleManager />
      </div>
    </DashboardLayout>
  );
}
