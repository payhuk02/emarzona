/**
 * Page principale pour les analytics email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { EmailAnalyticsDashboard } from '@/components/email/EmailAnalyticsDashboard';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const EmailAnalyticsPage = () => {
  const { t } = useTranslation();
  const { store } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 sm:p-12 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('emails.analytics.noStore')}
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
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div 
            ref={headerRef}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger 
                aria-label="Toggle sidebar"
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px]"
              />
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-blue-500/5 backdrop-blur-sm border border-green-500/20 flex-shrink-0">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-green-500 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    {t('emails.analytics.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('emails.analytics.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-green-200/50 bg-green-50/50 dark:bg-green-950/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
            <AlertTitle className="text-xs sm:text-sm md:text-base text-green-900 dark:text-green-100">
              {t('emails.analytics.alert.title')}
            </AlertTitle>
            <AlertDescription className="text-[10px] sm:text-xs md:text-sm text-green-800 dark:text-green-200">
              {t('emails.analytics.alert.description')}
            </AlertDescription>
          </Alert>

          {/* Dashboard Analytics */}
          <EmailAnalyticsDashboard storeId={store.id} />
        </main>
      </div>
    </SidebarProvider>
  );
};

