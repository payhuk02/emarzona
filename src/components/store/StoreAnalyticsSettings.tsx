/**
 * Composant de configuration des Analytics et Tracking pour une boutique
 * Permet de configurer Google Analytics, Facebook Pixel, Google Tag Manager,
 * TikTok Pixel et des scripts personnalisés
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, Code, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface StoreAnalyticsSettingsProps {
  // Google Analytics
  googleAnalyticsId?: string | null;
  googleAnalyticsEnabled?: boolean;
  onGoogleAnalyticsChange?: (id: string, enabled: boolean) => void;
  
  // Facebook Pixel
  facebookPixelId?: string | null;
  facebookPixelEnabled?: boolean;
  onFacebookPixelChange?: (id: string, enabled: boolean) => void;
  
  // Google Tag Manager
  googleTagManagerId?: string | null;
  googleTagManagerEnabled?: boolean;
  onGoogleTagManagerChange?: (id: string, enabled: boolean) => void;
  
  // TikTok Pixel
  tiktokPixelId?: string | null;
  tiktokPixelEnabled?: boolean;
  onTiktokPixelChange?: (id: string, enabled: boolean) => void;
  
  // Scripts personnalisés
  customScripts?: string | null;
  customScriptsEnabled?: boolean;
  onCustomScriptsChange?: (scripts: string, enabled: boolean) => void;
}

export const StoreAnalyticsSettings = ({
  googleAnalyticsId = '',
  googleAnalyticsEnabled = false,
  onGoogleAnalyticsChange,
  facebookPixelId = '',
  facebookPixelEnabled = false,
  onFacebookPixelChange,
  googleTagManagerId = '',
  googleTagManagerEnabled = false,
  onGoogleTagManagerChange,
  tiktokPixelId = '',
  tiktokPixelEnabled = false,
  onTiktokPixelChange,
  customScripts = '',
  customScriptsEnabled = false,
  onCustomScriptsChange,
}: StoreAnalyticsSettingsProps) => {
  const [localGoogleAnalyticsId, setLocalGoogleAnalyticsId] = useState(googleAnalyticsId || '');
  const [localGoogleAnalyticsEnabled, setLocalGoogleAnalyticsEnabled] = useState(googleAnalyticsEnabled);
  const [localFacebookPixelId, setLocalFacebookPixelId] = useState(facebookPixelId || '');
  const [localFacebookPixelEnabled, setLocalFacebookPixelEnabled] = useState(facebookPixelEnabled);
  const [localGoogleTagManagerId, setLocalGoogleTagManagerId] = useState(googleTagManagerId || '');
  const [localGoogleTagManagerEnabled, setLocalGoogleTagManagerEnabled] = useState(googleTagManagerEnabled);
  const [localTiktokPixelId, setLocalTiktokPixelId] = useState(tiktokPixelId || '');
  const [localTiktokPixelEnabled, setLocalTiktokPixelEnabled] = useState(tiktokPixelEnabled);
  const [localCustomScripts, setLocalCustomScripts] = useState(customScripts || '');
  const [localCustomScriptsEnabled, setLocalCustomScriptsEnabled] = useState(customScriptsEnabled);

  const handleGoogleAnalyticsIdChange = (value: string) => {
    setLocalGoogleAnalyticsId(value);
    onGoogleAnalyticsChange?.(value, localGoogleAnalyticsEnabled);
  };

  const handleGoogleAnalyticsEnabledChange = (enabled: boolean) => {
    setLocalGoogleAnalyticsEnabled(enabled);
    onGoogleAnalyticsChange?.(localGoogleAnalyticsId, enabled);
  };

  const handleFacebookPixelIdChange = (value: string) => {
    setLocalFacebookPixelId(value);
    onFacebookPixelChange?.(value, localFacebookPixelEnabled);
  };

  const handleFacebookPixelEnabledChange = (enabled: boolean) => {
    setLocalFacebookPixelEnabled(enabled);
    onFacebookPixelChange?.(localFacebookPixelId, enabled);
  };

  const handleGoogleTagManagerIdChange = (value: string) => {
    setLocalGoogleTagManagerId(value);
    onGoogleTagManagerChange?.(value, localGoogleTagManagerEnabled);
  };

  const handleGoogleTagManagerEnabledChange = (enabled: boolean) => {
    setLocalGoogleTagManagerEnabled(enabled);
    onGoogleTagManagerChange?.(localGoogleTagManagerId, enabled);
  };

  const handleTiktokPixelIdChange = (value: string) => {
    setLocalTiktokPixelId(value);
    onTiktokPixelChange?.(value, localTiktokPixelEnabled);
  };

  const handleTiktokPixelEnabledChange = (enabled: boolean) => {
    setLocalTiktokPixelEnabled(enabled);
    onTiktokPixelChange?.(localTiktokPixelId, enabled);
  };

  const handleCustomScriptsChange = (value: string) => {
    setLocalCustomScripts(value);
    onCustomScriptsChange?.(value, localCustomScriptsEnabled);
  };

  const handleCustomScriptsEnabledChange = (enabled: boolean) => {
    setLocalCustomScriptsEnabled(enabled);
    onCustomScriptsChange?.(localCustomScripts, enabled);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Analytics et Tracking</AlertTitle>
        <AlertDescription>
          Configurez vos outils de suivi et d'analyse pour mesurer les performances de votre boutique.
          Les scripts seront automatiquement injectés dans votre storefront public.
        </AlertDescription>
      </Alert>

      {/* Google Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle className="text-base">Google Analytics</CardTitle>
                <CardDescription className="text-xs">
                  Suivez les visiteurs et les conversions de votre boutique
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={localGoogleAnalyticsEnabled}
              onCheckedChange={handleGoogleAnalyticsEnabledChange}
            />
          </div>
        </CardHeader>
        {localGoogleAnalyticsEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google_analytics_id">Tracking ID</Label>
              <Input
                id="google_analytics_id"
                type="text"
                value={localGoogleAnalyticsId}
                onChange={(e) => handleGoogleAnalyticsIdChange(e.target.value)}
                placeholder="G-XXXXXXXXXX ou UA-XXXXXXXXX-X"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: G-XXXXXXXXXX (GA4) ou UA-XXXXXXXXX-X (Universal Analytics)
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Facebook Pixel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-700" />
              <div>
                <CardTitle className="text-base">Facebook Pixel</CardTitle>
                <CardDescription className="text-xs">
                  Suivez les conversions et optimisez vos publicités Facebook
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={localFacebookPixelEnabled}
              onCheckedChange={handleFacebookPixelEnabledChange}
            />
          </div>
        </CardHeader>
        {localFacebookPixelEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook_pixel_id">Pixel ID</Label>
              <Input
                id="facebook_pixel_id"
                type="text"
                value={localFacebookPixelId}
                onChange={(e) => handleFacebookPixelIdChange(e.target.value)}
                placeholder="123456789012345"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Votre Facebook Pixel ID (15 chiffres)
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Google Tag Manager */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <CardTitle className="text-base">Google Tag Manager</CardTitle>
                <CardDescription className="text-xs">
                  Gérez tous vos tags de suivi depuis une seule interface
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={localGoogleTagManagerEnabled}
              onCheckedChange={handleGoogleTagManagerEnabledChange}
            />
          </div>
        </CardHeader>
        {localGoogleTagManagerEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google_tag_manager_id">Container ID</Label>
              <Input
                id="google_tag_manager_id"
                type="text"
                value={localGoogleTagManagerId}
                onChange={(e) => handleGoogleTagManagerIdChange(e.target.value)}
                placeholder="GTM-XXXXXXX"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: GTM-XXXXXXX
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* TikTok Pixel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-black" />
              <div>
                <CardTitle className="text-base">TikTok Pixel</CardTitle>
                <CardDescription className="text-xs">
                  Suivez les conversions et optimisez vos publicités TikTok
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={localTiktokPixelEnabled}
              onCheckedChange={handleTiktokPixelEnabledChange}
            />
          </div>
        </CardHeader>
        {localTiktokPixelEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tiktok_pixel_id">Pixel ID</Label>
              <Input
                id="tiktok_pixel_id"
                type="text"
                value={localTiktokPixelId}
                onChange={(e) => handleTiktokPixelIdChange(e.target.value)}
                placeholder="CXXXXXXXXXXXXXXX"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Votre TikTok Pixel ID (format: CXXXXXXXXXXXXXXX)
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Scripts personnalisés */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-600" />
              <div>
                <CardTitle className="text-base">Scripts personnalisés</CardTitle>
                <CardDescription className="text-xs">
                  Ajoutez vos propres scripts de tracking (HTML/JavaScript)
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={localCustomScriptsEnabled}
              onCheckedChange={handleCustomScriptsEnabledChange}
            />
          </div>
        </CardHeader>
        {localCustomScriptsEnabled && (
          <CardContent className="space-y-4">
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Attention</AlertTitle>
              <AlertDescription className="text-xs">
                Assurez-vous que vos scripts sont sûrs et ne contiennent pas de code malveillant.
                Les scripts seront injectés dans toutes les pages de votre storefront.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="custom_scripts">Code HTML/JavaScript</Label>
              <Textarea
                id="custom_scripts"
                value={localCustomScripts}
                onChange={(e) => handleCustomScriptsChange(e.target.value)}
                placeholder={`<script>
  // Votre code de tracking personnalisé
</script>`}
                className="font-mono text-xs min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Insérez vos scripts de tracking personnalisés (ex: Hotjar, Mixpanel, etc.)
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Note importante</AlertTitle>
        <AlertDescription className="text-xs">
          Les scripts de tracking ne seront actifs que sur votre storefront public.
          Ils ne sont pas chargés dans l'interface d'administration pour préserver votre vie privée.
        </AlertDescription>
      </Alert>
    </div>
  );
};







