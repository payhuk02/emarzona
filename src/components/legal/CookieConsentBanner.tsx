/**
 * Cookie Consent Banner - Conformité RGPD
 */

import { useState, useEffect } from 'react';
import { Settings, Check } from '@/components/icons';
import { Link } from 'react-router-dom';
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
import {
  getStoredCookiePreferences,
  hasCookieConsentGiven,
  OPEN_COOKIE_SETTINGS_EVENT,
} from '@/lib/cookie-consent';
import type { CookiePreferences } from '@/types/legal';

const DEFAULT_PREFERENCES: Partial<CookiePreferences> = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export const CookieConsentBanner = () => {
  const { user } = useAuth();
  const { data: currentPreferences } = useCookiePreferences(user?.id);
  const updatePreferences = useUpdateCookiePreferences();

  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [preferences, setPreferences] = useState<Partial<CookiePreferences>>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (hasCookieConsentGiven() || currentPreferences) return;

    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [currentPreferences]);

  useEffect(() => {
    const stored = currentPreferences ?? getStoredCookiePreferences();
    if (stored) {
      setPreferences({
        necessary: true,
        functional: stored.functional ?? false,
        analytics: stored.analytics ?? false,
        marketing: stored.marketing ?? false,
      });
    }
  }, [currentPreferences]);

  useEffect(() => {
    const openSettings = () => {
      const stored = currentPreferences ?? getStoredCookiePreferences();
      if (stored) {
        setPreferences({
          necessary: true,
          functional: stored.functional ?? false,
          analytics: stored.analytics ?? false,
          marketing: stored.marketing ?? false,
        });
      }
      setShowSettings(true);
      setShowBanner(false);
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, [currentPreferences]);

  const persistPreferences = async (next: Partial<CookiePreferences>) => {
    setIsSaving(true);
    try {
      await updatePreferences.mutateAsync({
        userId: user?.id,
        preferences: next,
      });
      localStorage.setItem('cookieConsentGiven', 'true');
      setShowSettings(false);
      setShowBanner(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptAll = () =>
    persistPreferences({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });

  const handleRejectAll = () => persistPreferences(DEFAULT_PREFERENCES);

  const handleSavePreferences = () => persistPreferences({ ...preferences, necessary: true });

  const handleSettingsOpenChange = (open: boolean) => {
    setShowSettings(open);
    if (!open && !hasCookieConsentGiven()) {
      setShowBanner(true);
    }
  };

  return (
    <>
      {showBanner ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg">
          <div className="container mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <h3 className="mb-1 font-semibold text-gray-900">🍪 Nous utilisons des cookies</h3>
                <p className="text-sm text-gray-600">
                  Nous utilisons des cookies pour améliorer votre expérience, analyser notre trafic
                  et personnaliser le contenu. Vous pouvez accepter tous les cookies ou les
                  personnaliser.{' '}
                  <Link
                    to="/legal/cookies"
                    className="font-medium text-blue-800 underline decoration-blue-800/80 hover:text-blue-900"
                  >
                    En savoir plus
                  </Link>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={() => {
                    setShowSettings(true);
                    setShowBanner(false);
                  }}
                  className="whitespace-nowrap"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Personnaliser
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleRejectAll}
                  className="whitespace-nowrap"
                >
                  Tout refuser
                </Button>

                <Button
                  size="sm"
                  disabled={isSaving}
                  onClick={handleAcceptAll}
                  className="whitespace-nowrap bg-blue-700 text-white hover:bg-blue-800"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Tout accepter
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={showSettings} onOpenChange={handleSettingsOpenChange}>
        <DialogContent className="max-h-[80vh] max-w-[95vw] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Paramètres des cookies</DialogTitle>
            <DialogDescription>
              Choisissez les catégories de cookies que vous souhaitez autoriser.{' '}
              <Link to="/legal/cookies" className="text-blue-800 underline hover:text-blue-900">
                Politique des cookies
              </Link>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Label className="font-semibold">Cookies nécessaires</Label>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">Toujours actifs</span>
                </div>
                <p className="text-sm text-gray-600">
                  Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être
                  désactivés.
                </p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div className="flex-1">
                <Label className="mb-1 block font-semibold">Cookies fonctionnels</Label>
                <p className="text-sm text-gray-600">
                  Mémorisent vos préférences (langue, thème) et activent le chat support.
                </p>
              </div>
              <Switch
                checked={preferences.functional}
                onCheckedChange={checked => setPreferences({ ...preferences, functional: checked })}
              />
            </div>

            <div className="flex items-start justify-between gap-4 border-b pb-4">
              <div className="flex-1">
                <Label className="mb-1 block font-semibold">Cookies analytics</Label>
                <p className="text-sm text-gray-600">
                  Mesurent l&apos;audience et améliorent le site en analysant son utilisation.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={checked => setPreferences({ ...preferences, analytics: checked })}
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="mb-1 block font-semibold">Cookies marketing</Label>
                <p className="text-sm text-gray-600">
                  Publicités pertinentes et mesure de l&apos;efficacité des campagnes.
                </p>
              </div>
              <Switch
                checked={preferences.marketing}
                onCheckedChange={checked => setPreferences({ ...preferences, marketing: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => handleSettingsOpenChange(false)}
            >
              Annuler
            </Button>
            <Button disabled={isSaving} onClick={handleSavePreferences}>
              {isSaving ? 'Enregistrement…' : 'Sauvegarder mes préférences'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
