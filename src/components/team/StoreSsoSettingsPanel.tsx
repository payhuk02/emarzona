/**
 * Epic 4.3 — Panneau configuration SSO Enterprise (propriétaire boutique)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield, ExternalLink, Loader2 } from 'lucide-react';
import { useStoreSsoProvider, useUpsertStoreSsoConfig } from '@/hooks/sso/useStoreSso';
import { buildStoreSsoLoginPath } from '@/lib/sso/store-sso';
import { useStorePhysicalAccess } from '@/hooks/billing/useStorePhysicalAccess';
import {
  hasPhysicalFeatureAccess,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';

interface Props {
  storeId: string;
  storeSlug: string;
}

export function StoreSsoSettingsPanel({ storeId, storeSlug }: Props) {
  const { data: provider, isLoading } = useStoreSsoProvider(storeId);
  const { planSlug } = useStorePhysicalAccess(storeId);
  const upsert = useUpsertStoreSsoConfig();

  const ssoAllowed = hasPhysicalFeatureAccess(planSlug as PhysicalPlanSlug, 'team.sso');

  const [form, setForm] = useState({
    provider_type: 'oidc' as 'oidc' | 'saml',
    enabled: false,
    idp_display_name: 'Microsoft Entra ID',
    allowed_email_domains: '',
    default_role: 'staff' as 'manager' | 'staff' | 'support' | 'viewer',
    role_mappings: '{}',
    jit_provisioning: true,
    enforce_sso: false,
    oidc_issuer_url: '',
    oidc_client_id: '',
    oidc_client_secret: '',
    oidc_scopes: 'openid email profile',
    saml_idp_entity_id: '',
    saml_sso_url: '',
    saml_certificate: '',
  });

  useEffect(() => {
    if (!provider) return;
    setForm({
      provider_type: provider.provider_type,
      enabled: provider.enabled,
      idp_display_name: provider.idp_display_name,
      allowed_email_domains: (provider.allowed_email_domains || []).join(', '),
      default_role: provider.default_role,
      role_mappings: JSON.stringify(provider.role_mappings || {}, null, 2),
      jit_provisioning: provider.jit_provisioning,
      enforce_sso: provider.enforce_sso,
      oidc_issuer_url: provider.oidc_issuer_url || '',
      oidc_client_id: provider.oidc_client_id || '',
      oidc_client_secret: '',
      oidc_scopes: provider.oidc_scopes || 'openid email profile',
      saml_idp_entity_id: provider.saml_idp_entity_id || '',
      saml_sso_url: provider.saml_sso_url || '',
      saml_certificate: '',
    });
  }, [provider]);

  if (!ssoAllowed) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            SSO Enterprise
          </CardTitle>
          <CardDescription>
            Disponible sur le plan <strong>Physique Enterprise</strong> (physical_premium).
            Permettez à votre équipe de se connecter via Okta, Azure AD ou Google Workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Upgrade requis</Badge>
        </CardContent>
      </Card>
    );
  }

  const loginPath = buildStoreSsoLoginPath(storeSlug);
  const callbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-sso-auth`;

  const handleSave = () => {
    let roleMappings: Record<string, string> = {};
    try {
      roleMappings = JSON.parse(form.role_mappings || '{}');
    } catch {
      roleMappings = {};
    }

    upsert.mutate({
      storeId,
      config: {
        provider_type: form.provider_type,
        enabled: form.enabled,
        idp_display_name: form.idp_display_name,
        allowed_email_domains: form.allowed_email_domains
          .split(',')
          .map(d => d.trim())
          .filter(Boolean),
        default_role: form.default_role,
        role_mappings: roleMappings,
        jit_provisioning: form.jit_provisioning,
        enforce_sso: form.enforce_sso,
        oidc_issuer_url: form.oidc_issuer_url || undefined,
        oidc_client_id: form.oidc_client_id || undefined,
        oidc_client_secret: form.oidc_client_secret || undefined,
        oidc_scopes: form.oidc_scopes,
        saml_idp_entity_id: form.saml_idp_entity_id || undefined,
        saml_sso_url: form.saml_sso_url || undefined,
        saml_certificate: form.saml_certificate || undefined,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                SSO Enterprise
              </CardTitle>
              <CardDescription className="mt-1">
                Connexion unique pour votre équipe — provisioning automatique des rôles.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="sso-enabled" className="text-sm">
                Actif
              </Label>
              <Switch
                id="sso-enabled"
                checked={form.enabled}
                onCheckedChange={v => setForm(f => ({ ...f, enabled: v }))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
            <p className="font-medium">URLs à configurer chez votre IdP</p>
            <p>
              <span className="text-muted-foreground">Login équipe :</span>{' '}
              <code className="text-xs">{loginPath}</code>
            </p>
            <p>
              <span className="text-muted-foreground">Redirect URI OIDC :</span>{' '}
              <code className="text-xs break-all">{callbackUrl}</code>
            </p>
            <Button variant="link" className="h-auto p-0" asChild>
              <a href={loginPath} target="_blank" rel="noopener noreferrer">
                Tester la page login <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type IdP</Label>
              <Select
                value={form.provider_type}
                onValueChange={(v: 'oidc' | 'saml') => setForm(f => ({ ...f, provider_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oidc">OIDC (Azure AD, Okta, Google)</SelectItem>
                  <SelectItem value="saml">SAML 2.0 (config — phase 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nom affiché</Label>
              <Input
                value={form.idp_display_name}
                onChange={e => setForm(f => ({ ...f, idp_display_name: e.target.value }))}
              />
            </div>
          </div>

          {form.provider_type === 'oidc' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Issuer URL</Label>
                <Input
                  placeholder="https://login.microsoftonline.com/{tenant}/v2.0"
                  value={form.oidc_issuer_url}
                  onChange={e => setForm(f => ({ ...f, oidc_issuer_url: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Client ID</Label>
                <Input
                  value={form.oidc_client_id}
                  onChange={e => setForm(f => ({ ...f, oidc_client_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <Input
                  type="password"
                  placeholder={provider ? '••••••••' : ''}
                  value={form.oidc_client_secret}
                  onChange={e => setForm(f => ({ ...f, oidc_client_secret: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Scopes</Label>
                <Input
                  value={form.oidc_scopes}
                  onChange={e => setForm(f => ({ ...f, oidc_scopes: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Domaines email autorisés (CSV)</Label>
              <Input
                placeholder="acme.com, acme.fr"
                value={form.allowed_email_domains}
                onChange={e => setForm(f => ({ ...f, allowed_email_domains: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle par défaut</Label>
              <Select
                value={form.default_role}
                onValueChange={(v: typeof form.default_role) =>
                  setForm(f => ({ ...f, default_role: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mapping groupes IdP → rôles (JSON)</Label>
            <Textarea
              rows={4}
              className="font-mono text-xs"
              value={form.role_mappings}
              onChange={e => setForm(f => ({ ...f, role_mappings: e.target.value }))}
              placeholder='{"emarzona-managers": "manager", "emarzona-support": "support"}'
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.jit_provisioning}
                onCheckedChange={v => setForm(f => ({ ...f, jit_provisioning: v }))}
              />
              <Label>Provisioning automatique (JIT)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.enforce_sso}
                onCheckedChange={v => setForm(f => ({ ...f, enforce_sso: v }))}
              />
              <Label>Forcer SSO (désactiver mot de passe équipe)</Label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={upsert.isPending} className="w-full sm:w-auto">
            {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer la configuration SSO
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
