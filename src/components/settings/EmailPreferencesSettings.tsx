/**
 * Préférences email marketing (compte connecté) — aligné email_preferences + lien désabonnement
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Save, ExternalLink } from 'lucide-react';
import { useEmailPreferences, useUpdateEmailPreferences } from '@/hooks/useEmail';
import type { EmailPreferences } from '@/types/email';

export const EmailPreferencesSettings = () => {
  const { data: preferences, isLoading } = useEmailPreferences();
  const updatePreferences = useUpdateEmailPreferences();
  const [localPrefs, setLocalPrefs] = useState<EmailPreferences | null>(null);

  useEffect(() => {
    if (preferences) setLocalPrefs(preferences);
  }, [preferences]);

  if (isLoading || !localPrefs) {
    return <Skeleton className="h-48 w-full" />;
  }

  const handleToggle = (field: keyof EmailPreferences, value: boolean) => {
    setLocalPrefs(prev => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    const {
      user_id: _uid,
      created_at: _c,
      updated_at: _u,
      unsubscribed_at: _unsub,
      ...patch
    } = localPrefs;
    await updatePreferences.mutateAsync(patch);
  };

  return (
    <Card className="mb-6 border-emerald-200/60 dark:border-emerald-900/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Préférences email Emarzona
        </CardTitle>
        <CardDescription>
          Contrôle des campagnes marketing et notifications par email (Resend). Les emails
          transactionnels essentiels (commandes, sécurité) restent actifs si requis par la loi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Emails marketing</Label>
            <p className="text-sm text-muted-foreground">Promotions, newsletters boutiques</p>
          </div>
          <Switch
            checked={localPrefs.marketing_emails ?? true}
            onCheckedChange={v => handleToggle('marketing_emails', v)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Notifications produit</Label>
            <p className="text-sm text-muted-foreground">Mises à jour cours, produits, affiliés</p>
          </div>
          <Switch
            checked={localPrefs.notification_emails ?? true}
            onCheckedChange={v => handleToggle('notification_emails', v)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Suivi des commandes</Label>
            <p className="text-sm text-muted-foreground">Confirmations et statuts de livraison</p>
          </div>
          <Switch
            checked={localPrefs.order_updates ?? true}
            onCheckedChange={v => handleToggle('order_updates', v)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Nouveautés produits</Label>
          </div>
          <Switch
            checked={localPrefs.product_updates ?? true}
            onCheckedChange={v => handleToggle('product_updates', v)}
          />
        </div>
        {localPrefs.affiliate_updates !== undefined && localPrefs.affiliate_updates !== null && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Programme affilié</Label>
            </div>
            <Switch
              checked={!!localPrefs.affiliate_updates}
              onCheckedChange={v => handleToggle('affiliate_updates', v)}
            />
          </div>
        )}
        {localPrefs.course_updates !== undefined && localPrefs.course_updates !== null && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Mises à jour de cours</Label>
            </div>
            <Switch
              checked={!!localPrefs.course_updates}
              onCheckedChange={v => handleToggle('course_updates', v)}
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button onClick={handleSave} disabled={updatePreferences.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer les préférences email
          </Button>
          <Button variant="outline" asChild>
            <Link to="/unsubscribe">
              <ExternalLink className="h-4 w-4 mr-2" />
              Page de désabonnement public
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
