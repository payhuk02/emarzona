/**
 * Epic 4.3 — Store SSO Enterprise (OIDC authorize + callback + JIT session)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  createSupabaseAdmin,
  createSupabaseUserClient,
  assertStoreOwner,
} from '../_shared/supabase-admin.ts';

interface AuthorizeBody {
  action: 'authorize';
  storeSlug: string;
  returnUrl?: string;
}

interface UpsertBody {
  action: 'upsert';
  storeId: string;
  config: Record<string, unknown>;
}

function getSiteUrl(): string {
  return (Deno.env.get('SITE_URL') || 'https://www.emarzona.com').replace(/\/$/, '');
}

function getCallbackUrl(): string {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/store-sso-auth`;
}

function buildOidcAuthorizeUrl(
  issuer: string,
  clientId: string,
  redirectUri: string,
  state: string,
  nonce: string,
  scopes: string
): string {
  const base = issuer.replace(/\/$/, '');
  const wellKnown = base.includes('/oauth2/') ? base : `${base}/oauth2/v2.0`;
  const authEndpoint = `${wellKnown.replace(/\/v2\.0$/, '')}/oauth2/v2.0/authorize`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    state,
    nonce,
  });
  return `${authEndpoint}?${params.toString()}`;
}

async function discoverOidcEndpoints(issuer: string): Promise<{ token: string; userinfo: string }> {
  const base = issuer.replace(/\/$/, '');
  const configUrl = base.includes('.well-known')
    ? base
    : `${base}/.well-known/openid-configuration`;
  try {
    const res = await fetch(configUrl);
    if (res.ok) {
      const doc = await res.json();
      return {
        token: (doc.token_endpoint as string) || `${base}/oauth2/v2.0/token`,
        userinfo: (doc.userinfo_endpoint as string) || `${base}/oauth2/v2.0/userinfo`,
      };
    }
  } catch {
    // fallback
  }
  return {
    token: `${base}/oauth2/v2.0/token`,
    userinfo: `${base}/oauth2/v2.0/userinfo`,
  };
}

async function exchangeOidcCode(
  issuer: string,
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<{ access_token: string }> {
  const { token: tokenEndpoint } = await discoverOidcEndpoints(issuer);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OIDC token exchange failed: ${err}`);
  }
  return res.json();
}

async function fetchOidcUserInfo(
  issuer: string,
  accessToken: string
): Promise<{ email?: string; groups?: string[]; sub?: string }> {
  const { userinfo: userinfoUrl } = await discoverOidcEndpoints(issuer);
  const res = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('OIDC userinfo failed');
  }
  const data = await res.json();
  const groups = Array.isArray(data.groups)
    ? data.groups
    : Array.isArray(data.roles)
      ? data.roles
      : [];
  return {
    email: data.email || data.preferred_username || data.upn,
    groups,
    sub: data.sub,
  };
}

function emailDomainAllowed(email: string, domains: string[]): boolean {
  if (!domains?.length) return true;
  const domain = email.split('@')[1]?.toLowerCase();
  return domains.some(d => d.toLowerCase() === domain);
}

serve(async req => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }

  const supabaseAdmin = createSupabaseAdmin();

  try {
    // OIDC callback (GET)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const oauthError = url.searchParams.get('error');

      if (oauthError) {
        return Response.redirect(`${getSiteUrl()}/login?sso_error=${oauthError}`, 302);
      }
      if (!code || !state) {
        return new Response('Missing code or state', { status: 400 });
      }

      const { data: ssoState, error: stateError } = await supabaseAdmin
        .from('store_sso_states')
        .select('*, store_sso_providers(*)')
        .eq('state_token', state)
        .is('consumed_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (stateError || !ssoState) {
        return Response.redirect(`${getSiteUrl()}/login?sso_error=invalid_state`, 302);
      }

      const provider = ssoState.store_sso_providers as Record<string, unknown>;
      if (!provider || provider.provider_type !== 'oidc') {
        return Response.redirect(`${getSiteUrl()}/login?sso_error=invalid_provider`, 302);
      }

      const tokens = await exchangeOidcCode(
        String(provider.oidc_issuer_url),
        String(provider.oidc_client_id),
        String(provider.oidc_client_secret),
        code,
        getCallbackUrl()
      );

      const userinfo = await fetchOidcUserInfo(
        String(provider.oidc_issuer_url),
        tokens.access_token
      );
      const email = userinfo.email?.toLowerCase().trim();
      if (!email) {
        throw new Error('Email not returned by IdP');
      }

      const allowedDomains = (provider.allowed_email_domains as string[]) || [];
      if (!emailDomainAllowed(email, allowedDomains)) {
        await supabaseAdmin.from('store_sso_login_events').insert({
          store_id: ssoState.store_id,
          provider_id: ssoState.provider_id,
          email,
          status: 'denied',
          error_message: 'Email domain not allowed',
        });
        return Response.redirect(`${getSiteUrl()}/login?sso_error=domain_not_allowed`, 302);
      }

      // Find or create user (via profiles.email)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      let userId = profile?.id as string | undefined;

      if (!userId) {
        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { sso_provisioned: true, idp_sub: userinfo.sub },
        });
        if (createError || !created.user) {
          throw new Error(createError?.message || 'User creation failed');
        }
        userId = created.user.id;
      }

      await supabaseAdmin.rpc('provision_store_sso_member', {
        p_store_id: ssoState.store_id,
        p_user_id: userId,
        p_email: email,
        p_idp_groups: userinfo.groups ?? [],
        p_default_role: provider.default_role,
        p_role_mappings: provider.role_mappings ?? {},
      });

      await supabaseAdmin.from('store_sso_login_events').insert({
        store_id: ssoState.store_id,
        provider_id: ssoState.provider_id,
        user_id: userId,
        email,
        idp_groups: userinfo.groups ?? [],
        assigned_role: provider.default_role,
        status: 'success',
      });

      await supabaseAdmin
        .from('store_sso_states')
        .update({ consumed_at: new Date().toISOString() })
        .eq('state_token', state);

      const redirectTo = ssoState.redirect_url || `${getSiteUrl()}/dashboard`;
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo },
      });

      if (linkError || !linkData?.properties?.action_link) {
        return Response.redirect(
          `${getSiteUrl()}/login?sso=success&email=${encodeURIComponent(email)}`,
          302
        );
      }

      return Response.redirect(linkData.properties.action_link, 302);
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin);
    }

    const authHeader = req.headers.get('Authorization');
    const body = await req.json();

    if (body.action === 'authorize') {
      const { storeSlug, returnUrl } = body as AuthorizeBody;
      if (!storeSlug) {
        return jsonResponse({ error: 'storeSlug required' }, 400, origin);
      }

      const { data: publicConfig } = await supabaseAdmin.rpc('get_store_sso_public_config', {
        p_store_slug: storeSlug,
      });

      if (!publicConfig?.enabled) {
        return jsonResponse({ error: 'SSO not enabled for this store' }, 404, origin);
      }

      const { data: provider } = await supabaseAdmin
        .from('store_sso_providers')
        .select('*')
        .eq('store_id', publicConfig.store_id)
        .eq('enabled', true)
        .maybeSingle();

      if (!provider) {
        return jsonResponse({ error: 'SSO provider not configured' }, 404, origin);
      }

      if (provider.provider_type === 'saml') {
        return jsonResponse(
          {
            error:
              'SAML callback en cours de déploiement — utilisez OIDC (Azure AD / Okta) pour l’instant.',
            code: 'SAML_PHASE2',
          },
          501,
          origin
        );
      }

      const stateToken = crypto.randomUUID();
      const nonce = crypto.randomUUID();

      await supabaseAdmin.from('store_sso_states').insert({
        state_token: stateToken,
        store_id: provider.store_id,
        provider_id: provider.id,
        redirect_url: returnUrl || `${getSiteUrl()}/dashboard`,
        nonce,
      });

      const authUrl = buildOidcAuthorizeUrl(
        provider.oidc_issuer_url!,
        provider.oidc_client_id!,
        getCallbackUrl(),
        stateToken,
        nonce,
        provider.oidc_scopes || 'openid email profile'
      );

      return jsonResponse({ authUrl, state: stateToken }, 200, origin);
    }

    if (body.action === 'upsert') {
      const { storeId, config } = body as UpsertBody;
      const supabaseUser = createSupabaseUserClient(authHeader);
      await assertStoreOwner(supabaseUser, storeId);

      const { data: hasFeature } = await supabaseAdmin.rpc('store_has_physical_feature', {
        p_store_id: storeId,
        p_feature_key: 'team.sso',
      });

      if (!hasFeature) {
        return jsonResponse({ error: 'Enterprise plan required (physical_premium)' }, 403, origin);
      }

      const payload: Record<string, unknown> = {
        store_id: storeId,
        provider_type: config.provider_type || 'oidc',
        enabled: config.enabled ?? false,
        idp_display_name: config.idp_display_name || 'Enterprise SSO',
        allowed_email_domains: config.allowed_email_domains || [],
        default_role: config.default_role || 'staff',
        role_mappings: config.role_mappings || {},
        jit_provisioning: config.jit_provisioning ?? true,
        enforce_sso: config.enforce_sso ?? false,
        oidc_issuer_url: config.oidc_issuer_url || null,
        oidc_client_id: config.oidc_client_id || null,
        oidc_scopes: config.oidc_scopes || 'openid email profile',
        saml_idp_entity_id: config.saml_idp_entity_id || null,
        saml_sso_url: config.saml_sso_url || null,
        updated_at: new Date().toISOString(),
      };

      if (config.oidc_client_secret) {
        payload.oidc_client_secret = config.oidc_client_secret;
      }
      if (config.saml_certificate) {
        payload.saml_certificate = config.saml_certificate;
      }

      const { data: existing } = await supabaseAdmin
        .from('store_sso_providers')
        .select('oidc_client_secret, saml_certificate')
        .eq('store_id', storeId)
        .maybeSingle();

      if (!payload.oidc_client_secret && existing?.oidc_client_secret) {
        payload.oidc_client_secret = existing.oidc_client_secret;
      }
      if (!payload.saml_certificate && existing?.saml_certificate) {
        payload.saml_certificate = existing.saml_certificate;
      }

      const { data, error } = await supabaseAdmin
        .from('store_sso_providers')
        .upsert(payload, { onConflict: 'store_id' })
        .select(
          'id, store_id, provider_type, enabled, idp_display_name, allowed_email_domains, default_role, role_mappings, jit_provisioning, enforce_sso, oidc_issuer_url, oidc_client_id, oidc_scopes, updated_at'
        )
        .single();

      if (error) {
        return jsonResponse({ error: error.message }, 500, origin);
      }

      return jsonResponse({ provider: data }, 200, origin);
    }

    return jsonResponse({ error: 'Unknown action' }, 400, origin);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500, origin);
  }
});
