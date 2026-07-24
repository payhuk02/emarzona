/**
 * Composant Header du Dashboard
 * Extrait de Dashboard.tsx pour améliorer la maintenabilité
 */

import React, { useRef } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Bell, Activity, Download, RefreshCw, MoreVertical } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PeriodFilter, type PeriodType } from '@/components/dashboard/PeriodFilter';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface DashboardHeaderProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
  onExport: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isUpdating?: boolean;
  unreadCount: number;
}

export const DashboardHeader = React.memo<DashboardHeaderProps>(
  ({
    period,
    onPeriodChange,
    customStartDate,
    customEndDate,
    onCustomDateChange,
    onExport,
    onRefresh,
    isRefreshing,
    isUpdating = false,
    unreadCount,
  }) => {
    const { t } = useTranslation();
    const { getValue } = usePageCustomization('dashboard');
    const navigate = useNavigate();
    const headerRef = useScrollAnimation<HTMLDivElement>();

    return (
      <>
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <SidebarTrigger className="mt-1 sm:mt-0 shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="app-premium-page-title flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <LayoutDashboard
                    className="h-5 w-5 sm:h-6 sm:w-6 text-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-foreground font-bold truncate">
                    {getValue('dashboard.title') || t('dashboard.title')}
                  </span>
                  {isUpdating && (
                    <div className="ml-1 flex items-center gap-1 text-xs text-muted-foreground animate-in fade-in shrink-0">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                      <span className="hidden sm:inline">Mise à jour...</span>
                    </div>
                  )}
                </div>
              </h1>
              <p className="app-text-caption md:text-sm text-muted-foreground font-normal">
                {t('dashboard.description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto sm:justify-end">
            {/* Notifications Bell - Desktop */}
            <div className="hidden sm:block relative">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-0 relative touch-manipulation"
                aria-label="Notifications"
                title="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Desktop controls */}
            <PeriodFilter
              period={period}
              onPeriodChange={onPeriodChange}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomDateChange={onCustomDateChange}
              className="hidden sm:flex"
            />
            <Badge
              variant="outline"
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hidden sm:flex items-center gap-1.5 min-h-[40px]"
              aria-label={getValue('dashboard.online') || 'En ligne'}
            >
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              {getValue('dashboard.online')}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="hidden sm:flex min-h-[44px] gap-2 touch-manipulation"
              aria-label="Exporter les données"
              title="Exporter les données"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Exporter</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="min-h-[44px] min-w-[44px] p-0 touch-manipulation"
              aria-label={getValue('dashboard.refresh')}
              title={getValue('dashboard.refresh')}
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </Button>

            {/* Mobile menu - All controls accessible */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden min-h-[44px] min-w-[44px] p-0 touch-manipulation"
                  aria-label="Menu des options"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Options du tableau de bord</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {/* Notifications on Mobile */}
                  {unreadCount > 0 && (
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start min-h-[44px]"
                        onClick={() => navigate('/notifications')}
                      >
                        <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
                        <span className="flex-1">Notifications</span>
                        <Badge variant="destructive" className="ml-2">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      </Button>
                    </div>
                  )}
                  {/* Period Filter on Mobile */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Période</div>
                    <PeriodFilter
                      period={period}
                      onPeriodChange={onPeriodChange}
                      customStartDate={customStartDate}
                      customEndDate={customEndDate}
                      onCustomDateChange={onCustomDateChange}
                      className="w-full"
                    />
                  </div>
                  {/* Online Status */}
                  <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                    <Activity className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1 text-sm">{getValue('dashboard.online')}</span>
                  </div>
                  {/* Export */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start min-h-[44px]"
                    onClick={onExport}
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Exporter les données</span>
                  </Button>
                  {/* Refresh */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start min-h-[44px]"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{getValue('dashboard.refresh')}</span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </>
    );
  }
);

DashboardHeader.displayName = 'DashboardHeader';
