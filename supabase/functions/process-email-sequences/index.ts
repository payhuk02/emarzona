/**
 * Supabase Edge Function: Process Email Sequences
 * Traite et envoie les emails des séquences automatiques
 * Date: 1er Février 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { canSendEmailToRecipient } from '../_shared/email-compliance-utils.ts';
import { sendMarketingEmailViaResend } from '../_shared/resend-send-utils.ts';

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

/** Fail-closed: requires x-cron-secret matching CRON_SECRET (pg_cron / internal jobs). */
function assertCronAuthorized(req: Request, corsHeaders: Record<string, string>): Response | null {
  const expectedCronSecret = Deno.env.get('CRON_SECRET');
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

  const cronSecret = req.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret.trim() !== expectedCronSecret.trim()) {
    console.warn('Unauthorized process-email-sequences request');
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

  return null;
}

interface ProcessSequencesRequest {
  limit?: number; // Nombre d'emails à traiter (défaut: 100)
}

interface SequenceEmail {
  enrollment_id: string;
  sequence_id: string;
  user_id: string | null;
  step_id: string;
  template_id: string | null;
  recipient_email: string;
  context: Record<string, any>;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: Record<string, string>;
  html_content: Record<string, string>;
  from_email: string;
  from_name: string;
}

/**
 * Récupère le template email
 */
async function getTemplate(supabase: any, templateId: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('id,name,subject,html_content,from_email,from_name')
    .eq('id', templateId)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    console.error('Error fetching template:', error);
    return null;
  }

  return data;
}

/**
 * Récupère les informations de la séquence
 */
async function getSequenceInfo(supabase: any, sequenceId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('email_sequences')
    .select('id, name, store_id')
    .eq('id', sequenceId)
    .single();

  if (error || !data) {
    console.error('Error fetching sequence:', error);
    return null;
  }

  return data;
}

/**
 * Fait avancer l'enrollment après l'envoi de l'email
 */
async function advanceEnrollment(supabase: any, enrollmentId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('advance_sequence_enrollment', {
      p_enrollment_id: enrollmentId,
    });

    if (error) {
      console.error('Error advancing enrollment:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in advanceEnrollment:', error);
    return false;
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
    const authError = assertCronAuthorized(req, corsHeaders);
    if (authError) return authError;

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parser la requête
    const { limit = 100 }: ProcessSequencesRequest = await req.json().catch(() => ({}));

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les prochains emails à envoyer
    const { data: emailsToSend, error: fetchError } = await supabase.rpc(
      'get_next_sequence_emails_to_send',
      { p_limit: limit }
    );

    if (fetchError) {
      console.error('Error fetching emails to send:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch emails to send', details: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!emailsToSend || emailsToSend.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No emails to send at this time',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Traiter chaque email
    let sentCount = 0;
    let errorCount = 0;
    const errors: Array<{ enrollment_id: string; error: string }> = [];

    for (const emailData of emailsToSend as SequenceEmail[]) {
      try {
        // Récupérer le template
        let template: EmailTemplate | null = null;
        if (emailData.template_id) {
          template = await getTemplate(supabase, emailData.template_id);
          if (!template) {
            console.error(`Template not found: ${emailData.template_id}`);
            errorCount++;
            errors.push({
              enrollment_id: emailData.enrollment_id,
              error: 'Template not found',
            });
            continue;
          }
        } else {
          // Template par défaut
          const sequenceInfo = await getSequenceInfo(supabase, emailData.sequence_id);
          template = {
            id: 'default',
            name: sequenceInfo?.name || 'Séquence Email',
            subject: { fr: sequenceInfo?.name || 'Email de séquence' },
            html_content: { fr: '<p>Bonjour,</p><p>Voici votre email de séquence.</p>' },
            from_email: 'noreply@mail.emarzona.com',
            from_name: 'Emarzona',
          };
        }

        const eligibility = await canSendEmailToRecipient(
          supabase,
          emailData.recipient_email,
          'marketing',
          emailData.user_id ?? undefined
        );

        if (!eligibility.allowed) {
          console.log(
            `Skipping sequence email to ${emailData.recipient_email}: ${eligibility.reason}`
          );
          await advanceEnrollment(supabase, emailData.enrollment_id);
          continue;
        }

        const sequenceInfo = await getSequenceInfo(supabase, emailData.sequence_id);

        const result = await sendMarketingEmailViaResend({
          supabase,
          to: emailData.recipient_email,
          toName: emailData.context?.user_name as string | undefined,
          template,
          variables: {
            sequence_name: template.name,
            ...(emailData.context || {}),
          },
          userId: emailData.user_id ?? undefined,
          storeId: sequenceInfo?.store_id,
          sequenceId: emailData.sequence_id,
          templateSlug: template.name,
        });

        if (result.success) {
          sentCount++;
          await advanceEnrollment(supabase, emailData.enrollment_id);
        } else {
          errorCount++;
          errors.push({
            enrollment_id: emailData.enrollment_id,
            error: result.error || 'Unknown error',
          });
        }

        // Petit délai pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`Error processing email for enrollment ${emailData.enrollment_id}:`, error);
        errorCount++;
        errors.push({
          enrollment_id: emailData.enrollment_id,
          error: error.message || 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: emailsToSend.length,
        sent: sentCount,
        errors: errorCount,
        error_details: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in process-email-sequences function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
