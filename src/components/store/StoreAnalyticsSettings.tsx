/**
 * Composant de configuration des Analytics et Tracking pour une boutique.
 * Pixels standards uniquement en production (scripts custom désactivés — XSS).
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

const ALLOW_CUSTOM_TRACKING_SCRIPTS_UI =
  import.meta.env.DEV && import.meta.env.VITE_ALLOW_CUSTOM_TRACKING_SCRIPTS === 'true';

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

/**
 * Security validation for custom tracking scripts
 * Implements whitelist-based validation to prevent XSS attacks
 */
const SCRIPT_VALIDATION = {
  // Whitelist: allowed patterns for legitimate tracking scripts
  allowedPatterns: [
    // Google Analytics
    /<script[^>]*src=["']https:\/\/www\.googletagmanager\.com\/gtm\.js["'][^>]*>/,
    /<script[^>]*src=["']https:\/\/www\.google-analytics\.com\/analytics\.js["'][^>]*>/,
    /window\.dataLayer\s*=/,
    /gtag\s*\(/,
    /ga\s*\(/,

    // Facebook Pixel
    /<script[^>]*src=["']https:\/\/connect\.facebook\.net\/[a-z_]+\/fbevents\.js["'][^>]*>/,
    /fbq\s*\(/,

    // TikTok Pixel
    /<script[^>]*src=["']https:\/\/analytics\.tiktok\.com\/[a-z0-9]+\/pixel\.js["'][^>]*>/,
    /ttq\s*\(/,

    // Hotjar
    /<script[^>]*src=["']https:\/\/static\.hotjar\.com\/c\/hotjar-[0-9]+\.js["'][^>]*>/,
    /hj\s*\(/,

    // Mixpanel
    /<script[^>]*src=["']https:\/\/cdn\.mxpnl\.com\/libs\/mixpanel-[0-9.]+\.min\.js["'][^>]*>/,
    /mixpanel\s*\./,

    // Generic safe patterns
    /window\._{0,2}[a-zA-Z0-9_]+\s*=/,
    /\(function\s*\([^)]*\)\s*\{/,
    /document\.addEventListener\s*\(/,
  ] as const,

  // Blacklist: dangerous patterns that are never allowed
  dangerousPatterns: [
    /eval\s*\(/,
    /Function\s*\(/,
    /document\.write\s*\(/,
    /document\.writeln\s*\(/,
    /innerHTML\s*=/,
    /outerHTML\s*=/,
    /insertAdjacentHTML\s*\(/,
    /\.exec\s*\(/,
    /setTimeout\s*\(\s*["']/,
    /setInterval\s*\(\s*["']/,
    /atob\s*\(/,
    /btoa\s*\(/,
    /fromCharCode\s*\(/,
    /String\.fromCharCode/,
    /unescape\s*\(/,
    /escape\s*\(/,
    /javascript:/i,
    /on\w+\s*=/,
    /<iframe[^>]*src=["']javascript:/i,
    /<script[^>]*on\w+\s*=/i,
    /location\s*=/,
    /location\.href\s*=/,
    /location\.replace\s*\(/,
    /window\.location\s*=/,
    /document\.cookie\s*=/,
    /document\.domain\s*=/,
    /navigator\s*\./,
  ] as const,
};

/**
 * Validates a custom script against security patterns
 * Returns { valid: boolean, error?: string }
 */
function validateCustomScript(script: string): { valid: boolean; error?: string } {
  if (!script || script.trim().length === 0) {
    return { valid: true };
  }

  // Check for dangerous patterns first (blacklist)
  for (const pattern of SCRIPT_VALIDATION.dangerousPatterns) {
    if (pattern.test(script)) {
      return {
        valid: false,
        error: 'Script contient des patterns dangereux non autorisés (eval, innerHTML, etc.)',
      };
    }
  }

  // Check if script contains at least one allowed pattern
  const hasAllowedPattern = SCRIPT_VALIDATION.allowedPatterns.some(pattern => pattern.test(script));

  if (!hasAllowedPattern) {
    return {
      valid: false,
      error:
        'Script ne contient aucun pattern de tracking reconnu. Utilisez les intégrations natives (GA, Facebook, TikTok) ou contactez le support.',
    };
  }

  // Additional security: limit script length
  if (script.length > 50000) {
    return {
      valid: false,
      error: 'Script trop long (max 50 000 caractères)',
    };
  }

  return { valid: true };
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
  const [localGoogleAnalyticsEnabled, setLocalGoogleAnalyticsEnabled] =
    useState(googleAnalyticsEnabled);
  const [localFacebookPixelId, setLocalFacebookPixelId] = useState(facebookPixelId || '');
  const [localFacebookPixelEnabled, setLocalFacebookPixelEnabled] = useState(facebookPixelEnabled);
  const [localGoogleTagManagerId, setLocalGoogleTagManagerId] = useState(googleTagManagerId || '');
  const [localGoogleTagManagerEnabled, setLocalGoogleTagManagerEnabled] =
    useState(googleTagManagerEnabled);
  const [localTiktokPixelId, setLocalTiktokPixelId] = useState(tiktokPixelId || '');
  const [localTiktokPixelEnabled, setLocalTiktokPixelEnabled] = useState(tiktokPixelEnabled);
  const [localCustomScripts, setLocalCustomScripts] = useState(customScripts || '');
  const [localCustomScriptsEnabled, setLocalCustomScriptsEnabled] = useState(customScriptsEnabled);
  const [scriptValidationError, setScriptValidationError] = useState<string | null>(null);

  // Validate script on change
  const scriptValidationResult = useMemo(() => {
    return validateCustomScript(localCustomScripts);
  }, [localCustomScripts]);

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

    // Validate before allowing save
    const validation = validateCustomScript(value);
    if (!validation.valid) {
      setScriptValidationError(validation.error || 'Script invalide');
      // Don't call parent if invalid
      return;
    }

    setScriptValidationError(null);
    onCustomScriptsChange?.(value, localCustomScriptsEnabled);
  };

  const handleCustomScriptsEnabledChange = (enabled: boolean) => {
    // Validate before enabling
    if (enabled) {
      const validation = validateCustomScript(localCustomScripts);
      if (!validation.valid) {
        setScriptValidationError(validation.error || 'Script invalide');
        return;
      }
    }

    setLocalCustomScriptsEnabled(enabled);
    setScriptValidationError(null);
    onCustomScriptsChange?.(localCustomScripts, enabled);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Analytics et Tracking</AlertTitle>
        <AlertDescription>
          Configurez vos outils de suivi et d'analyse pour mesurer les performances de votre
          boutique. Les scripts seront automatiquement injectés dans votre storefront public.
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
                onChange={e => handleGoogleAnalyticsIdChange(e.target.value)}
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
                onChange={e => handleFacebookPixelIdChange(e.target.value)}
                placeholder="123456789012345"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Votre Facebook Pixel ID (15 chiffres)</p>
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
                onChange={e => handleGoogleTagManagerIdChange(e.target.value)}
                placeholder="GTM-XXXXXXX"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Format: GTM-XXXXXXX</p>
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
                onChange={e => handleTiktokPixelIdChange(e.target.value)}
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

      {ALLOW_CUSTOM_TRACKING_SCRIPTS_UI ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scripts personnalisés (dev)</CardTitle>
            <CardDescription className="text-xs">
              Visible uniquement en développement avec VITE_ALLOW_CUSTOM_TRACKING_SCRIPTS=true
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={localCustomScripts}
              onChange={e => handleCustomScriptsChange(e.target.value)}
              className="font-mono text-xs min-h-[120px]"
              disabled={!localCustomScriptsEnabled}
            />
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Pixels standards uniquement</AlertTitle>
          <AlertDescription className="text-xs">
            Les scripts HTML/JavaScript personnalisés ne sont plus proposés sur la vitrine publique
            pour des raisons de sécurité. Utilisez Google Analytics, Meta Pixel, GTM ou TikTok Pixel
            ci-dessus.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Note importante</AlertTitle>
        <AlertDescription className="text-xs">
          Les scripts de tracking ne seront actifs que sur votre storefront public. Ils ne sont pas
          chargés dans l'interface d'administration pour préserver votre vie privée.
        </AlertDescription>
      </Alert>
    </div>
  );
};
