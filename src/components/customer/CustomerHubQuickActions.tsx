/**
 * P1-1 — Hub acheteur : actions cross-type depuis /account ou /account/hub
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerHubSummary } from '@/hooks/customer/useCustomerHubSummary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Download,
  BookOpen,
  Calendar,
  Package,
  Palette,
  ArrowRight,
} from 'lucide-react';

const HUB_ACTIONS = [
  {
    labelKey: 'customer.hub.actions.orders',
    defaultLabel: 'Toutes mes commandes',
    descriptionKey: 'customer.hub.actions.ordersDesc',
    defaultDescription: 'Digital, physique, services, cours, art',
    path: '/account/orders',
    icon: ShoppingBag,
  },
  {
    labelKey: 'customer.hub.actions.downloads',
    defaultLabel: 'Téléchargements',
    descriptionKey: 'customer.hub.actions.downloadsDesc',
    defaultDescription: 'Produits digitaux achetés',
    path: '/account/downloads',
    icon: Download,
  },
  {
    labelKey: 'customer.hub.actions.courses',
    defaultLabel: 'Mes cours',
    descriptionKey: 'customer.hub.actions.coursesDesc',
    defaultDescription: 'Progression et certificats',
    path: '/account/courses',
    icon: BookOpen,
  },
  {
    labelKey: 'customer.hub.actions.bookings',
    defaultLabel: 'Réservations',
    descriptionKey: 'customer.hub.actions.bookingsDesc',
    defaultDescription: 'Services et rendez-vous',
    path: '/account/bookings',
    icon: Calendar,
  },
  {
    labelKey: 'customer.hub.actions.physical',
    defaultLabel: 'Suivi colis',
    descriptionKey: 'customer.hub.actions.physicalDesc',
    defaultDescription: 'Commandes physiques',
    path: '/account/physical',
    icon: Package,
  },
  {
    labelKey: 'customer.hub.actions.artist',
    defaultLabel: 'Galerie artiste',
    descriptionKey: 'customer.hub.actions.artistDesc',
    defaultDescription: 'Œuvres et certificats',
    path: '/account/artist',
    icon: Palette,
  },
] as const;

export function CustomerHubQuickActions() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: hub } = useCustomerHubSummary(user?.id, 1, true);
  const activeCount = hub?.activeOrdersCount ?? 0;

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">
            {t('customer.hub.title', 'Your Orders — hub unifié')}
          </CardTitle>
          {activeCount > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {t('customer.hub.activeOrders', '{{count}} en cours', { count: activeCount })}
            </Badge>
          )}
        </div>
        <CardDescription>
          {t('customer.hub.subtitle', 'Accédez à tous vos achats Emarzona depuis un seul endroit')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {HUB_ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <Button
                key={action.path}
                variant="outline"
                className="h-auto min-h-[44px] justify-start gap-3 px-3 py-3 text-left touch-manipulation"
                onClick={() => navigate(action.path)}
              >
                <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">
                    {t(action.labelKey, action.defaultLabel)}
                  </span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {t(action.descriptionKey, action.defaultDescription)}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
