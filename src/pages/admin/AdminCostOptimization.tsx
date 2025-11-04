/**
 * Page Admin Cost Optimization - Optimisation des coûts et marges
 * Date: 27 Janvier 2025
 * 
 * Fonctionnalités:
 * - Dashboard analytics des coûts et marges
 * - Recommandations d'optimisation de prix
 * - Analyse de rentabilité
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CostOptimizationDashboard } from '@/components/physical/cost-optimization';
import { DollarSign } from 'lucide-react';

export default function AdminCostOptimization() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <DollarSign className="h-8 w-8" />
                Optimisation des Coûts et Marges
              </h1>
              <p className="text-muted-foreground">
                Analysez vos coûts, marges et optimisez vos prix pour maximiser la rentabilité
              </p>
            </div>

            <CostOptimizationDashboard />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

