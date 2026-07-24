import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Package,
  ShoppingCart,
  Star,
  Warehouse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardOperational } from '@/types/dashboard-stats';
import { generateStoreUrl } from '@/lib/store-utils';

interface ActionItem {
  id: string;
  label: string;
  count: number;
  href: string;
  icon: React.ElementType;
  tone: 'amber' | 'blue' | 'slate' | 'rose' | 'emerald';
}

interface DashboardActionCenterProps {
  operational: DashboardOperational;
  periodLabel: string;
  storeName?: string;
  storeSlug?: string;
  storeSubdomain?: string | null;
  customDomain?: string | null;
  unreadNotifications?: number;
}

export const DashboardActionCenter = React.memo<DashboardActionCenterProps>(
  ({
    operational,
    periodLabel,
    storeName,
    storeSlug,
    storeSubdomain,
    customDomain,
    unreadNotifications = 0,
  }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const items: ActionItem[] = [
      {
        id: 'pending-orders',
        label: t('dashboard.actions.pendingOrders', 'Commandes en attente'),
        count: operational.pendingOrders,
        href: '/dashboard/orders?status=pending',
        icon: ShoppingCart,
        tone: 'amber',
      },
      {
        id: 'processing',
        label: t('dashboard.actions.processingOrders', 'En cours de traitement'),
        count: operational.processingOrders,
        href: '/dashboard/orders?status=processing',
        icon: AlertCircle,
        tone: 'blue',
      },
      {
        id: 'low-stock',
        label: t('dashboard.actions.lowStock', 'Stock faible'),
        count: operational.lowStockProducts,
        href: '/dashboard/inventory',
        icon: Warehouse,
        tone: 'rose',
      },
      {
        id: 'drafts',
        label: t('dashboard.actions.drafts', 'Brouillons produits'),
        count: operational.draftProducts,
        href: '/dashboard/products',
        icon: Package,
        tone: 'slate',
      },
      {
        id: 'reviews',
        label: t('dashboard.actions.pendingReviews', 'Avis à modérer'),
        count: operational.pendingReviews,
        href: '/dashboard/reviews',
        icon: Star,
        tone: 'emerald',
      },
    ].filter(item => item.count > 0);

    const storeUrl =
      storeSlug && generateStoreUrl(storeSlug, storeSubdomain, customDomain ?? undefined);

    const toneClasses: Record<ActionItem['tone'], string> = {
      amber:
        'border-amber-200/90 bg-amber-50/70 hover:bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 dark:hover:bg-amber-950/45',
      blue: 'border-blue-200/90 bg-blue-50/70 hover:bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800/50 dark:hover:bg-blue-950/45',
      slate:
        'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50 dark:bg-slate-900/40 dark:border-slate-700/60 dark:hover:bg-slate-900/60',
      rose: 'border-rose-200/90 bg-rose-50/70 hover:bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800/50 dark:hover:bg-rose-950/45',
      emerald:
        'border-emerald-200/90 bg-emerald-50/70 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:hover:bg-emerald-950/45',
    };

    return (
      <section
        className="dashboard-premium-panel"
        role="region"
        aria-label={t('dashboard.actions.ariaLabel', 'Actions et alertes')}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="dashboard-premium-panel-title">
              {t('dashboard.actions.title', 'À traiter')}
            </h2>
            <p className="dashboard-premium-panel-subtitle">
              {t('dashboard.actions.subtitle', 'Période affichée : {{period}}', {
                period: periodLabel,
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {unreadNotifications > 0 && (
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                {t('dashboard.actions.notifications', '{{count}} notification(s)', {
                  count: unreadNotifications,
                })}
              </button>
            )}
            {storeUrl && (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {t('dashboard.actions.viewStore', 'Voir {{name}}', {
                  name: storeName || t('dashboard.actions.myStore', 'ma boutique'),
                })}
              </a>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {t(
              'dashboard.actions.allClear',
              'Rien en attente — votre boutique est à jour pour cette période.'
            )}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
            {items.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={cn('dashboard-action-tile', toneClasses[item.tone])}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 opacity-80" aria-hidden />
                    <span className="text-xl sm:text-2xl font-bold tabular-nums">{item.count}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-medium leading-snug line-clamp-2">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  }
);

DashboardActionCenter.displayName = 'DashboardActionCenter';
