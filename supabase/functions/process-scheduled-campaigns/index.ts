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
import { sendCampaignAllBatches } from '../_shared/campaign-send-orchestrator.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-cron-secret',
  };
}

interface ProcessScheduledCampaignsRequest {
  limit?: number; // Nombre maximum de campagnes à traiter (défaut: 10)
}

/**
 * Récupère les campagnes programmées qui doivent être envoyées
 */
async function getScheduledCampaignsToSend(supabase: any, limit: number = 10): Promise<any[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('email_campaigns')
    .select('id,name')
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
  supabase: ReturnType<typeof createClient>,
  campaignId: string
): Promise<{ success: boolean; error?: string; total_sent?: number; batches_processed?: number }> {
  try {
    console.log('Sending campaign (all batches):', campaignId);
    const result = await sendCampaignAllBatches(supabase, campaignId);

    if (!result.success) {
      await supabase
        .from('email_campaigns')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', campaignId);
      return { success: false, error: result.error, total_sent: result.total_sent };
    }

    return {
      success: true,
      total_sent: result.total_sent,
      batches_processed: result.batches_processed,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error sending campaign:', message);
    return { success: false, error: message };
  }
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Vérifier l'authentification
    // Option 1: Header Authorization avec service role key ou anon key (pour appels externes)
    // Option 2: Header x-cron-secret (pour appels depuis cron job interne)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('CRON_SECRET');

    // Fail-closed: secret obligatoire, aucun fallback permissif.
    if (!expectedCronSecret) {
      console.error('CRON_SECRET is not configured');
      return new Response(
        JSON.stringify({
          error: 'Server misconfiguration',
          message: 'CRON_SECRET is not configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isAuthenticated = !!cronSecret && cronSecret.trim() === expectedCronSecret.trim();
    if (!isAuthenticated) {
      console.warn('Unauthorized request:', {
        hasCronSecret: !!cronSecret,
        cronSecretMatch: cronSecret === expectedCronSecret,
      });
      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Missing or invalid authentication',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not set. Campaigns will not be sent.');
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Traiter chaque campagne
    const results: Array<{
      campaign_id: string;
      campaign_name: string;
      success: boolean;
      error?: string;
    }> = [];
    for (const campaign of campaigns) {
      console.log(`Processing scheduled campaign: ${campaign.id} - ${campaign.name}`);

      const result = await sendCampaign(supabase, campaign.id);
      results.push({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        success: result.success,
        error: result.error,
      });

      // Petite pause entre les envois pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
