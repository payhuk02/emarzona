/**
 * Page principale pour les analytics email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { EmailAnalyticsDashboard } from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const EmailAnalyticsPage = () => {
  const { store } = useStore();

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Veuillez sélectionner une boutique
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger 
                aria-label="Toggle sidebar"
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] lg:hidden"
              />
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/5 flex-shrink-0">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Analytics Email
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-1">
                  Analysez les performances de vos campagnes et séquences email
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <Info className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              Analytics Email Avancées
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              Visualisez les performances de vos emails avec des graphiques détaillés.
              Analysez les taux d'ouverture, de clic, et les revenus générés par vos campagnes.
            </AlertDescription>
          </Alert>

          {/* Dashboard Analytics */}
          <EmailAnalyticsDashboard storeId={store.id} />
        </main>
      </div>
    </SidebarProvider>
  );
};

