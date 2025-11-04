/**
 * Page Admin Demand Forecasting - Prévisions de demande
 * Date: 27 Janvier 2025
 * 
 * Fonctionnalités:
 * - Dashboard analytics des prévisions
 * - Recommandations de réapprovisionnement
 * - Calcul de prévisions
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { DemandForecastingDashboard } from '@/components/physical/forecasting';
import { TrendingUp } from 'lucide-react';

export default function AdminDemandForecasting() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-8 w-8" />
                Prévisions de Demande
              </h1>
              <p className="text-muted-foreground">
                Analysez les tendances et prévoyez la demande future de vos produits
              </p>
            </div>

            <DemandForecastingDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

