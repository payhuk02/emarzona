/**
 * Edge Function: verify-custom-domain
 *
 * Vérifie la propriété d'un domaine personnalisé via DNS TXT record
 * Met à jour le statut du domaine dans la base de données
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { domain_id } = await req.json();

    if (!domain_id) {
      return new Response(
        JSON.stringify({ error: 'domain_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le domaine
    const { data: domainRecord, error: fetchError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('id', domain_id)
      .single();

    if (fetchError || !domainRecord) {
      return new Response(
        JSON.stringify({ error: 'Domain not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le DNS TXT record
    const domain = domainRecord.domain;
    const expectedToken = domainRecord.verification_token;
    let verified = false;
    let dnsRecordsFound: string[] = [];

    try {
      // Utiliser l'API DNS over HTTPS de Google pour vérifier les TXT records
      const dnsResponse = await fetch(
        `https://dns.google/resolve?name=_emarzona.${domain}&type=TXT`
      );
      const dnsData = await dnsResponse.json();

      if (dnsData.Answer) {
        dnsRecordsFound = dnsData.Answer
          .filter((record: any) => record.type === 16) // TXT records
          .map((record: any) => record.data?.replace(/"/g, '') || '');

        verified = dnsRecordsFound.some(
          (txt: string) => txt.includes(expectedToken)
        );
      }
    } catch (dnsError) {
      console.error('DNS lookup error:', dnsError);
    }

    // Mettre à jour le statut
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      last_checked_at: now,
      status: verified ? 'verified' : 'pending',
    };

    if (verified) {
      updateData.verified_at = now;
      updateData.error_message = null;
      // Activer le domaine si vérifié
      updateData.status = 'active';
      updateData.ssl_status = 'provisioning';

      // Aussi mettre à jour le champ custom_domain dans la table stores
      await supabase
        .from('stores')
        .update({
          custom_domain: domain,
          domain_status: 'verified',
          domain_verification_token: expectedToken,
          domain_verified_at: now,
        })
        .eq('id', domainRecord.store_id);
    } else {
      updateData.error_message = `Enregistrement TXT "_emarzona.${domain}" non trouvé. Records trouvés: ${dnsRecordsFound.length > 0 ? dnsRecordsFound.join(', ') : 'aucun'}`;
    }

    const { error: updateError } = await supabase
      .from('custom_domains')
      .update(updateData)
      .eq('id', domain_id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    return new Response(
      JSON.stringify({
        verified,
        domain,
        status: verified ? 'active' : 'pending',
        message: verified
          ? 'Domaine vérifié et activé avec succès !'
          : `L'enregistrement TXT "_emarzona.${domain}" n'a pas été trouvé. Assurez-vous d'avoir ajouté l'enregistrement DNS et attendez la propagation (jusqu'à 48h).`,
        dns_records_found: dnsRecordsFound,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
