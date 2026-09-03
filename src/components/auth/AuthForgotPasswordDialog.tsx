/**
 * Dialog « mot de passe oublié » — extrait d'Auth pour alléger le chunk login.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AUTH_LOGIN_PATH } from '@/lib/auth-routes';
import { logger } from '@/lib/logger';
import { coerceToErrorString, formatAuthErrorForUi } from '@/lib/auth-error-messages';

export type AuthForgotPasswordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthForgotPasswordDialog({ open, onOpenChange }: AuthForgotPasswordDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [resetEmail, setResetEmail] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setResetSent(false);
      setResetEmail('');
      setResetError('');
    }
    onOpenChange(next);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetError('');
    setIsResetLoading(true);

    if (!resetEmail || !resetEmail.includes('@')) {
      setResetError(
        t('auth.forgotPassword.errorInvalidEmail', 'Veuillez entrer une adresse email valide')
      );
      setIsResetLoading(false);
      return;
    }

    try {
      const { checkAuthRateLimit } = await import('@/lib/auth-rate-limiter');
      const rateLimitResult = await checkAuthRateLimit('reset-password', resetEmail);

      if (!rateLimitResult.allowed) {
        const rateLimitMsg = coerceToErrorString(
          rateLimitResult.message,
          t(
            'auth.forgotPassword.rateLimitExceeded',
            'Trop de demandes de réinitialisation. Réessayez plus tard.'
          )
        );
        setResetError(rateLimitMsg);
        setIsResetLoading(false);
        toast({
          title: t('auth.forgotPassword.rateLimitTitle', 'Limite atteinte'),
          description: rateLimitMsg,
          variant: 'destructive',
        });
        return;
      }
    } catch (rateLimitError) {
      logger.warn('Rate limit check failed for password reset', { error: rateLimitError });
    }

    try {
      const redirectUrl = `${window.location.origin}${AUTH_LOGIN_PATH}?type=reset-password`;

      const { error: resetPwError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (resetPwError) throw resetPwError;

      setResetSent(true);
      toast({
        title: t('auth.forgotPassword.successTitle', 'Email envoyé'),
        description: t(
          'auth.forgotPassword.successDescription',
          `Un email de réinitialisation a été envoyé à ${resetEmail}. Vérifiez votre boîte de réception.`
        ),
      });
    } catch (caught: unknown) {
      const errorMessage = formatAuthErrorForUi(
        caught,
        'reset',
        t('auth.forgotPassword.error', "Une erreur est survenue lors de l'envoi de l'email")
      );
      logger.error('Reset password error', {
        error: errorMessage,
        email: resetEmail,
      });
      setResetError(errorMessage);
      toast({
        title: t('auth.forgotPassword.errorTitle', 'Erreur'),
        description: errorMessage || t('auth.forgotPassword.error', 'Une erreur est survenue'),
        variant: 'destructive',
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {t('auth.forgotPassword.title', 'Réinitialiser le mot de passe')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'auth.forgotPassword.description',
              'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.'
            )}
          </DialogDescription>
        </DialogHeader>

        {resetSent ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {t('auth.forgotPassword.successTitle', 'Email envoyé !')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    'auth.forgotPassword.successMessage',
                    `Nous avons envoyé un lien de réinitialisation à ${resetEmail}. Vérifiez votre boîte de réception et votre dossier spam.`
                  )}
                </p>
              </div>
              <Button
                onClick={() => handleOpenChange(false)}
                className="w-full min-h-[44px] text-base touch-manipulation"
              >
                {t('common.close', 'Fermer')}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 py-4">
            {resetError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resetError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="reset-email">
                {t('auth.forgotPassword.emailLabel', 'Adresse email')}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={t('auth.forgotPassword.emailPlaceholder', 'votre@email.com')}
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  disabled={isResetLoading}
                  autoComplete="email"
                  className="pl-10 min-h-[44px] text-base"
                  aria-required="true"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full min-h-[44px] text-base touch-manipulation"
                disabled={isResetLoading || !resetEmail}
                aria-busy={isResetLoading}
              >
                {isResetLoading
                  ? t('auth.forgotPassword.sending', 'Envoi en cours...')
                  : t('auth.forgotPassword.sendButton', 'Envoyer le lien de réinitialisation')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="touch-manipulation min-h-[44px] text-base"
                disabled={isResetLoading}
              >
                {t('common.cancel', 'Annuler')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
