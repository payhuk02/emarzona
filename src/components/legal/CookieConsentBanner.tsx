/**
 * Cookie Consent Banner - Conformité RGPD
 * Affiche un banner pour accepter/personnaliser les cookies
 * Date: 27 octobre 2025
 */

import { useState, useEffect } from 'react';
import { X, Settings, Check } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateCookiePreferences, useCookiePreferences } from '@/hooks/useLegal';
import type { CookiePreferences } from '@/types/legal';

export const CookieConsentBanner = () => {
  const { user } = useAuth();
  const { data: currentPreferences } = useCookiePreferences(user?.id);
  const updatePreferences = useUpdateCookiePreferences();

  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [preferences, setPreferences] = useState<Partial<CookiePreferences>>({
    necessary: true, // Toujours true
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const hasConsent = localStorage.getItem('cookieConsentGiven');
    
    if (!hasConsent && !currentPreferences) {
      // Afficher le banner après 2 secondes
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentPreferences]);

  const handleAcceptAll = async () => {
    const allAccepted: Partial<CookiePreferences> = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };

    await updatePreferences.mutateAsync({
      userId: user?.id,
      preferences: allAccepted,
    });

    localStorage.setItem('cookieConsentGiven', 'true');
    setShowBanner(false);
  };

  const handleRejectAll = async () => {
    const allRejected: Partial<CookiePreferences> = {
      necessary: true, // Obligatoire
      functional: false,
      analytics: false,
      marketing: false,
    };

    await updatePreferences.mutateAsync({
      userId: user?.id,
      preferences: allRejected,
    });

    localStorage.setItem('cookieConsentGiven', 'true');
    setShowBanner(false);
  };

  const handleSavePreferences = async () => {
    await updatePreferences.mutateAsync({
      userId: user?.id,
      preferences,
    });

    localStorage.setItem('cookieConsentGiven', 'true');
    setShowSettings(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Banner fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    🍪 Nous utilisons des cookies
                  </h3>
                  <p className="text-sm text-gray-600">
                    Nous utilisons des cookies pour améliorer votre expérience, 
                    analyser notre trafic et personnaliser le contenu. 
                    Vous pouvez accepter tous les cookies ou les personnaliser.{' '}
                    <a 
                      href="/legal/cookies" 
                      className="text-blue-600 hover:underline"
                      target="_blank"
                    >
                      En savoir plus
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSettings(true);
                  setShowBanner(false);
                }}
                className="whitespace-nowrap"
              >
                <Settings className="w-4 h-4 mr-2" />
                Personnaliser
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="whitespace-nowrap"
              >
                Tout refuser
              </Button>

              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="whitespace-nowrap"
              >
                <Check className="w-4 h-4 mr-2" />
                Tout accepter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Paramètres */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paramètres des cookies</DialogTitle>
            <DialogDescription>
              Choisissez les catégories de cookies que vous souhaitez autoriser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Cookies nécessaires (toujours activés) */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label className="font-semibold">Cookies nécessaires</Label>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    Toujours actifs
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés. 
                  Ils permettent la navigation et l'utilisation des fonctionnalités de base.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>

            {/* Cookies fonctionnels */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="flex-1">
                <Label className="font-semibold mb-1 block">Cookies fonctionnels</Label>
                <p className="text-sm text-gray-600">
                  Ces cookies permettent d'améliorer votre expérience en mémorisant vos préférences 
                  (langue, thème, etc.).
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, functional: checked })
                }
              />
            </div>

            {/* Cookies analytics */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b">
              <div className="flex-1">
                <Label className="font-semibold mb-1 block">Cookies analytics</Label>
                <p className="text-sm text-gray-600">
                  Ces cookies nous permettent de mesurer l'audience et d'améliorer notre site 
                  en analysant comment vous l'utilisez.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
              />
            </div>

            {/* Cookies marketing */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="font-semibold mb-1 block">Cookies marketing</Label>
                <p className="text-sm text-gray-600">
                  Ces cookies sont utilisés pour afficher des publicités pertinentes 
                  et mesurer l'efficacité de nos campagnes.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Annuler
            </Button>
            <Button onClick={handleSavePreferences}>
              Sauvegarder mes préférences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

