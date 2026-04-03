/**
 * Edge Function: Manage Email Tags Cron Jobs
 * Date: 19 Février 2025
 *
 * Description: Gère les cron jobs pour les tags email via le service role
 * Contourne les restrictions de permissions RPC pour le schéma cron
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CronJobStatus {
  job_name: string;
  schedule: string;
  command: string;
  active: boolean;
  last_run: string | null;
  last_status: string | null;
}

/**
 * Récupère le statut de tous les cron jobs liés aux tags email
 */
async function getCronJobsStatus(supabase: any): Promise<CronJobStatus[]> {
  const { data, error } = await supabase.rpc('get_email_tags_cron_jobs_status');

  if (error) {
    console.error('Error fetching cron jobs status:', error);
    throw error;
  }

  return data || [];
}

/**
 * Active ou désactive un cron job
 */
async function toggleCronJob(supabase: any, jobName: string, active: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_email_tags_cron_job', {
    p_job_name: jobName,
    p_active: active,
  });

  if (error) {
    console.error('Error toggling cron job:', error);
    throw error;
  }

  return data === true;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Créer le client Supabase avec le service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Vérifier que l'utilisateur est authentifié (utiliser le token de l'utilisateur)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parser la requête
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || (await req.json()).action;

    if (action === 'get_status') {
      // Récupérer le statut des cron jobs
      const cronJobs = await getCronJobsStatus(supabaseAdmin);
      return new Response(JSON.stringify({ success: true, data: cronJobs }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else if (action === 'toggle') {
      // Activer/Désactiver un cron job
      const body = await req.json();
      const { job_name, active } = body;

      if (!job_name || typeof active !== 'boolean') {
        return new Response(JSON.stringify({ error: 'Missing job_name or active parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Vérifier que le nom du job est autorisé
      const allowedJobs = [
        'cleanup-expired-email-tags',
        'cleanup-unused-email-tags',
        'update-segment-member-counts',
      ];

      if (!allowedJobs.includes(job_name)) {
        return new Response(JSON.stringify({ error: 'Invalid job name' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await toggleCronJob(supabaseAdmin, job_name, active);
      return new Response(JSON.stringify({ success: true, data: result }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error in manage-email-tags-cron-jobs:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
