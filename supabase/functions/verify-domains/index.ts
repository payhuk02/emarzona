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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DNSVerificationResult {
  isPropagated: boolean;
  details: {
    aRecord: boolean;
    wwwRecord: boolean;
    txtRecord: boolean;
  };
  errors: string[];
  propagationTime: number;
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
    txtRecord: false,
  };

  try {
    // Vérifier enregistrement A principal
    try {
      const aResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const aData = await aResponse.json();
      
      if (aData.Answer && aData.Answer.length > 0) {
        const targetIP = '185.158.133.1';
        details.aRecord = aData.Answer.some((answer: any) => answer.data === targetIP);
        if (!details.aRecord) {
          errors.push(`Enregistrement A incorrect: pointe vers ${aData.Answer[0].data} au lieu de ${targetIP}`);
        }
      } else {
        errors.push("Enregistrement A manquant");
      }
    } catch (e) {
      errors.push("Erreur lors de la vérification de l'enregistrement A");
    }

    // Vérifier enregistrement A www
    try {
      const wwwResponse = await fetch(`https://dns.google/resolve?name=www.${domain}&type=A`);
      const wwwData = await wwwResponse.json();
      
      if (wwwData.Answer && wwwData.Answer.length > 0) {
        const targetIP = '185.158.133.1';
        details.wwwRecord = wwwData.Answer.some((answer: any) => answer.data === targetIP);
        if (!details.wwwRecord) {
          errors.push(`Enregistrement WWW incorrect: pointe vers ${wwwData.Answer[0].data} au lieu de ${targetIP}`);
        }
      } else {
        errors.push("Enregistrement WWW manquant");
      }
    } catch (e) {
      errors.push("Erreur lors de la vérification de l'enregistrement WWW");
    }

    // Vérifier enregistrement TXT de vérification
    try {
      const txtResponse = await fetch(`https://dns.google/resolve?name=_emarzona-verification.${domain}&type=TXT`);
      const txtData = await txtResponse.json();
      
      if (txtData.Answer && txtData.Answer.length > 0) {
        details.txtRecord = txtData.Answer.some((answer: any) => 
          answer.data && answer.data.replace(/"/g, '') === verificationToken
        );
        if (!details.txtRecord) {
          errors.push("Token de vérification TXT incorrect ou manquant");
        }
      } else {
        errors.push("Enregistrement TXT de vérification manquant");
      }
    } catch (e) {
      errors.push("Erreur lors de la vérification de l'enregistrement TXT");
    }

    const isPropagated = details.aRecord && details.wwwRecord && details.txtRecord;
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
  store: any
): Promise<{ success: boolean; message: string }> {
  if (!store.custom_domain || !store.domain_verification_token) {
    return { success: false, message: 'Domaine ou token manquant' };
  }

  // Si le domaine est déjà vérifié, on peut juste vérifier qu'il est toujours actif
  if (store.domain_status === 'verified') {
    const result = await checkDNSPropagation(store.custom_domain, store.domain_verification_token);
    
    if (!result.isPropagated) {
      // Le domaine n'est plus vérifié, mettre à jour le statut
      await supabase
        .from('stores')
        .update({
          domain_status: 'error',
          domain_error_message: result.errors.join(', '),
          ssl_enabled: false,
        })
        .eq('id', store.id);
      
      return { success: false, message: 'Domaine n\'est plus vérifié: ' + result.errors.join(', ') };
    }
    
    return { success: true, message: 'Domaine toujours vérifié' };
  }

  // Vérifier la propagation DNS
  const result = await checkDNSPropagation(store.custom_domain, store.domain_verification_token);

  if (result.isPropagated) {
    // Domaine vérifié, mettre à jour le statut et activer SSL
    const { error } = await supabase
      .from('stores')
      .update({
        domain_status: 'verified',
        domain_verified_at: new Date().toISOString(),
        domain_error_message: null,
        ssl_enabled: true,
      })
      .eq('id', store.id);

    if (error) {
      console.error('Error updating domain status:', error);
      return { success: false, message: 'Erreur lors de la mise à jour: ' + error.message };
    }

    return { 
      success: true, 
      message: `Domaine vérifié avec succès (propagation: ${Math.floor(result.propagationTime / 1000)}s). SSL activé.` 
    };
  } else {
    // Propagation incomplète, mettre à jour les erreurs
    const { error } = await supabase
      .from('stores')
      .update({
        domain_status: 'pending',
        domain_error_message: result.errors.join(', '),
      })
      .eq('id', store.id);

    if (error) {
      console.error('Error updating domain status:', error);
      return { success: false, message: 'Erreur lors de la mise à jour: ' + error.message };
    }

    return { 
      success: false, 
      message: 'Propagation DNS incomplète: ' + result.errors.join(', ') 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer le client Supabase avec les credentials du service
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer tous les domaines en attente ou vérifiés
    const { data: stores, error: fetchError } = await supabase
      .from('stores')
      .select('id, custom_domain, domain_status, domain_verification_token, name')
      .in('domain_status', ['pending', 'verified'])
      .not('custom_domain', 'is', null);

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

    if (!stores || stores.length === 0) {
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
      stores.map(store => verifyAndUpdateDomain(supabase, store))
    );

    const verified = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;

    const failed = results.filter(
      r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    ).length;

    console.log(`Vérification terminée: ${verified} vérifiés, ${failed} échoués sur ${stores.length} domaines`);

    return new Response(
      JSON.stringify({
        message: 'Vérification des domaines terminée',
        checked: stores.length,
        verified,
        failed,
        results: results.map((r, i) => ({
          store: stores[i].name,
          domain: stores[i].custom_domain,
          result: r.status === 'fulfilled' ? r.value : { success: false, message: r.reason },
        })),
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in verify-domains function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

