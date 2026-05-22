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
  tone: 'amber' | 'blue' | 'violet' | 'rose' | 'emerald';
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
        tone: 'violet',
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
      amber: 'border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70',
      blue: 'border-blue-200/80 bg-blue-50/40 hover:bg-blue-50/70',
      violet: 'border-violet-200/80 bg-violet-50/40 hover:bg-violet-50/70',
      rose: 'border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/70',
      emerald: 'border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70',
    };

    return (
      <section
        className="dashboard-premium-panel"
        role="region"
        aria-label={t('dashboard.actions.ariaLabel', 'Actions et alertes')}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="dashboard-premium-panel-title">
              {t('dashboard.actions.title', 'À traiter')}
            </h2>
            <p className="dashboard-premium-panel-subtitle">
              {t('dashboard.actions.subtitle', 'Période affichée : {{period}}', {
                period: periodLabel,
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unreadNotifications > 0 && (
              <button
                type="button"
                onClick={() => navigate('/notifications')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {items.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors touch-manipulation',
                    toneClasses[item.tone]
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Icon className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                    <span className="text-2xl font-bold tabular-nums">{item.count}</span>
                  </div>
                  <span className="text-sm font-medium leading-snug">{item.label}</span>
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
