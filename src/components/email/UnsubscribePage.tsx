/**
 * Page publique de désabonnement email (préférences + liste email_unsubscribes)
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  EmailPreferencesService,
  type UnsubscribeType,
} from '@/lib/email/email-preferences-service';
import { useAuth } from '@/contexts/AuthContext';

export const UnsubscribePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [unsubscribeType, setUnsubscribeType] = useState<UnsubscribeType>('marketing');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campaignId = searchParams.get('campaign_id') ?? undefined;

  useEffect(() => {
    const paramEmail = searchParams.get('email');
    const paramType = searchParams.get('type') as UnsubscribeType | null;
    if (paramEmail) setEmail(paramEmail);
    if (paramType && ['all', 'marketing', 'newsletter', 'transactional'].includes(paramType)) {
      setUnsubscribeType(paramType);
    } else if (searchParams.get('newsletter') === '1') {
      setUnsubscribeType('newsletter');
    }
    if (!paramEmail && user?.email) {
      setEmail(user.email);
    }
  }, [searchParams, user?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await EmailPreferencesService.recordUnsubscribe({
        email,
        unsubscribeType,
        reason: reason || undefined,
        campaignId,
        userId: user?.id,
      });
      setSuccess(true);
      setReason('');
    } catch (caught: unknown) {
      const errorMessage =
        caught instanceof Error
          ? caught.message
          : t('emails.unsubscribe.error', 'Erreur lors du désabonnement');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">
              {t('emails.unsubscribe.success.title', 'Désabonnement confirmé')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('emails.unsubscribe.success.description', 'Vos préférences ont été mises à jour')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {unsubscribeType === 'all'
                  ? t(
                      'emails.unsubscribe.success.all',
                      'Vous ne recevrez plus nos emails marketing et notifications optionnelles.'
                    )
                  : t('emails.unsubscribe.success.type', {
                      type: unsubscribeType,
                      defaultValue: `Désabonnement enregistré pour : ${unsubscribeType}.`,
                    })}
              </AlertDescription>
            </Alert>
            {user && (
              <Button variant="outline" className="w-full" asChild>
                <Link to="/settings/notifications">
                  {t('emails.unsubscribe.manageAccount', 'Gérer toutes mes préférences')}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-muted">
              <Mail className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-center">
            {t('emails.unsubscribe.title', 'Gérer vos préférences email')}
          </CardTitle>
          <CardDescription className="text-center">
            {t(
              'emails.unsubscribe.description',
              'Désabonnez-vous des emails marketing ou ajustez le type de messages reçus'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">
                {t('emails.unsubscribe.emailLabel', 'Votre adresse email *')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emails.unsubscribe.emailPlaceholder', 'votre@email.com')}
                required
              />
            </div>

            <div>
              <Label htmlFor="unsubscribe-type">
                {t('emails.unsubscribe.typeLabel', 'Type de désabonnement *')}
              </Label>
              <Select
                value={unsubscribeType}
                onValueChange={(value: UnsubscribeType) => setUnsubscribeType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">
                    {t('emails.unsubscribe.types.marketing', 'Emails marketing uniquement')}
                  </SelectItem>
                  <SelectItem value="newsletter">
                    {t('emails.unsubscribe.types.newsletter', 'Newsletters uniquement')}
                  </SelectItem>
                  <SelectItem value="transactional">
                    {t(
                      'emails.unsubscribe.types.transactional',
                      'Emails transactionnels (non recommandé)'
                    )}
                  </SelectItem>
                  <SelectItem value="all">
                    {t('emails.unsubscribe.types.all', 'Tous les emails optionnels')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">
                {t('emails.unsubscribe.reasonLabel', 'Raison (optionnel)')}
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder={t(
                  'emails.unsubscribe.reasonPlaceholder',
                  'Pourquoi vous désabonnez-vous ?'
                )}
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('emails.unsubscribe.processing', 'Traitement...')}
                </>
              ) : (
                t('emails.unsubscribe.confirm', 'Confirmer le désabonnement')
              )}
            </Button>

            {user && (
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/settings/notifications" className="underline hover:text-foreground">
                  {t('emails.unsubscribe.settingsLink', 'Préférences complètes du compte')}
                </Link>
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
