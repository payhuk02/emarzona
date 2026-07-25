/**
 * CTA compact opt-in push vendeur — alerte commande même app fermée.
 * Mobile : un seul bouton « Activer notification » (pas de long texte).
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import {
  dismissSellerPushOptIn,
  isSellerPushOptInDismissed,
} from '@/lib/notifications/seller-push-opt-in-prefs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
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
    if (!isVapidReady) {
      toast({
        title: t('notifications.sellerPushOptIn.unavailableTitle', 'Notifications indisponibles'),
        description: t(
          'notifications.sellerPushOptIn.unavailableDescription',
          'La configuration push n’est pas encore active sur cet environnement.'
        ),
        variant: 'destructive',
      });
      return;
    }
    if (permission.permission === 'denied') {
      toast({
        title: t('notifications.sellerPushOptIn.deniedTitle', 'Notifications bloquées'),
        description: t(
          'notifications.sellerPushOptIn.deniedDescriptionShort',
          'Autorisez les notifications dans le navigateur (cadenas → Notifications). Sur iPhone : ajoutez Emarzona à l’écran d’accueil puis réessayez.'
        ),
        variant: 'destructive',
      });
      return;
    }
    const ok = await subscribe();
    if (ok) {
      setDismissed(true);
      toast({
        title: t('notifications.sellerPushOptIn.enabledTitle', 'Notifications activées'),
        description: t(
          'notifications.sellerPushOptIn.enabledDescription',
          'Vous serez alerté à chaque commande, même hors application.'
        ),
      });
    }
  }, [isVapidReady, permission.permission, subscribe, t, toast]);

  if (!user?.id || dismissed || isSubscribed) {
    return null;
  }

  // Sur mobile, PushManager peut manquer (Safari non installé en PWA) — on affiche quand même
  // un CTA explicatif si Notification existe, sinon on masque.
  if (!isSupported && typeof Notification === 'undefined') {
    return null;
  }

  if (!isSupported && !isVapidReady) {
    return null;
  }

  const label = t('notifications.sellerPushOptIn.activateShort', 'Activer notification');
  const denied = permission.permission === 'denied';
  const canActivate = isSupported && isVapidReady;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 rounded-full border border-orange-200/80',
        'bg-gradient-to-r from-orange-50 to-amber-50/80 px-1.5 py-1 shadow-sm',
        'dark:from-orange-950/40 dark:to-amber-950/30 dark:border-orange-800/50',
        className
      )}
      role="region"
      aria-label={t('notifications.sellerPushOptIn.ariaLabel', 'Activer les alertes commande')}
    >
      <Button
        type="button"
        size="sm"
        disabled={isLoading}
        onClick={() => {
          if (!canActivate && !isSupported) {
            toast({
              title: t('notifications.sellerPushOptIn.iosTitle', 'Installer l’app'),
              description: t(
                'notifications.sellerPushOptIn.iosDescription',
                'Sur iPhone/iPad : Partager → Sur l’écran d’accueil, puis ouvrez Emarzona depuis l’icône pour activer les notifications.'
              ),
            });
            return;
          }
          void handleSubscribe();
        }}
        className={cn(
          'min-h-9 h-9 rounded-full px-3 sm:px-4 gap-1.5 font-medium shadow-none',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          denied && 'opacity-90'
        )}
        title={
          !isSupported
            ? t(
                'notifications.sellerPushOptIn.iosDescription',
                'Sur iPhone/iPad : Partager → Sur l’écran d’accueil, puis ouvrez Emarzona depuis l’icône pour activer les notifications.'
              )
            : denied
              ? t(
                  'notifications.sellerPushOptIn.deniedDescriptionShort',
                  'Autorisez les notifications dans le navigateur (cadenas → Notifications).'
                )
              : variant === 'orders'
                ? t('notifications.sellerPushOptIn.ordersTitle', 'Ne manquez aucune commande')
                : t(
                    'notifications.sellerPushOptIn.dashboardTitle',
                    'Activez les alertes commande en temps réel'
                  )
        }
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
        ) : (
          <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className="text-xs sm:text-sm whitespace-nowrap">{label}</span>
      </Button>
      <button
        type="button"
        onClick={handleDismiss}
        className="shrink-0 rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-background/70 transition-colors touch-manipulation"
        aria-label={t('common.close', 'Fermer')}
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
