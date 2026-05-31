/**
 * Envoi marketing / séquences via Resend (provider unifié)
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { logEmailSend, pickLocalized, replaceVariables } from './email-template-utils.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.emarzona.com';
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Emarzona';

export interface MarketingTemplate {
  id: string;
  name: string;
  subject: Record<string, string>;
  html_content: Record<string, string>;
  from_email?: string;
  from_name?: string;
}

export interface SendMarketingEmailOptions {
  supabase: SupabaseClient;
  to: string;
  toName?: string;
  template: MarketingTemplate;
  variables?: Record<string, unknown>;
  language?: string;
  userId?: string;
  storeId?: string;
  campaignId?: string;
  sequenceId?: string;
  templateSlug?: string;
  /** Remplace le sujet du template (ex. variante A/B) */
  subjectOverride?: string;
  /** Tag Resend pour traçabilité (ex. ab_variant_a) */
  abVariantTag?: string;
}

export async function sendMarketingEmailViaResend(
  options: SendMarketingEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const language = options.language || 'fr';
  const subjectRaw =
    options.subjectOverride ||
    pickLocalized(options.template.subject, language) ||
    options.template.name;
  const htmlRaw = pickLocalized(options.template.html_content, language) || '';

  const variables = {
    user_name: options.toName || 'Client',
    ...(options.variables || {}),
  };

  const subject = replaceVariables(subjectRaw, variables);
  const html = replaceVariables(htmlRaw, variables);

  const fromEmail = options.template.from_email || RESEND_FROM_EMAIL;
  const fromName = options.template.from_name || RESEND_FROM_NAME;

  const tags: Array<{ name: string; value: string }> = [];
  if (options.campaignId) tags.push({ name: 'campaign_id', value: options.campaignId });
  if (options.sequenceId) tags.push({ name: 'sequence_id', value: options.sequenceId });
  if (options.storeId) tags.push({ name: 'store_id', value: options.storeId });
  if (options.abVariantTag) tags.push({ name: 'ab_variant', value: options.abVariantTag });

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [options.to.trim().toLowerCase()],
        subject,
        html,
        ...(tags.length > 0 ? { tags } : {}),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await logEmailSend(options.supabase, {
        template_id: options.template.id !== 'default' ? options.template.id : undefined,
        template_slug: options.templateSlug || options.template.name,
        recipient_email: options.to,
        recipient_name: options.toName,
        user_id: options.userId,
        store_id: options.storeId,
        subject,
        html_content: html,
        variables,
        sendgrid_status: 'failed',
        error_message: errorText,
        error_code: String(response.status),
      });
      return { success: false, error: `Resend error: ${response.status}` };
    }

    const result = await response.json();
    const messageId = result.id as string;

    await logEmailSend(options.supabase, {
      template_id: options.template.id !== 'default' ? options.template.id : undefined,
      template_slug: options.templateSlug || options.template.name,
      recipient_email: options.to,
      recipient_name: options.toName,
      user_id: options.userId,
      store_id: options.storeId,
      subject,
      html_content: html,
      variables: {
        ...variables,
        ...(options.campaignId ? { campaign_id: options.campaignId } : {}),
        ...(options.sequenceId ? { sequence_id: options.sequenceId } : {}),
      },
      sendgrid_message_id: messageId,
      sendgrid_status: 'sent',
    });

    return { success: true, messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
