/**
 * DigitalPreferences - Paramètres et préférences du client
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Download, Mail, Shield, Save } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Separator } from '@/components/ui/separator';

interface UserPreferences {
  auto_download: boolean;
  email_notifications: boolean;
  price_drop_alerts: boolean;
  new_version_alerts: boolean;
  license_expiry_alerts: boolean;
  license_expiry_days_before: number;
  download_notifications: boolean;
}

export const DigitalPreferences = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<UserPreferences>({
    auto_download: false,
    email_notifications: true,
    price_drop_alerts: true,
    new_version_alerts: true,
    license_expiry_alerts: true,
    license_expiry_days_before: 7,
    download_notifications: true,
  });

  // Charger les préférences existantes
  const { isLoading } = useQuery({
    queryKey: ['userDigitalPreferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Récupérer depuis profiles.digital_preferences
      // Utiliser user_id au lieu de id car profiles.id est un UUID généré, pas user_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('digital_preferences')
        .eq('user_id', user.id)
        .single();
      
      // Si la colonne n'existe pas encore, retourner les préférences par défaut
      if (profileError) {
        // Si l'erreur est due à la colonne manquante (PGRST116 ou 400), retourner les préférences par défaut
        if (profileError.code === 'PGRST116' || profileError.code === '42703' || profileError.message?.includes('digital_preferences')) {
          logger.debug('digital_preferences column not found, using defaults', { error: profileError });
          return preferences;
        }
        // Pour les autres erreurs, logger et retourner les préférences par défaut
        logger.warn('Error fetching digital preferences', { error: profileError });
        return preferences;
      }

      if (profile?.digital_preferences) {
        setPreferences({ ...preferences, ...profile.digital_preferences });
      }

      return profile?.digital_preferences || preferences;
    },
  });

  const savePreferences = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Sauvegarder dans profiles.digital_preferences (JSONB)
      // Utiliser user_id au lieu de id car profiles.id est un UUID généré, pas user_id
      // Utiliser update au lieu de upsert car le profil devrait déjà exister
      const { error } = await supabase
        .from('profiles')
        .update({
          digital_preferences: prefs,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        logger.error('Error saving preferences', { error });
        throw error;
      }

      return prefs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userDigitalPreferences'] });
      toast({
        title: 'Préférences enregistrées',
        description: 'Vos préférences ont été mises à jour avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error in savePreferences', { error });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'enregistrer les préférences',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    savePreferences.mutate(preferences);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configurez vos préférences de notification pour les produits digitaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications par email</Label>
              <div className="text-sm text-muted-foreground">
                Recevez des emails pour les événements importants
              </div>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, email_notifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertes de baisse de prix</Label>
              <div className="text-sm text-muted-foreground">
                Soyez notifié lorsque le prix d'un produit de votre wishlist baisse
              </div>
            </div>
            <Switch
              checked={preferences.price_drop_alerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, price_drop_alerts: checked })
              }
              disabled={!preferences.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertes de nouvelles versions</Label>
              <div className="text-sm text-muted-foreground">
                Recevez une notification lorsqu'une nouvelle version est disponible
              </div>
            </div>
            <Switch
              checked={preferences.new_version_alerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, new_version_alerts: checked })
              }
              disabled={!preferences.email_notifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertes d'expiration de licence</Label>
              <div className="text-sm text-muted-foreground">
                Recevez une notification avant l'expiration de vos licences
              </div>
            </div>
            <Switch
              checked={preferences.license_expiry_alerts}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, license_expiry_alerts: checked })
              }
              disabled={!preferences.email_notifications}
            />
          </div>

          {preferences.license_expiry_alerts && (
            <div className="space-y-2">
              <Label>Nombre de jours avant expiration</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={preferences.license_expiry_days_before}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    license_expiry_days_before: parseInt(e.target.value) || 7,
                  })
                }
                className="max-w-xs"
              />
              <div className="text-sm text-muted-foreground">
                Vous serez notifié {preferences.license_expiry_days_before} jour(s) avant l'expiration
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Téléchargements
          </CardTitle>
          <CardDescription>
            Paramètres liés aux téléchargements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Téléchargement automatique</Label>
              <div className="text-sm text-muted-foreground">
                Téléchargez automatiquement les fichiers après l'achat
              </div>
            </div>
            <Switch
              checked={preferences.auto_download}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, auto_download: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notifications de téléchargement</Label>
              <div className="text-sm text-muted-foreground">
                Recevez une notification après chaque téléchargement réussi
              </div>
            </div>
            <Switch
              checked={preferences.download_notifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, download_notifications: checked })
              }
              disabled={!preferences.email_notifications}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Paramètres de sécurité et confidentialité
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Vos préférences sont stockées de manière sécurisée et ne sont utilisées que pour améliorer votre expérience.
              Vous pouvez modifier ces paramètres à tout moment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bouton de sauvegarde */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={savePreferences.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {savePreferences.isPending ? 'Enregistrement...' : 'Enregistrer les préférences'}
        </Button>
      </div>
    </div>
  );
};

