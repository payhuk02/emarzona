/**
 * Supabase Edge Function: Send Email Campaign
 * Envoie des campagnes email marketing via SendGrid
 * Date: 1er Février 2025
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

interface SendCampaignRequest {
  campaign_id: string;
  batch_size?: number; // Nombre d'emails à envoyer par batch (défaut: 100)
  batch_index?: number; // Index du batch actuel (pour traitement en plusieurs fois)
}

interface Campaign {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  type: string;
  template_id?: string;
  status: string;
  scheduled_at?: string;
  audience_type: string;
  segment_id?: string;
  audience_filters: Record<string, any>;
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
    revenue: number;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: Record<string, string>;
  html_content: Record<string, string>;
  from_email: string;
  from_name: string;
}

interface Recipient {
  email: string;
  name?: string;
  user_id?: string;
  variables?: Record<string, any>;
}

/**
 * Récupère la campagne depuis la base de données
 */
async function getCampaign(supabase: any, campaignId: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error || !data) {
    console.error('Error fetching campaign:', error);
    return null;
  }

  return {
    ...data,
    metrics: data.metrics || {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      revenue: 0,
    },
  };
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
 * Récupère les destinataires selon le type d'audience
 */
async function getRecipients(
  supabase: any,
  campaign: Campaign,
  batchSize: number = 100,
  batchIndex: number = 0
): Promise<Recipient[]> {
  const offset = batchIndex * batchSize;
  const recipients: Recipient[] = [];

  try {
    switch (campaign.audience_type) {
      case 'segment':
        // Récupérer les membres du segment
        if (campaign.segment_id) {
          const { data: segmentMembers } = await supabase
            .from('email_segments')
            .select(`
              id,
              criteria,
              customers:customers!inner (
                email,
                first_name,
                last_name,
                id
              )
            `)
            .eq('id', campaign.segment_id)
            .single();

          if (segmentMembers?.customers) {
            segmentMembers.customers.slice(offset, offset + batchSize).forEach((customer: any) => {
              recipients.push({
                email: customer.email,
                name: customer.first_name || customer.last_name 
                  ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() 
                  : undefined,
                user_id: customer.id,
              });
            });
          }
        }
        break;

      case 'list':
        // TODO: Implémenter la récupération depuis une liste d'emails
        // Pour l'instant, on récupère tous les clients de la boutique
        const { data: customers } = await supabase
          .from('customers')
          .select('email, first_name, last_name, id')
          .eq('store_id', campaign.store_id)
          .range(offset, offset + batchSize - 1);

        if (customers) {
          customers.forEach((customer: any) => {
            recipients.push({
              email: customer.email,
              name: customer.first_name || customer.last_name 
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() 
                : undefined,
              user_id: customer.id,
            });
          });
        }
        break;

      case 'filter':
        // Récupérer les clients selon les filtres
        const filters = campaign.audience_filters || {};
        let query = supabase
          .from('customers')
          .select('email, first_name, last_name, id')
          .eq('store_id', campaign.store_id);

        // Appliquer les filtres
        if (filters.has_purchased === true) {
          // Récupérer les clients qui ont acheté
          query = query.not('id', 'is', null); // Simplifié - à améliorer avec une vraie jointure
        }

        const { data: filteredCustomers } = await query
          .range(offset, offset + batchSize - 1);

        if (filteredCustomers) {
          filteredCustomers.forEach((customer: any) => {
            recipients.push({
              email: customer.email,
              name: customer.first_name || customer.last_name 
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() 
                : undefined,
              user_id: customer.id,
            });
          });
        }
        break;
    }
  } catch (error) {
    console.error('Error fetching recipients:', error);
  }

  return recipients;
}

/**
 * Envoie un email via SendGrid
 */
async function sendEmailViaSendGrid(
  recipient: Recipient,
  template: EmailTemplate,
  campaign: Campaign
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
      campaign_name: campaign.name,
      ...(recipient.variables || {}),
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
            campaign_id: campaign.id,
            user_id: recipient.user_id || '',
            store_id: campaign.store_id,
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
 * Met à jour les métriques de la campagne
 */
async function updateCampaignMetrics(
  supabase: any,
  campaignId: string,
  metrics: Partial<Campaign['metrics']>
) {
  // Récupérer les métriques actuelles
  const { data: currentCampaign } = await supabase
    .from('email_campaigns')
    .select('metrics')
    .eq('id', campaignId)
    .single();

  if (!currentCampaign) return;

  const currentMetrics = currentCampaign.metrics || {
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    unsubscribed: 0,
    revenue: 0,
  };

  // Mettre à jour les métriques
  const updatedMetrics = {
    ...currentMetrics,
    ...metrics,
  };

  await supabase
    .from('email_campaigns')
    .update({ metrics: updatedMetrics })
    .eq('id', campaignId);
}

/**
 * Met à jour le statut de la campagne
 */
async function updateCampaignStatus(
  supabase: any,
  campaignId: string,
  status: string
) {
  await supabase
    .from('email_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaignId);
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
    const { campaign_id, batch_size = 100, batch_index = 0 }: SendCampaignRequest = await req.json();

    if (!campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: campaign_id' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Créer le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer la campagne
    const campaign = await getCampaign(supabase, campaign_id);
    if (!campaign) {
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Vérifier que la campagne peut être envoyée
    if (campaign.status !== 'scheduled' && campaign.status !== 'draft') {
      return new Response(
        JSON.stringify({ error: `Campaign cannot be sent. Current status: ${campaign.status}` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Récupérer le template
    let template: EmailTemplate | null = null;
    if (campaign.template_id) {
      template = await getTemplate(supabase, campaign.template_id);
      if (!template) {
        return new Response(
          JSON.stringify({ error: 'Template not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // Template par défaut si aucun template spécifié
      template = {
        id: 'default',
        name: campaign.name,
        subject: { fr: campaign.name },
        html_content: { fr: campaign.description || '' },
        from_email: 'noreply@emarzona.com',
        from_name: 'Emarzona',
      };
    }

    // Mettre à jour le statut à "sending"
    if (batch_index === 0) {
      await updateCampaignStatus(supabase, campaign_id, 'sending');
    }

    // Récupérer les destinataires
    const recipients = await getRecipients(supabase, campaign, batch_size, batch_index);

    if (recipients.length === 0) {
      // Aucun destinataire, terminer la campagne
      await updateCampaignStatus(supabase, campaign_id, 'completed');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Campaign completed - no recipients',
          sent: 0,
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

    // Envoyer les emails
    let sentCount = 0;
    let errorCount = 0;

    for (const recipient of recipients) {
      // Vérifier si l'utilisateur n'est pas désabonné
      const { data: unsubscribe } = await supabase
        .from('email_unsubscribes')
        .select('id')
        .eq('email', recipient.email)
        .maybeSingle();

      if (unsubscribe) {
        console.log(`Skipping unsubscribed recipient: ${recipient.email}`);
        continue;
      }

      const result = await sendEmailViaSendGrid(recipient, template, campaign);

      if (result.success) {
        sentCount++;
      } else {
        errorCount++;
        console.error(`Failed to send email to ${recipient.email}:`, result.error);
      }

      // Logger l'email
      await supabase.from('email_logs').insert({
        to: recipient.email,
        subject: template.subject['fr'] || template.name,
        template_id: template.id,
        campaign_id: campaign_id,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        sent_at: new Date().toISOString(),
      });

      // Petit délai pour éviter le rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Mettre à jour les métriques
    await updateCampaignMetrics(supabase, campaign_id, {
      sent: campaign.metrics.sent + sentCount,
    });

    // Vérifier si c'est le dernier batch
    const hasMoreRecipients = recipients.length === batch_size;

    if (!hasMoreRecipients) {
      // Terminer la campagne
      await updateCampaignStatus(supabase, campaign_id, 'completed');
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        batch_index,
        has_more: hasMoreRecipients,
        next_batch_index: hasMoreRecipients ? batch_index + 1 : null,
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
    console.error('Error in send-email-campaign function:', error);
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

