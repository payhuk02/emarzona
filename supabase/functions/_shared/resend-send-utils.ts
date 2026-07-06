/**
 * Envoi marketing / séquences via Resend (provider unifié)
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { logEmailSend, pickLocalized, replaceVariables, htmlToText } from './email-template-utils.ts';

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

  // Construire l'URL de désabonnement marketing
  const cleanEmail = encodeURIComponent(options.to.trim().toLowerCase());
  const unsubscribeUrl = `https://emarzona.com/unsubscribe?email=${cleanEmail}&type=marketing${options.campaignId ? `&campaign_id=${options.campaignId}` : ''}${options.storeId ? `&store_id=${options.storeId}` : ''}`;

  const variables = {
    user_name: options.toName || 'Client',
    unsubscribe_url: unsubscribeUrl,
    ...(options.variables || {}),
  };

  const subject = replaceVariables(subjectRaw, variables);
  let html = replaceVariables(htmlRaw, variables);

  // Injection automatique du pied de page de désabonnement s'il n'est pas présent dans l'HTML final
  const hasUnsubscribeLink = html.includes('/unsubscribe') || html.includes('unsubscribe') || html.includes('désabonner') || html.includes('desabonner');
  if (!hasUnsubscribeLink) {
    const isFrench = language.toLowerCase().startsWith('fr');
    const footerText = isFrench 
      ? `Cet email vous a été envoyé par Emarzona.<br>Pour ne plus recevoir ces emails, vous pouvez vous <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: underline;">désabonner ici</a>.`
      : `This email was sent by Emarzona.<br>To unsubscribe from these emails, you can <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: underline;">unsubscribe here</a>.`;
      
    const footerHtml = `
      <div style="margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px; text-align: center; font-size: 12px; color: #888888; font-family: sans-serif;">
        ${footerText}
      </div>
    `;

    if (html.includes('</body>')) {
      html = html.replace('</body>', `${footerHtml}</body>`);
    } else {
      html = html + footerHtml;
    }
  }

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
        text: htmlToText(html),
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
        status: 'failed',
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
      provider_message_id: messageId,
      status: 'sent',
    });

    return { success: true, messageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
