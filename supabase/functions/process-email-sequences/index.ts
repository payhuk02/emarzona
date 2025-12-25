/**
 * Supabase Edge Function: Process Email Sequences
 * Traite et envoie les emails des séquences automatiques
 * Date: 1er Février 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

interface ProcessSequencesRequest {
  limit?: number; // Nombre d'emails à traiter (défaut: 100)
}

interface SequenceEmail {
  enrollment_id: string;
  sequence_id: string;
  user_id: string;
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
    .select('*')
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
 * Envoie un email via SendGrid
 */
async function sendEmailViaSendGrid(
  recipient: { email: string; name?: string },
  template: EmailTemplate,
  sequenceId: string,
  userId: string,
  context: Record<string, any>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: 'SendGrid API Key not configured' };
  }

  try {
    // Déterminer la langue (par défaut: français)
    const language = 'fr';
    const subject = template.subject[language] || template.subject['fr'] || template.name;
    const htmlContent = template.html_content[language] || template.html_content['fr'] || '';

    // Préparer les variables pour le template
    const variables = {
      user_name: recipient.name || 'Client',
      sequence_name: template.name,
      ...context,
    };

    // Remplacer les variables dans le contenu (simple remplacement)
    let processedHtml = htmlContent;
    let processedSubject = subject;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processedHtml = processedHtml.replace(regex, String(value));
      processedSubject = processedSubject.replace(regex, String(value));
    });

    // Préparer la requête SendGrid
    const sendGridRequest = {
      personalizations: [
        {
          to: [{ email: recipient.email, name: recipient.name }],
          subject: processedSubject,
          custom_args: {
            sequence_id: sequenceId,
            user_id: userId,
            template_id: template.id,
          },
        },
      ],
      from: {
        email: template.from_email,
        name: template.from_name,
      },
      content: [
        {
          type: 'text/html',
          value: processedHtml,
        },
      ],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
      },
    };

    // Envoyer via SendGrid
    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendGridRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid error:', errorText);
      return { success: false, error: `SendGrid error: ${response.status}` };
    }

    const messageId = response.headers.get('X-Message-Id') || undefined;

    return { success: true, messageId };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
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

serve(async (req) => {
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Vérifier la clé API SendGrid
    if (!SENDGRID_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'SendGrid API Key not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
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
          headers: { 'Content-Type': 'application/json' },
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
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
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
            from_email: 'noreply@emarzona.com',
            from_name: 'Emarzona',
          };
        }

        // Envoyer l'email
        const result = await sendEmailViaSendGrid(
          {
            email: emailData.recipient_email,
            name: emailData.context?.user_name,
          },
          template,
          emailData.sequence_id,
          emailData.user_id,
          emailData.context || {}
        );

        if (result.success) {
          sentCount++;

          // Logger l'email
          await supabase.from('email_logs').insert({
            to: emailData.recipient_email,
            subject: template.subject['fr'] || template.name,
            template_id: template.id,
            sequence_id: emailData.sequence_id,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          // Faire avancer l'enrollment
          await advanceEnrollment(supabase, emailData.enrollment_id);
        } else {
          errorCount++;
          errors.push({
            enrollment_id: emailData.enrollment_id,
            error: result.error || 'Unknown error',
          });

          // Logger l'erreur
          await supabase.from('email_logs').insert({
            to: emailData.recipient_email,
            subject: template.subject['fr'] || template.name,
            template_id: template.id,
            sequence_id: emailData.sequence_id,
            status: 'failed',
            error_message: result.error,
            sent_at: new Date().toISOString(),
          });
        }

        // Petit délai pour éviter le rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
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
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in process-email-sequences function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

