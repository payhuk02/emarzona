/**
 * Edge Function: Vérification automatique des domaines personnalisés
 * 
 * Cette fonction vérifie périodiquement l'état des domaines personnalisés :
 * - Vérifie la propagation DNS
 * - Active automatiquement SSL si le domaine est vérifié
 * - Met à jour le statut des domaines
 * 
 * Déclenchement : Cron job (toutes les 15 minutes)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    'Vary': 'Origin',
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
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'error' | 'removed';
  verification_token: string | null;
  ssl_status: 'pending' | 'provisioning' | 'active' | 'error' | 'expired';
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
  if (expected.length === 0) {
    return true; // Pas de contrainte explicite configurée
  }
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
    // Vérifier enregistrement A principal
    try {
      const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const aData = (await aResponse.json()) as DnsResponse;

      if (hasAnyDnsAnswer(aData)) {
        details.aRecord = (aData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedATargets)
        );
        if (!details.aRecord) {
          errors.push('Enregistrement A présent mais ne correspond pas aux cibles attendues');
        }
      } else {
        errors.push("Enregistrement A manquant");
      }
    } catch {
      errors.push("Erreur lors de la vérification de l'enregistrement A");
    }

    // Vérifier enregistrement A www
    try {
      const wwwResponse = await fetch(`https://dns.google/resolve?name=www.${domain}&type=A`);
      const wwwData = (await wwwResponse.json()) as DnsResponse;

      if (hasAnyDnsAnswer(wwwData)) {
        details.wwwRecord = (wwwData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedATargets)
        );
        if (!details.wwwRecord) {
          errors.push('Enregistrement A (www) présent mais ne correspond pas aux cibles attendues');
        }
      } else {
        errors.push("Enregistrement WWW manquant");
      }
    } catch {
      errors.push("Erreur lors de la vérification de l'enregistrement WWW");
    }

    // Vérifier CNAME principal (utile selon le provider DNS)
    try {
      const cnameResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=CNAME`);
      const cnameData = (await cnameResponse.json()) as DnsResponse;
      if (hasAnyDnsAnswer(cnameData)) {
        details.cnameRecord = (cnameData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedCnameTargets)
        );
        if (!details.cnameRecord) {
          errors.push('Enregistrement CNAME présent mais ne correspond pas aux cibles attendues');
        }
      }
    } catch {
      errors.push("Erreur lors de la vérification de l'enregistrement CNAME");
    }

    // Vérifier CNAME www
    try {
      const wwwCnameResponse = await fetch(`https://dns.google/resolve?name=www.${domain}&type=CNAME`);
      const wwwCnameData = (await wwwCnameResponse.json()) as DnsResponse;
      if (hasAnyDnsAnswer(wwwCnameData)) {
        details.wwwCnameRecord = (wwwCnameData.Answer || []).some(answer =>
          matchesConfiguredTargets(answer.data || '', allowedCnameTargets)
        );
        if (!details.wwwCnameRecord) {
          errors.push('Enregistrement CNAME (www) présent mais ne correspond pas aux cibles attendues');
        }
      }
    } catch {
      errors.push("Erreur lors de la vérification de l'enregistrement CNAME www");
    }

    // Vérifier enregistrement TXT de vérification (aligné avec l'UI et verify-custom-domain)
    try {
      const txtResponse = await fetch(`https://dns.google/resolve?name=_emarzona.${domain}&type=TXT`);
      const txtData = (await txtResponse.json()) as DnsResponse;

      if (hasAnyDnsAnswer(txtData)) {
        details.txtRecord = (txtData.Answer || []).some(answer =>
          normalizeDnsValue(answer.data).includes(normalizeDnsValue(verificationToken))
        );
        if (!details.txtRecord) {
          errors.push("Token de vérification TXT incorrect ou manquant");
        }
      } else {
        errors.push("Enregistrement TXT de vérification manquant");
      }
    } catch {
      errors.push("Erreur lors de la vérification de l'enregistrement TXT");
    }

    // Certaines configurations production utilisent CNAME plutôt que A fixe.
    const hasReachableDns =
      details.aRecord || details.wwwRecord || details.cnameRecord || details.wwwCnameRecord;
    const isPropagated = details.txtRecord && hasReachableDns;
    const propagationTime = Date.now() - startTime;
    
    return {
      isPropagated,
      details,
      errors,
      propagationTime,
    };
  } catch (error) {
    console.error('Error checking DNS propagation', error);
    return {
      isPropagated: false,
      details: {
        aRecord: false,
        wwwRecord: false,
        cnameRecord: false,
        wwwCnameRecord: false,
        txtRecord: false,
      },
      errors: ["Erreur générale lors de la vérification DNS"],
      propagationTime: 0,
    };
  }
}

/**
 * Vérifie et met à jour l'état d'un domaine
 */
async function verifyAndUpdateDomain(
  supabase: any,
  domainRow: CustomDomainRow
): Promise<{ success: boolean; message: string }> {
  if (!domainRow.domain || !domainRow.verification_token) {
    return { success: false, message: 'Domaine ou token manquant' };
  }

  // Vérifier la propagation DNS pour tous les états monitorés
  const result = await checkDNSPropagation(domainRow.domain, domainRow.verification_token);
  const nowIso = new Date().toISOString();

  if (result.isPropagated) {
    // Domaine vérifié, mettre à jour la table custom_domains (source de vérité)
    const { error } = await supabase
      .from('custom_domains')
      .update({
        status: 'active',
        verified_at: domainRow.verified_at || nowIso,
        last_checked_at: nowIso,
        error_message: null,
        ssl_status:
          domainRow.ssl_status === 'active' ? 'active' : 'provisioning',
      })
      .eq('id', domainRow.id);

    if (error) {
      console.error('Error updating custom_domains status:', error);
      return { success: false, message: 'Erreur lors de la mise à jour: ' + error.message };
    }

    // Compatibilité legacy: synchroniser les champs stores si présents
    await supabase
      .from('stores')
      .update({
        custom_domain: domainRow.domain,
        domain_status: 'verified',
        domain_verified_at: nowIso,
        domain_error_message: null,
        ssl_enabled: true,
      })
      .eq('id', domainRow.store_id);

    return { 
      success: true, 
      message: `Domaine vérifié avec succès (propagation: ${Math.floor(result.propagationTime / 1000)}s). SSL activé.` 
    };
  } else {
    // Propagation incomplète, mettre à jour les erreurs
    const { error } = await supabase
      .from('custom_domains')
      .update({
        status: 'pending',
        last_checked_at: nowIso,
        error_message: result.errors.join(', '),
        ssl_status: domainRow.ssl_status === 'active' ? 'error' : domainRow.ssl_status,
      })
      .eq('id', domainRow.id);

    if (error) {
      console.error('Error updating custom_domains status:', error);
      return { success: false, message: 'Erreur lors de la mise à jour: ' + error.message };
    }

    // Compatibilité legacy
    await supabase
      .from('stores')
      .update({
        domain_status: 'pending',
        domain_error_message: result.errors.join(', '),
      })
      .eq('id', domainRow.store_id);

    return { 
      success: false, 
      message: 'Propagation DNS incomplète: ' + result.errors.join(', ') 
    };
  }
}

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const expectedCronSecret = Deno.env.get('CRON_SECRET');
    const providedCronSecret = req.headers.get('x-cron-secret');
    if (!expectedCronSecret || !providedCronSecret || providedCronSecret.trim() !== expectedCronSecret.trim()) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Créer le client Supabase avec les credentials du service
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer tous les domaines custom monitorés (source de vérité)
    const { data: domains, error: fetchError } = await supabase
      .from('custom_domains')
      .select('id, store_id, domain, status, verification_token, ssl_status, error_message, verified_at, last_checked_at, stores(name)')
      .in('status', ['pending', 'verified', 'active'])
      .neq('status', 'removed');

    if (fetchError) {
      console.error('Error fetching stores:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des domaines' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!domains || domains.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Aucun domaine à vérifier',
          checked: 0,
          verified: 0,
          failed: 0,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier chaque domaine
    const results = await Promise.allSettled(
      (domains as CustomDomainRow[]).map(domainRow => verifyAndUpdateDomain(supabase, domainRow))
    );

    const verified = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;

    const failed = results.filter(
      r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length;

    console.log(`Vérification terminée: ${verified} vérifiés, ${failed} échoués sur ${domains.length} domaines`);

    return new Response(
      JSON.stringify({
        message: 'Vérification des domaines terminée',
        checked: domains.length,
        verified,
        failed,
        results: results.map((r, i) => ({
          store: (domains as CustomDomainRow[])[i].stores?.name || null,
          domain: (domains as CustomDomainRow[])[i].domain,
          result: r.status === 'fulfilled' ? r.value : { success: false, message: r.reason },
        })),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    console.error('Error in verify-domains function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

