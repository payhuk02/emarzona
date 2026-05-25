/**
 * Layout commun pour les pages /dashboard/emails/*
 * Utilise MainLayout + EmailsSidebar (navigation email dédiée)
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export interface EmailDashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  noStoreMessage: string;
  infoAlert?: { title: string; description: string };
}

export const EmailDashboardLayout = ({
  children,
  title,
  subtitle,
  icon: Icon,
  noStoreMessage,
  infoAlert,
}: EmailDashboardLayoutProps) => {
  const { store } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (!store) {
    return (
      <MainLayout layoutType="emails">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <p className="text-xs sm:text-sm text-muted-foreground">{noStoreMessage}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout layoutType="emails">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-sm border border-blue-500/20 flex-shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
              {subtitle ? (
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {infoAlert ? (
          <Alert className="border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
            <AlertTitle className="text-xs sm:text-sm md:text-base text-blue-900 dark:text-blue-100">
              {infoAlert.title}
            </AlertTitle>
            <AlertDescription className="text-[10px] sm:text-xs md:text-sm text-blue-800 dark:text-blue-200">
              {infoAlert.description}
            </AlertDescription>
          </Alert>
        ) : null}

        {children}
      </div>
    </MainLayout>
  );
};
