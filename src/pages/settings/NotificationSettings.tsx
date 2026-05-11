/**
 * Page de paramètres des notifications
 * Gestion des préférences email et in-app
 * Date : 27 octobre 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, Smartphone, Save } from 'lucide-react';
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useRequestNotificationPermission,
} from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { NotificationPreferences } from '@/types/notifications';

const NotificationSettings = () => {
  const { toast } = useToast();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const { permission, requestPermission } = useRequestNotificationPermission();
  const {
    permission: pushPermission,
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    isLoading: isPushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications();

  const [localPrefs, setLocalPrefs] = useState(preferences);

  useEffect(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  }, [preferences]);

  if (isLoading || !localPrefs) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const handleToggle = (field: string, value: boolean | string) => {
    setLocalPrefs((prev: NotificationPreferences | null) => {
      if (!prev) return prev;
      return { ...prev, [field]: value } as NotificationPreferences;
    });
  };

  const handleSave = async () => {
    await updatePreferences.mutateAsync(localPrefs);
    toast({
      title: 'Préférences sauvegardées',
      description: 'Vos préférences de notifications ont été mises à jour',
    });
  };

  const handleRequestBrowserNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast({
        title: 'Notifications activées',
        description: 'Vous recevrez désormais des notifications dans votre navigateur',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Préférences de Notifications</h1>
          <p className="text-muted-foreground">
            Choisissez comment et quand vous souhaitez être notifié
          </p>
        </div>

        {/* Notifications Push */}
        {isPushSupported && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                Notifications Push
              </CardTitle>
              <CardDescription>
                Recevez des notifications push même quand l'application est fermée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications Push</Label>
                  <p className="text-sm text-muted-foreground">
                    {pushPermission.permission === 'granted'
                      ? isPushSubscribed
                        ? 'Vous êtes abonné aux notifications push'
                        : 'Permission accordée mais non abonné'
                      : pushPermission.permission === 'denied'
                      ? 'Notifications push désactivées'
                      : 'Demander la permission pour les notifications push'}
                  </p>
                </div>
                {isPushSubscribed ? (
                  <Button
                    onClick={unsubscribePush}
                    disabled={isPushLoading}
                    variant="destructive"
                  >
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    onClick={subscribePush}
                    disabled={isPushLoading || pushPermission.permission === 'denied'}
                    className="bg-blue-600"
                  >
                    {isPushLoading ? 'Chargement...' : 'Activer'}
                  </Button>
                )}
              </div>
              {pushPermission.permission === 'denied' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Les notifications push ont été désactivées. Activez-les dans les paramètres de votre navigateur.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notifications navigateur (legacy) */}
        {permission !== 'granted' && !isPushSupported && (
          <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notifications navigateur
              </CardTitle>
              <CardDescription>
                Activez les notifications navigateur pour être alerté en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRequestBrowserNotifications} className="bg-blue-600">
                <Bell className="w-4 h-4 mr-2" />
                Activer les notifications
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notifications Email */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Notifications par Email
            </CardTitle>
            <CardDescription>
              Recevez des emails pour les événements suivants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_course_enrollment">Inscription à un cours</Label>
                <p className="text-sm text-muted-foreground">
                  Quand vous vous inscrivez à un nouveau cours
                </p>
              </div>
              <Switch
                id="email_course_enrollment"
                checked={localPrefs.email_course_enrollment}
                onCheckedChange={(checked) => handleToggle('email_course_enrollment', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_course_complete">Cours terminé</Label>
                <p className="text-sm text-muted-foreground">
                  Quand vous terminez un cours
                </p>
              </div>
              <Switch
                id="email_course_complete"
                checked={localPrefs.email_course_complete}
                onCheckedChange={(checked) => handleToggle('email_course_complete', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_certificate_ready">Certificat disponible</Label>
                <p className="text-sm text-muted-foreground">
                  Quand votre certificat est prêt à télécharger
                </p>
              </div>
              <Switch
                id="email_certificate_ready"
                checked={localPrefs.email_certificate_ready}
                onCheckedChange={(checked) => handleToggle('email_certificate_ready', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_new_course">Nouveaux cours</Label>
                <p className="text-sm text-muted-foreground">
                  Quand de nouveaux cours sont disponibles
                </p>
              </div>
              <Switch
                id="email_new_course"
                checked={localPrefs.email_new_course}
                onCheckedChange={(checked) => handleToggle('email_new_course', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_affiliate_sale">Ventes affilié</Label>
                <p className="text-sm text-muted-foreground">
                  Quand vous générez une vente via affiliation
                </p>
              </div>
              <Switch
                id="email_affiliate_sale"
                checked={localPrefs.email_affiliate_sale}
                onCheckedChange={(checked) => handleToggle('email_affiliate_sale', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_quiz_result">Résultats quiz</Label>
                <p className="text-sm text-muted-foreground">
                  Quand vous passez un quiz
                </p>
              </div>
              <Switch
                id="email_quiz_result"
                checked={localPrefs.email_quiz_result}
                onCheckedChange={(checked) => handleToggle('email_quiz_result', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications In-App */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Notifications dans l'Application
            </CardTitle>
            <CardDescription>
              Recevez des notifications dans votre centre de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="app_course_enrollment">Inscription à un cours</Label>
              </div>
              <Switch
                id="app_course_enrollment"
                checked={localPrefs.app_course_enrollment}
                onCheckedChange={(checked) => handleToggle('app_course_enrollment', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="app_lesson_complete">Leçon terminée</Label>
              </div>
              <Switch
                id="app_lesson_complete"
                checked={localPrefs.app_lesson_complete}
                onCheckedChange={(checked) => handleToggle('app_lesson_complete', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="app_course_complete">Cours terminé</Label>
              </div>
              <Switch
                id="app_course_complete"
                checked={localPrefs.app_course_complete}
                onCheckedChange={(checked) => handleToggle('app_course_complete', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="app_affiliate_sale">Ventes affilié</Label>
              </div>
              <Switch
                id="app_affiliate_sale"
                checked={localPrefs.app_affiliate_sale}
                onCheckedChange={(checked) => handleToggle('app_affiliate_sale', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Résumé Email */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Résumé par Email</CardTitle>
            <CardDescription>
              Recevez un récapitulatif de vos notifications par email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Label htmlFor="digest">Fréquence</Label>
              <Select
                value={localPrefs.email_digest_frequency}
                onValueChange={(value: string) => handleToggle('email_digest_frequency', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Jamais</SelectItem>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bouton Sauvegarder */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updatePreferences.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {updatePreferences.isPending ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;







