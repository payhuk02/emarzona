/**
 * Page Admin Batch Shipping - Gestion des expéditions par lots
 * Date: 27 Janvier 2025
 * 
 * Fonctionnalités:
 * - Création de lots d'expédition
 * - Traitement par lots
 * - Génération d'étiquettes multiples
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { BatchShippingManagement } from '@/components/physical/batch-shipping';
import { Package } from 'lucide-react';

export default function AdminBatchShipping() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Package className="h-8 w-8" />
                Expéditions Batch
              </h1>
              <p className="text-muted-foreground">
                Traitez plusieurs commandes simultanément et générez des étiquettes en masse
              </p>
            </div>

            <BatchShippingManagement />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

