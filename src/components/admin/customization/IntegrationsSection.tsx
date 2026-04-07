/**
 * Section Intégrations
 * APIs, webhooks, services externes
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  CreditCard,
  Truck,
  BarChart3,
  Video,
  Brain,
  Mail,
  MessageSquare,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface IntegrationsSectionProps {
  onChange?: () => void;
}

export const IntegrationsSection = ({ onChange }: IntegrationsSectionProps) => {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();

  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  const [integrations, setIntegrations] = useState({
    // Paiements
    moneroo: {
      enabled: false,
      apiKey: '',
      mode: 'sandbox' as 'sandbox' | 'production',
    },

    // Video Conferencing
    zoom: {
      enabled: false,
      apiKey: '',
      apiSecret: '',
      accountId: '',
    },

    // AI
    openai: {
      enabled: false,
      apiKey: '',
      model: 'gpt-4',
    },

    // Shipping
    fedex: {
      enabled: false,
      apiKey: '',
      apiSecret: '',
      accountNumber: '',
    },
    dhl: {
      enabled: false,
      siteId: '',
      password: '',
    },
    ups: {
      enabled: false,
      accessKey: '',
      username: '',
      password: '',
    },

    // Analytics
    googleAnalytics: {
      enabled: false,
      trackingId: '',
    },
    facebookPixel: {
      enabled: false,
      pixelId: '',
    },

    // Autres
    sendgrid: {
      enabled: false,
      apiKey: '',
    },
    crisp: {
      enabled: false,
      websiteId: '',
    },
    sentry: {
      enabled: false,
      dsn: '',
    },
  });

  useEffect(() => {
    if (customizationData?.integrations) {
      setIntegrations(prev => ({
        ...prev,
        ...customizationData.integrations,
      }));
    }
  }, [customizationData]);

  const handleIntegrationChange = async (category: string, field: string, value: unknown) => {
    const updatedIntegrations = {
      ...integrations,
      [category]: {
        ...integrations[category as keyof typeof integrations],
        [field]: value,
      },
    };

    setIntegrations(updatedIntegrations);

    await save('integrations', updatedIntegrations);

    if (onChange) onChange();
  };

  const toggleSecretVisibility = useCallback((key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const testConnection = async (integrationType: string) => {
    toast({
      title: 'Test de connexion',
      description: `Test de connexion à ${integrationType} en cours...`,
    });
    // TODO: Implémenter les tests de connexion
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="payments" className="w-full">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border mb-4">
          <TabsList className="inline-flex w-full justify-start p-1">
            <TabsTrigger value="payments" className="text-xs sm:text-sm shrink-0">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Paiements</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="video" className="text-xs sm:text-sm shrink-0">
              <Video className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Vidéo</span>
              <span className="sm:hidden">Vidéo</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="text-xs sm:text-sm shrink-0">
              <Truck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Livraison</span>
              <span className="sm:hidden">Ship</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm shrink-0">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Paiements */}
        <TabsContent value="payments" className="space-y-4">
          {/* Moneroo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Moneroo
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Passerelle de paiement Moneroo
                  </CardDescription>
                </div>
                <Switch
                  checked={integrations.moneroo.enabled}
                  onCheckedChange={checked =>
                    handleIntegrationChange('moneroo', 'enabled', checked)
                  }
                />
              </div>
            </CardHeader>
            {integrations.moneroo.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Clé API</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets.moneroo_apiKey ? 'text' : 'password'}
                      value={integrations.moneroo.apiKey}
                      onChange={e => handleIntegrationChange('moneroo', 'apiKey', e.target.value)}
                      placeholder="sk_live_..."
                      className="flex-1 min-w-0"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('moneroo_apiKey')}
                      className="shrink-0"
                      aria-label={
                        showSecrets.moneroo_apiKey
                          ? 'Masquer la clé API Moneroo'
                          : 'Afficher la clé API Moneroo'
                      }
                    >
                      {showSecrets.moneroo_apiKey ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={integrations.moneroo.mode === 'sandbox' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleIntegrationChange('moneroo', 'mode', 'sandbox')}
                    >
                      Sandbox
                    </Button>
                    <Button
                      variant={integrations.moneroo.mode === 'production' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleIntegrationChange('moneroo', 'mode', 'production')}
                    >
                      Production
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    ⚠️ Configuré dans Supabase Edge Functions Secrets
                  </Badge>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Video Conferencing */}
        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Zoom
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Video conferencing pour services en ligne
                  </CardDescription>
                </div>
                <Switch
                  checked={integrations.zoom.enabled}
                  onCheckedChange={checked => handleIntegrationChange('zoom', 'enabled', checked)}
                />
              </div>
            </CardHeader>
            {integrations.zoom.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets.zoom_apiKey ? 'text' : 'password'}
                      value={integrations.zoom.apiKey}
                      onChange={e => handleIntegrationChange('zoom', 'apiKey', e.target.value)}
                      placeholder="Votre clé API Zoom"
                      className="flex-1 min-w-0"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('zoom_apiKey')}
                      className="shrink-0"
                      aria-label={
                        showSecrets.zoom_apiKey
                          ? 'Masquer la clé API Zoom'
                          : 'Afficher la clé API Zoom'
                      }
                    >
                      {showSecrets.zoom_apiKey ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets.zoom_apiSecret ? 'text' : 'password'}
                      value={integrations.zoom.apiSecret}
                      onChange={e => handleIntegrationChange('zoom', 'apiSecret', e.target.value)}
                      placeholder="Votre secret API Zoom"
                      className="flex-1 min-w-0"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('zoom_apiSecret')}
                      className="shrink-0"
                      aria-label={
                        showSecrets.zoom_apiSecret
                          ? 'Masquer le secret API Zoom'
                          : 'Afficher le secret API Zoom'
                      }
                    >
                      {showSecrets.zoom_apiSecret ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Account ID</Label>
                  <Input
                    value={integrations.zoom.accountId}
                    onChange={e => handleIntegrationChange('zoom', 'accountId', e.target.value)}
                    placeholder="Votre Account ID Zoom"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => testConnection('Zoom')}>
                  Tester la connexion
                </Button>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Shipping */}
        <TabsContent value="shipping" className="space-y-4">
          {/* FedEx */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    FedEx
                  </CardTitle>
                  <CardDescription className="text-xs">Service d'expédition FedEx</CardDescription>
                </div>
                <Switch
                  checked={integrations.fedex.enabled}
                  onCheckedChange={checked => handleIntegrationChange('fedex', 'enabled', checked)}
                />
              </div>
            </CardHeader>
            {integrations.fedex.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type={showSecrets.fedex_apiKey ? 'text' : 'password'}
                    value={integrations.fedex.apiKey}
                    onChange={e => handleIntegrationChange('fedex', 'apiKey', e.target.value)}
                    placeholder="Votre clé API FedEx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input
                    type={showSecrets.fedex_apiSecret ? 'text' : 'password'}
                    value={integrations.fedex.apiSecret}
                    onChange={e => handleIntegrationChange('fedex', 'apiSecret', e.target.value)}
                    placeholder="Votre secret API FedEx"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={integrations.fedex.accountNumber}
                    onChange={e =>
                      handleIntegrationChange('fedex', 'accountNumber', e.target.value)
                    }
                    placeholder="Votre numéro de compte FedEx"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* DHL */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    DHL
                  </CardTitle>
                  <CardDescription className="text-xs">Service d'expédition DHL</CardDescription>
                </div>
                <Switch
                  checked={integrations.dhl.enabled}
                  onCheckedChange={checked => handleIntegrationChange('dhl', 'enabled', checked)}
                />
              </div>
            </CardHeader>
            {integrations.dhl.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Site ID</Label>
                  <Input
                    value={integrations.dhl.siteId}
                    onChange={e => handleIntegrationChange('dhl', 'siteId', e.target.value)}
                    placeholder="Votre Site ID DHL"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type={showSecrets.dhl_password ? 'text' : 'password'}
                    value={integrations.dhl.password}
                    onChange={e => handleIntegrationChange('dhl', 'password', e.target.value)}
                    placeholder="Votre mot de passe DHL"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* UPS */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    UPS
                  </CardTitle>
                  <CardDescription className="text-xs">Service d'expédition UPS</CardDescription>
                </div>
                <Switch
                  checked={integrations.ups.enabled}
                  onCheckedChange={checked => handleIntegrationChange('ups', 'enabled', checked)}
                />
              </div>
            </CardHeader>
            {integrations.ups.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Access Key</Label>
                  <Input
                    type={showSecrets.ups_accessKey ? 'text' : 'password'}
                    value={integrations.ups.accessKey}
                    onChange={e => handleIntegrationChange('ups', 'accessKey', e.target.value)}
                    placeholder="Votre Access Key UPS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={integrations.ups.username}
                    onChange={e => handleIntegrationChange('ups', 'username', e.target.value)}
                    placeholder="Votre nom d'utilisateur UPS"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type={showSecrets.ups_password ? 'text' : 'password'}
                    value={integrations.ups.password}
                    onChange={e => handleIntegrationChange('ups', 'password', e.target.value)}
                    placeholder="Votre mot de passe UPS"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {/* Google Analytics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Google Analytics
                  </CardTitle>
                  <CardDescription className="text-xs">Suivi et analyse du trafic</CardDescription>
                </div>
                <Switch
                  checked={integrations.googleAnalytics.enabled}
                  onCheckedChange={checked =>
                    handleIntegrationChange('googleAnalytics', 'enabled', checked)
                  }
                />
              </div>
            </CardHeader>
            {integrations.googleAnalytics.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tracking ID</Label>
                  <Input
                    value={integrations.googleAnalytics.trackingId}
                    onChange={e =>
                      handleIntegrationChange('googleAnalytics', 'trackingId', e.target.value)
                    }
                    placeholder="G-XXXXXXXXXX ou UA-XXXXXXXXX-X"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Facebook Pixel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Facebook Pixel
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Suivi des conversions Facebook
                  </CardDescription>
                </div>
                <Switch
                  checked={integrations.facebookPixel.enabled}
                  onCheckedChange={checked =>
                    handleIntegrationChange('facebookPixel', 'enabled', checked)
                  }
                />
              </div>
            </CardHeader>
            {integrations.facebookPixel.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pixel ID</Label>
                  <Input
                    value={integrations.facebookPixel.pixelId}
                    onChange={e =>
                      handleIntegrationChange('facebookPixel', 'pixelId', e.target.value)
                    }
                    placeholder="Votre Pixel ID Facebook"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* OpenAI */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    OpenAI
                  </CardTitle>
                  <CardDescription className="text-xs">Génération de contenu IA</CardDescription>
                </div>
                <Switch
                  checked={integrations.openai.enabled}
                  onCheckedChange={checked => handleIntegrationChange('openai', 'enabled', checked)}
                />
              </div>
            </CardHeader>
            {integrations.openai.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets.openai_apiKey ? 'text' : 'password'}
                      value={integrations.openai.apiKey}
                      onChange={e => handleIntegrationChange('openai', 'apiKey', e.target.value)}
                      placeholder="sk-..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility('openai_apiKey')}
                      aria-label={
                        showSecrets.openai_apiKey
                          ? 'Masquer la clé API OpenAI'
                          : 'Afficher la clé API OpenAI'
                      }
                    >
                      {showSecrets.openai_apiKey ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={integrations.openai.model}
                    onChange={e => handleIntegrationChange('openai', 'model', e.target.value)}
                    placeholder="gpt-4, gpt-3.5-turbo, etc."
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Autres intégrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Autres intégrations
          </CardTitle>
          <CardDescription>Configuration des autres services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SendGrid */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      SendGrid
                    </CardTitle>
                  </div>
                  <Switch
                    checked={integrations.sendgrid.enabled}
                    onCheckedChange={checked =>
                      handleIntegrationChange('sendgrid', 'enabled', checked)
                    }
                  />
                </div>
              </CardHeader>
              {integrations.sendgrid.enabled && (
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs">API Key</Label>
                    <Input
                      type={showSecrets.sendgrid_apiKey ? 'text' : 'password'}
                      value={integrations.sendgrid.apiKey}
                      onChange={e => handleIntegrationChange('sendgrid', 'apiKey', e.target.value)}
                      placeholder="SG.xxx..."
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Crisp */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Crisp
                    </CardTitle>
                  </div>
                  <Switch
                    checked={integrations.crisp.enabled}
                    onCheckedChange={checked =>
                      handleIntegrationChange('crisp', 'enabled', checked)
                    }
                  />
                </div>
              </CardHeader>
              {integrations.crisp.enabled && (
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs">Website ID</Label>
                    <Input
                      value={integrations.crisp.websiteId}
                      onChange={e => handleIntegrationChange('crisp', 'websiteId', e.target.value)}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Sentry */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Sentry
                    </CardTitle>
                  </div>
                  <Switch
                    checked={integrations.sentry.enabled}
                    onCheckedChange={checked =>
                      handleIntegrationChange('sentry', 'enabled', checked)
                    }
                  />
                </div>
              </CardHeader>
              {integrations.sentry.enabled && (
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-xs">DSN</Label>
                    <Input
                      type={showSecrets.sentry_dsn ? 'text' : 'password'}
                      value={integrations.sentry.dsn}
                      onChange={e => handleIntegrationChange('sentry', 'dsn', e.target.value)}
                      placeholder="https://xxx@xxx.ingest.sentry.io/xxx"
                      className="text-xs"
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Avertissement */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <Label className="text-amber-500">Important</Label>
              <p className="text-sm text-muted-foreground">
                Les clés API Moneroo et PayDunya doivent être configurées dans Supabase Edge
                Functions Secrets pour des raisons de sécurité. Les configurations ici sont à titre
                informatif uniquement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};






