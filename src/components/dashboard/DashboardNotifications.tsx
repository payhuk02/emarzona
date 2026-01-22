/**
 * Composant Notifications du Dashboard
 * Affiche les notifications, l'activité récente et les paramètres rapides
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Activity, Settings, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { DashboardStats } from '@/hooks/useDashboardStatsOptimized';

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'success';
  timestamp: string;
  read: boolean;
}

interface DashboardNotificationsProps {
  notifications: DashboardNotification[];
  notificationsEnabled: boolean;
  stats: DashboardStats;
  onViewStore: () => void;
  onManageCustomers: () => void;
  onSettings: () => void;
}

export const DashboardNotifications = React.memo<DashboardNotificationsProps>(
  ({ notifications, notificationsEnabled, stats, onViewStore, onManageCustomers, onSettings }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const bottomRef = useScrollAnimation<HTMLDivElement>();

    return (
      <div
        ref={bottomRef}
        className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
        role="region"
        aria-label={t('dashboard.bottomSection.ariaLabel', 'Notifications et activité récente')}
      >
        {/* Notifications - ✅ PHASE 2: Déferré pour améliorer le TBT */}
        {notificationsEnabled && (
          <Card
            id="notifications-section"
            className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
            role="region"
            aria-labelledby="notifications-title"
          >
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
              <CardTitle
                id="notifications-title"
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg"
              >
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
                  <Bell
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400"
                    aria-hidden="true"
                  />
                </div>
                {t('dashboard.notifications.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div
                className="space-y-3"
                role="list"
                aria-label={t('dashboard.notifications.list.ariaLabel', 'Liste des notifications')}
              >
                {notifications.length === 0 ? (
                  <div className="text-center py-4 sm:py-6">
                    <Bell className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm sm:text-xs md:text-sm text-muted-foreground">
                      Aucune notification
                    </p>
                  </div>
                ) : (
                  // ✅ PERFORMANCE: Limité à 5 notifications, pas besoin de virtualisation
                  // Pour > 20 éléments, envisager @tanstack/react-virtual
                  notifications.slice(0, 5).map(notification => (
                    <div
                      key={notification.id}
                      className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-3 md:p-4 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation min-h-[50px] sm:min-h-[60px] cursor-pointer"
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="p-1 sm:p-1.5 sm:p-2 rounded-full bg-blue-500/10">
                          <Bell
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-500"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm sm:text-xs md:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs sm:text-xs md:text-xs text-muted-foreground">
                            {new Date(notification.timestamp).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {!notification.read && (
                            <Badge
                              variant="secondary"
                              className="text-xs sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5"
                            >
                              {t('dashboard.notificationsBadge.new')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20">
                <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500 dark:text-green-400" />
              </div>
              {t('dashboard.recentActivity.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-3">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-4 sm:py-6">
                  <Activity className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm sm:text-xs md:text-sm text-muted-foreground">
                    Aucune activité récente
                  </p>
                </div>
              ) : (
                // ✅ PERFORMANCE: Limité à 10 activités récentes
                // Pour > 20 éléments, envisager @tanstack/react-virtual
                stats.recentActivity.slice(0, 10).map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-3 md:p-4 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation min-h-[50px] sm:min-h-[60px] cursor-pointer"
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="p-1 sm:p-1.5 sm:p-2 rounded-full bg-green-500/10">
                        <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 line-clamp-2 leading-relaxed">
                        {activity.message}
                      </h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-xs sm:text-xs md:text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {activity.status && (
                          <Badge
                            variant="outline"
                            className="text-xs sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5"
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-gray-500/10 to-gray-500/5 backdrop-blur-sm border border-gray-500/20">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-500 dark:text-gray-400" />
              </div>
              {t('dashboard.quickSettings.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-9 sm:h-10 md:h-12 text-sm sm:text-xs md:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors"
                onClick={onViewStore}
              >
                <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 md:mr-3" />
                <span className="hidden sm:inline">{t('dashboard.quickSettings.storeSettings')}</span>
                <span className="sm:hidden">{t('dashboard.quickSettings.storeSettingsShort')}</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-9 sm:h-10 md:h-12 text-sm sm:text-xs md:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors"
                onClick={onManageCustomers}
              >
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 md:mr-3" />
                <span className="hidden sm:inline">{t('dashboard.quickSettings.manageCustomers')}</span>
                <span className="sm:hidden">{t('dashboard.quickSettings.manageCustomersShort')}</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-9 sm:h-10 md:h-12 text-sm sm:text-xs md:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors"
                onClick={onSettings}
              >
                <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 md:mr-3" />
                <span className="hidden sm:inline">{t('dashboard.quickSettings.configuration')}</span>
                <span className="sm:hidden">{t('dashboard.quickSettings.configurationShort')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

DashboardNotifications.displayName = 'DashboardNotifications';
