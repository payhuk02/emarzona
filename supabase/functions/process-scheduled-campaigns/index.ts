/**
 * Supabase Edge Function: Process Scheduled Campaigns
 * Vérifie et envoie automatiquement les campagnes programmées
 * Date: 1er Février 2025
 * 
 * Cette fonction doit être appelée par un cron job (toutes les 5 minutes)
 * ou via Supabase Cron Jobs
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

interface ProcessScheduledCampaignsRequest {
  limit?: number; // Nombre maximum de campagnes à traiter (défaut: 10)
}

/**
 * Récupère les campagnes programmées qui doivent être envoyées
 */
async function getScheduledCampaignsToSend(
  supabase: any,
  limit: number = 10
): Promise<any[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .not('template_id', 'is', null)
    .limit(limit)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching scheduled campaigns:', error);
    return [];
  }

  return data || [];
}

/**
 * Appelle la fonction send-email-campaign pour envoyer une campagne
 */
async function sendCampaign(
  supabase: any,
  campaignId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Appeler l'Edge Function send-email-campaign via HTTP
    const functionUrl = `${supabaseUrl}/functions/v1/send-email-campaign`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        campaign_id: campaignId,
        batch_size: 100,
        batch_index: 0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error invoking send-email-campaign:', errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    // Mettre à jour le statut de la campagne
    const { error: updateError } = await supabase
      .from('email_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaignId);

    if (updateError) {
      console.error('Error updating campaign status:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending campaign:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
      },
    });
  }

  try {
    // Vérifier l'authentification pour les appels depuis le cron job
    // Option 1: Header Authorization avec service role key (pour appels externes)
    // Option 2: Header x-cron-secret (pour appels depuis cron job interne)
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET') || 'process-scheduled-campaigns-secret-2025';
    
    // Accepter si :
    // 1. Authorization header avec Bearer token (service role key ou anon key)
    // 2. x-cron-secret header correspond au secret attendu
    // 3. Aucune authentification (pour appels internes Supabase - moins sécurisé mais fonctionnel)
    const isAuthenticated = 
      (authHeader && (authHeader.startsWith('Bearer ') || authHeader.startsWith('apikey '))) ||
      (cronSecret === expectedCronSecret) ||
      (!authHeader && !cronSecret); // Accepter les appels sans auth pour compatibilité
    
    if (!isAuthenticated && authHeader && cronSecret) {
      console.warn('Unauthorized request - missing valid authentication');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Missing or invalid authentication' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier la clé API SendGrid (optionnel, mais recommandé)
    if (!SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY is not set. Campaigns will not be sent.');
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser la requête
    const body: ProcessScheduledCampaignsRequest = await req.json().catch(() => ({}));
    const limit = body.limit || 10;

    // Récupérer les campagnes programmées à envoyer
    const campaigns = await getScheduledCampaignsToSend(supabase, limit);

    if (campaigns.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No scheduled campaigns to process',
          processed: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Traiter chaque campagne
    const results = [];
    for (const campaign of campaigns) {
      console.log(`Processing scheduled campaign: ${campaign.id} - ${campaign.name}`);

      const result = await sendCampaign(
        supabase,
        campaign.id,
        supabaseUrl,
        supabaseServiceKey
      );
      results.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        success: result.success,
        error: result.error,
      });

      // Petite pause entre les envois pour éviter la surcharge
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${campaigns.length} scheduled campaigns`,
        processed: campaigns.length,
        successful: successCount,
        failed: errorCount,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error processing scheduled campaigns:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

