/**
 * Bannière opt-in push pour vendeurs — alertes commande même app fermée.
 */

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, BellRing, Loader2, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  dismissSellerPushOptIn,
  isSellerPushOptInDismissed,
} from '@/lib/notifications/seller-push-opt-in-prefs';
import { cn } from '@/lib/utils';

export type SellerPushOptInBannerProps = {
  className?: string;
  /** Contexte d'affichage pour analytics / copy optionnelle */
  variant?: 'dashboard' | 'orders';
};

export function SellerPushOptInBanner({
  className,
  variant = 'dashboard',
}: SellerPushOptInBannerProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isSupported, isVapidReady, isSubscribed, isLoading, permission, subscribe } =
    usePushNotifications();

  const [dismissed, setDismissed] = useState(() =>
    user?.id ? isSellerPushOptInDismissed(user.id) : false
  );

  const handleDismiss = useCallback(() => {
    if (user?.id) {
      dismissSellerPushOptIn(user.id);
    }
    setDismissed(true);
  }, [user?.id]);

  const handleSubscribe = useCallback(async () => {
    const ok = await subscribe();
    if (ok) {
      setDismissed(true);
    }
  }, [subscribe]);

  if (!user?.id || dismissed || isSubscribed) {
    return null;
  }

  if (!isSupported || !isVapidReady) {
    return null;
  }

  const denied = permission.permission === 'denied';

  const title =
    variant === 'orders'
      ? t('notifications.sellerPushOptIn.ordersTitle', 'Ne manquez aucune commande')
      : t(
          'notifications.sellerPushOptIn.dashboardTitle',
          'Activez les alertes commande en temps réel'
        );

  const description = denied
    ? t(
        'notifications.sellerPushOptIn.deniedDescription',
        'Les notifications sont bloquées dans le navigateur. Autorisez-les pour ce site (icône cadenas → Notifications) afin de recevoir son + alerte à l’écran même si Emarzona est fermé — succès et échecs, y compris produits physiques.'
      )
    : variant === 'orders'
      ? t(
          'notifications.sellerPushOptIn.ordersDescription',
          'Recevez son + bandeau à l’écran à chaque confirmation ou échec d’achat (digital, service, cours, artiste et physique), même si l’application n’est pas ouverte — connexion internet requise.'
        )
      : t(
          'notifications.sellerPushOptIn.dashboardDescription',
          'Activez les notifications push pour être alerté immédiatement à chaque vente réussie ou échouée, y compris les commandes physiques, même hors application.'
        );

  return (
    <Alert
      className={cn(
        'relative border-violet-300/60 bg-gradient-to-r from-violet-50/90 to-blue-50/80 dark:from-violet-950/40 dark:to-blue-950/30 dark:border-violet-700/50',
        className
      )}
      role="region"
      aria-label={t('notifications.sellerPushOptIn.ariaLabel', 'Activer les alertes commande')}
    >
      <BellRing className="h-4 w-4 text-violet-700 dark:text-violet-300" aria-hidden />
      <AlertTitle className="text-violet-900 dark:text-violet-100 pr-8">{title}</AlertTitle>
      <AlertDescription className="text-violet-950/80 dark:text-violet-100/80">
        <p className="mb-3">{description}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {!denied && (
            <Button
              type="button"
              size="sm"
              className="min-h-[40px] bg-violet-600 hover:bg-violet-700 text-white gap-2"
              disabled={isLoading}
              onClick={() => void handleSubscribe()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Bell className="h-4 w-4" aria-hidden />
              )}
              {t('notifications.sellerPushOptIn.activate', 'Activer les alertes')}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-h-[40px] border-violet-300/70"
            disabled={isLoading}
            onClick={handleDismiss}
          >
            {t('notifications.sellerPushOptIn.later', 'Plus tard')}
          </Button>
          <Button
            asChild
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-[40px] text-violet-800 dark:text-violet-200"
          >
            <Link to="/dashboard/settings?tab=notifications">
              {t('notifications.sellerPushOptIn.settings', 'Paramètres notifications')}
            </Link>
          </Button>
        </div>
      </AlertDescription>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-violet-700/70 hover:text-violet-900 hover:bg-violet-100/80 dark:hover:bg-violet-900/50"
        aria-label={t('common.close', 'Fermer')}
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </Alert>
  );
}
