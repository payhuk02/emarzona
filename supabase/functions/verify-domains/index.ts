/**
 * Edge Function: Vérification automatique des domaines personnalisés
 *
 * Cette fonction vérifie périodiquement l'état des domaines personnalisés :
 * - Vérifie la propagation DNS
 * - Enregistre automatiquement dans Vercel si vérifié
 * - Met à jour le statut des domaines
 *
 * Déclenchement : Cron job (via CRON_SECRET)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

type SupabaseClient = ReturnType<typeof createClient>;

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface DnsAnswer {
  type?: number;
  data?: string;
}

interface DnsResponse {
  Answer?: DnsAnswer[];
}

interface CustomDomainRow {
  id: string;
  store_id: string;
  domain: string;
  status: string;
  verification_token: string | null;
  ssl_status: string | null;
  error_message: string | null;
  verified_at: string | null;
  last_checked_at: string | null;
  stores?: {
    name?: string | null;
  } | null;
}

interface DNSVerificationResult {
  isPropagated: boolean;
  details: {
    aRecord: boolean;
    wwwRecord: boolean;
    cnameRecord: boolean;
    wwwCnameRecord: boolean;
    txtRecord: boolean;
  };
  errors: string[];
  propagationTime: number;
}

function normalizeDnsValue(value: string | undefined): string {
  return (value || '').replace(/"/g, '').replace(/\.$/, '').toLowerCase().trim();
}

function hasAnyDnsAnswer(data: DnsResponse): boolean {
  return Array.isArray(data.Answer) && data.Answer.length > 0;
}

function resolveAllowedDnsTargets(envKey: string): string[] {
  return (Deno.env.get(envKey) || '')
    .split(',')
    .map(v => normalizeDnsValue(v))
    .filter(Boolean);
}

const allowedATargets = resolveAllowedDnsTargets('CUSTOM_DOMAIN_A_TARGETS');
const allowedCnameTargets = resolveAllowedDnsTargets('CUSTOM_DOMAIN_CNAME_TARGETS');

function matchesConfiguredTargets(value: string, expected: string[]): boolean {
  if (expected.length === 0) return true;
  return expected.includes(normalizeDnsValue(value));
}

/**
 * Vérifie la propagation DNS d'un domaine via Google DNS API
 */
async function checkDNSPropagation(
  domain: string,
  verificationToken: string
): Promise<DNSVerificationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const details = {
    aRecord: false,
    wwwRecord: false,
    cnameRecord: false,
    wwwCnameRecord: false,
    txtRecord: false,
  };

  try {
    // 1. Vérifier enregistrement A principal
    try {
      const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const aData = (await aResponse.json()) as DnsResponse;
      if (hasAnyDnsAnswer(aData)) {
        details.aRecord = (aData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedATargets)
        );
      }
    } catch (e) {
      console.error('A check error', e);
    }

    // 2. Vérifier enregistrement A www
    try {
      const wwwResponse = await fetch(`https://dns.google/resolve?name=www.${domain}&type=A`);
      const wwwData = (await wwwResponse.json()) as DnsResponse;
      if (hasAnyDnsAnswer(wwwData)) {
        details.wwwRecord = (wwwData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedATargets)
        );
      }
    } catch (e) {
      console.error('WWW A check error', e);
    }

    // 3. Vérifier CNAME principal
    try {
      const cnameResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      const cnameData = (await cnameResponse.json()) as DnsResponse;
      if (hasAnyDnsAnswer(cnameData)) {
        details.cnameRecord = (cnameData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedCnameTargets)
        );
      }
    } catch (e) {
      console.error('CNAME check error', e);
    }

    // 4. Vérifier CNAME www
    try {
      const wwwCnameResponse = await fetch(
        `https://dns.google/resolve?name=www.${domain}&type=CNAME`
      );
      const wwwCnameData = (await wwwCnameResponse.json()) as DnsResponse;
      if (hasAnyDnsAnswer(wwwCnameData)) {
        details.wwwCnameRecord = (wwwCnameData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedCnameTargets)
        );
      }
    } catch (e) {
      console.error('WWW CNAME check error', e);
    }

    // 5. Vérifier enregistrement TXT (_emarzona.domain)
    try {
      const txtResponse = await fetch(
        `https://dns.google/resolve?name=_emarzona.${domain}&type=TXT`
      );
      const txtData = (await txtResponse.json()) as DnsResponse;
      if (hasAnyDnsAnswer(txtData)) {
        details.txtRecord = (txtData.Answer || []).some(answer =>
          normalizeDnsValue(answer.data).includes(normalizeDnsValue(verificationToken))
        );
      }
    } catch (e) {
      console.error('TXT check error', e);
    }

    const hasReachableDns =
      details.aRecord || details.wwwRecord || details.cnameRecord || details.wwwCnameRecord;

    if (!details.txtRecord) errors.push('Enregistrement TXT (_emarzona) manquant ou incorrect');
    if (!hasReachableDns) errors.push('Aucun enregistrement A ou CNAME valide détecté');

    const isPropagated = details.txtRecord && hasReachableDns;

    return {
      isPropagated,
      details,
      errors,
      propagationTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error('General DNS error', error);
    return {
      isPropagated: false,
      details: {
        aRecord: false,
        wwwRecord: false,
        cnameRecord: false,
        wwwCnameRecord: false,
        txtRecord: false,
      },
      errors: ['Erreur générale de vérification DNS'],
      propagationTime: 0,
    };
  }
}

/**
 * Vérifie et met à jour l'état d'un domaine
 */
async function verifyAndUpdateDomain(
  supabase: SupabaseClient,
  domainRow: CustomDomainRow
): Promise<{ success: boolean; message: string }> {
  if (!domainRow.domain || !domainRow.verification_token) {
    return { success: false, message: 'Données manquantes' };
  }

  const result = await checkDNSPropagation(domainRow.domain, domainRow.verification_token);
  const nowIso = new Date().toISOString();

  if (result.isPropagated) {
    // 1. Mise à jour custom_domains
    const { error: updateError } = await supabase
      .from('custom_domains')
      .update({
        status: 'active',
        verified_at: domainRow.verified_at || nowIso,
        last_checked_at: nowIso,
        error_message: null,
        ssl_status: domainRow.ssl_status === 'active' ? 'active' : 'provisioning',
      })
      .eq('id', domainRow.id);

    if (updateError) return { success: false, message: updateError.message };

    // 2. Inscription Vercel
    const vercelToken = Deno.env.get('VERCEL_API_TOKEN');
    const vercelProjectId = Deno.env.get('VERCEL_PROJECT_ID');

    if (vercelToken && vercelProjectId) {
      try {
        const vercelRes = await fetch(
          `https://api.vercel.com/v10/projects/${vercelProjectId}/domains`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: domainRow.domain }),
          }
        );

        if (!vercelRes.ok) {
          const vErr = await vercelRes.json();
          if (vErr.error?.code !== 'domain_already_in_use') {
            await supabase
              .from('custom_domains')
              .update({ error_message: `Vercel: ${vErr.error?.message || 'Error'}` })
              .eq('id', domainRow.id);
          }
        }
      } catch (err) {
        console.error('Vercel API fail', err);
      }
    }

    // 3. Sync stores (Legacy)
    await supabase
      .from('stores')
      .update({
        custom_domain: domainRow.domain,
        domain_status: 'verified',
        domain_verified_at: nowIso,
        ssl_enabled: true,
      })
      .eq('id', domainRow.store_id);

    return { success: true, message: 'Domaine vérifié et activé' };
  } else {
    // Échec de propagation
    await supabase
      .from('custom_domains')
      .update({
        last_checked_at: nowIso,
        error_message: result.errors.join(', '),
      })
      .eq('id', domainRow.id);

    return { success: false, message: result.errors.join(', ') };
  }
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérification Secret
    const secret = Deno.env.get('CRON_SECRET');
    const provided = req.headers.get('x-cron-secret');
    if (!secret || provided !== secret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: domains, error: fetchError } = await supabase
      .from('custom_domains')
      .select('*, stores(name)')
      .in('status', ['pending', 'verified', 'active']);

    if (fetchError) throw fetchError;

    if (!domains || domains.length === 0) {
      return new Response(JSON.stringify({ message: 'No domains to check' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.allSettled(
      (domains as CustomDomainRow[]).map(d => verifyAndUpdateDomain(supabase, d))
    );

    const stats = {
      total: domains.length,
      success: results.filter(
        r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.success
      ).length,
      failed: results.filter(
        r =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && !(r as PromiseFulfilledResult<any>).value.success)
      ).length,
    };

    return new Response(JSON.stringify({ message: 'Check complete', stats }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
