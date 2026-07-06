/**
 * Supabase Edge Function: Send Email Campaign
 * Envoie des campagnes email marketing via Resend
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCampaignRecipients } from '../_shared/campaign-recipients.ts';
import { canSendEmailToRecipient } from '../_shared/email-compliance-utils.ts';
import { sendMarketingEmailViaResend } from '../_shared/resend-send-utils.ts';
import { getProjectRefFromSupabaseUrl, isServiceRoleJwt } from '../_shared/edge-auth-utils.ts';
import { isRateLimited } from '../_shared/upstash-redis.ts';
import {
  applySubjectOverride,
  getActiveABTestForCampaign,
  incrementABTestSent,
  pickABVariant,
} from '../_shared/campaign-ab-test.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowOrigin =
    ALLOWED_ORIGINS.length === 0
      ? '*'
      : ALLOWED_ORIGINS.includes(origin)
        ? origin
        : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-internal-secret',
    Vary: 'Origin',
  };
}

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
    .select(
      'id,store_id,name,description,type,template_id,status,scheduled_at,audience_type,segment_id,audience_filters,metrics'
    )
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

  await supabase.from('email_campaigns').update({ metrics: updatedMetrics }).eq('id', campaignId);
}

/**
 * Met à jour le statut de la campagne
 */
async function updateCampaignStatus(supabase: any, campaignId: string, status: string) {
  await supabase
    .from('email_campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', campaignId);
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  // Gérer les requêtes CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedInternalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(supabaseUrl, supabaseKey);
    let isAuthorized = false;
    if (expectedInternalSecret && internalSecret?.trim() === expectedInternalSecret.trim()) {
      isAuthorized = true;
    }
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!isAuthorized && token && token === supabaseKey) {
      isAuthorized = true;
    }
    const projectRef = getProjectRefFromSupabaseUrl(supabaseUrl);
    if (!isAuthorized && token && isServiceRoleJwt(token, projectRef)) {
      isAuthorized = true;
    }
    if (!isAuthorized && token) {
      const { data: userData, error: userError } = await authClient.auth.getUser(token);
      if (!userError && userData.user) {
        isAuthorized = true;
      }
    }
    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Rate limiting server-side (Upstash Redis) ---
    // Les campagnes sont limitées à 10 appels/minute (chaque appel envoie un batch de 100 emails)
    const rateLimitId = token ? token.slice(0, 16) : (req.headers.get('x-forwarded-for') ?? 'anon');
    const rl = await isRateLimited(rateLimitId, 'send-email-campaign', 10, 60);
    if (!rl.allowed) {
      return new Response(
        JSON.stringify({ error: 'Too many campaign sends. Please try again later.', retryAfterSeconds: 60 }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parser la requête
    const {
      campaign_id,
      batch_size = 100,
      batch_index = 0,
    }: SendCampaignRequest = await req.json();

    if (!campaign_id) {
      return new Response(JSON.stringify({ error: 'Missing required parameter: campaign_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer la campagne
    const campaign = await getCampaign(supabase, campaign_id);
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
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

    // Template par défaut de la campagne
    let defaultTemplate: EmailTemplate | null = null;
    if (campaign.template_id) {
      defaultTemplate = await getTemplate(supabase, campaign.template_id);
      if (!defaultTemplate) {
        return new Response(JSON.stringify({ error: 'Template not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      defaultTemplate = {
        id: 'default',
        name: campaign.name,
        subject: { fr: campaign.name },
        html_content: { fr: campaign.description || '' },
        from_email: 'noreply@mail.emarzona.com',
        from_name: 'Emarzona',
      };
    }

    const abTest = await getActiveABTestForCampaign(supabase, campaign_id);
    const templateCache = new Map<string, EmailTemplate>();
    templateCache.set(defaultTemplate.id, defaultTemplate);

    if (abTest) {
      if (batch_index === 0) {
        await supabase
          .from('email_ab_tests')
          .update({ test_started_at: new Date().toISOString() })
          .eq('id', abTest.id)
          .is('test_started_at', null);
      }
      for (const variant of [abTest.variant_a, abTest.variant_b]) {
        if (variant.template_id && !templateCache.has(variant.template_id)) {
          const variantTemplate = await getTemplate(supabase, variant.template_id);
          if (variantTemplate) {
            templateCache.set(variant.template_id, variantTemplate);
          }
        }
      }
    }

    const resolveTemplateForRecipient = (
      email: string
    ): {
      template: EmailTemplate;
      subjectOverride?: string;
      abVariant?: 'variant_a' | 'variant_b';
    } => {
      if (!abTest) {
        return { template: defaultTemplate! };
      }

      const pctA = Number(abTest.variant_a.send_percentage ?? 50);
      const variantKey = pickABVariant(email, campaign_id, pctA);
      const variantConfig = variantKey === 'variant_a' ? abTest.variant_a : abTest.variant_b;

      let template = defaultTemplate!;
      if (variantConfig.template_id) {
        const cached = templateCache.get(variantConfig.template_id);
        if (cached) template = cached;
      }

      if (variantConfig.subject) {
        template = applySubjectOverride(template, variantConfig.subject);
      }

      return {
        template,
        subjectOverride: variantConfig.subject,
        abVariant: variantKey,
      };
    };

    // Mettre à jour le statut à "sending"
    if (batch_index === 0) {
      await updateCampaignStatus(supabase, campaign_id, 'sending');
    }

    // Récupérer les destinataires
    const recipients = await getCampaignRecipients(supabase, campaign, batch_size, batch_index);

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
            ...corsHeaders,
          },
        }
      );
    }

    // Envoyer les emails
    let sentCount = 0;
    let errorCount = 0;

    for (const recipient of recipients) {
      const eligibility = await canSendEmailToRecipient(
        supabase,
        recipient.email,
        'marketing',
        recipient.user_id
      );

      if (!eligibility.allowed) {
        console.log(`Skipping recipient ${recipient.email}: ${eligibility.reason}`);
        continue;
      }

      const {
        template: recipientTemplate,
        subjectOverride,
        abVariant,
      } = resolveTemplateForRecipient(recipient.email);

      const result = await sendMarketingEmailViaResend({
        supabase,
        to: recipient.email,
        toName: recipient.name,
        template: recipientTemplate,
        subjectOverride,
        variables: {
          campaign_name: campaign.name,
          ...(recipient.variables || {}),
        },
        userId: recipient.user_id,
        storeId: campaign.store_id,
        campaignId: campaign_id,
        templateSlug: recipientTemplate.name,
        abVariantTag: abVariant,
      });

      if (result.success) {
        sentCount++;
        if (abTest && abVariant) {
          await incrementABTestSent(supabase, abTest.id, abVariant);
        }
      } else {
        errorCount++;
        console.error(`Failed to send email to ${recipient.email}:`, result.error);
      }

      // Petit délai pour éviter le rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
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
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-email-campaign function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
});
