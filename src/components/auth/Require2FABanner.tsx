/**
 * Banner d'avertissement pour forcer l'activation du 2FA
 *
 * Affiche un bandeau persistant en haut de l'application
 * pour les admins qui n'ont pas encore activé le 2FA
 *
 * @module Require2FABanner
 */

import { useRequire2FA } from '@/hooks/useRequire2FA';
import { useAuth } from '@/contexts/AuthContext';
import { isPrincipalAdminEmail } from '@/lib/principal-admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Require2FABannerProps {
  /** Classe CSS personnalisée */
  className?: string;
  /** Position du banner */
  position?: 'top' | 'inline';
  /** Variante visuelle */
  variant?: 'warning' | 'danger';
}

/**
 * Composant Banner pour encourager/forcer l'activation du 2FA
 *
 * @example
 * ```tsx
 * // Dans App.tsx ou Layout principal
 * function AppLayout() {
 *   return (
 *     <>
 *       <Require2FABanner position="top" />
 *       <Dashboard />
 *     </>
 *   );
 * }
 * ```
 */
export const Require2FABanner = ({
  className,
  position = 'top',
  variant,
}: Require2FABannerProps) => {
  const { user } = useAuth();
  const { requires2FA, daysRemaining, isLoading, is2FAEnabled } = useRequire2FA({
    disableRedirect: position === 'inline', // Ne pas rediriger si banner inline
  });
  const navigate = useNavigate();

  if (isPrincipalAdminEmail(user?.email)) {
    return null;
  }

  // Ne rien afficher si :
  // - Loading en cours
  // - 2FA déjà activé
  // - Pas de requirement
  if (isLoading || is2FAEnabled || (!requires2FA && daysRemaining === null)) {
    return null;
  }

  // Déterminer la variante
  const autoVariant = variant || (daysRemaining && daysRemaining > 0 ? 'warning' : 'danger');

  // Couleurs selon variante
  const colors = {
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-950',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-900 dark:text-orange-100',
      icon: 'text-orange-600 dark:text-orange-400',
      button: 'bg-orange-600 hover:bg-orange-700 text-white',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-950',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-900 dark:text-red-100',
      icon: 'text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
  };

  const style = colors[autoVariant];

  // Message selon situation
  const getMessage = () => {
    if (requires2FA) {
      return {
        icon: <AlertTriangle className="h-5 w-5" />,
        title: '🔒 Activation 2FA Obligatoire',
        description:
          "Pour des raisons de sécurité, l'authentification à deux facteurs est désormais requise pour votre compte admin. Vous devez l'activer maintenant pour continuer.",
        cta: 'Activer maintenant',
        urgent: true,
      };
    }

    if (daysRemaining !== null) {
      return {
        icon: <Clock className="h-5 w-5" />,
        title: '⚠️ Action Requise : Activation 2FA',
        description: `L'authentification à deux facteurs sera obligatoire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}. Activez-la dès maintenant pour sécuriser votre compte admin.`,
        cta: 'Activer le 2FA',
        urgent: daysRemaining <= 1,
      };
    }

    return null;
  };

  const message = getMessage();

  if (!message) return null;

  const handleActivate = () => {
    navigate('/dashboard/settings?tab=security&action=enable2fa');
  };

  // Style selon position
  const positionClass =
    position === 'top' ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : 'relative';

  return (
    <div className={cn(positionClass, style.bg, style.border, 'border-b', className)}>
      <Alert className={cn('border-0 rounded-none', style.bg)}>
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Icône + Message */}
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('mt-0.5', style.icon)}>{message.icon}</div>
            <div className="flex-1">
              <div className={cn('font-semibold text-sm mb-1', style.text)}>{message.title}</div>
              <AlertDescription className={cn('text-sm', style.text)}>
                {message.description}
              </AlertDescription>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            {message.urgent && (
              <div
                className={cn(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  autoVariant === 'danger'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                )}
              >
                URGENT
              </div>
            )}
            <Button onClick={handleActivate} className={style.button} size="sm">
              <Shield className="h-4 w-4 mr-2" />
              {message.cta}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};

/**
 * Version compacte du banner pour dashboard cards
 */
export const Require2FACard = () => {
  const { user } = useAuth();
  const { requires2FA, daysRemaining, is2FAEnabled } = useRequire2FA({
    disableRedirect: true,
  });
  const navigate = useNavigate();

  if (isPrincipalAdminEmail(user?.email)) {
    return null;
  }

  if (is2FAEnabled || (!requires2FA && daysRemaining === null)) {
    return null;
  }

  return (
    <div
      className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
      onClick={() => navigate('/dashboard/settings?tab=security&action=enable2fa')}
    >
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-orange-600" />
        <div className="flex-1">
          <div className="font-semibold text-orange-900">Sécurisez votre compte</div>
          <div className="text-sm text-orange-700">
            {daysRemaining !== null && daysRemaining > 0
              ? `Activez le 2FA (${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''})`
              : 'Activation 2FA requise maintenant'}
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-orange-600" />
      </div>
    </div>
  );
};
