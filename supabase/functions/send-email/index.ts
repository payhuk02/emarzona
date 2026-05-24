/**
 * Supabase Edge Function: Send Email
 * Resend API + templates DB (templateSlug) + templates paiement intégrés
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  canSendEmailToRecipient,
  verifyStoreAccess,
  type EmailCategory,
} from '../_shared/email-compliance-utils.ts';
import { logEmailSend, renderDbTemplate } from '../_shared/email-template-utils.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mail.emarzona.com';
const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Emarzona';
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const USER_ALLOWED_TEMPLATES = new Set([
  'payment_success',
  'payment_failed',
  'payment_cancelled',
  'payment_refunded',
  'payment_pending',
]);

/** Alias legacy (webhooks Moneroo, etc.) */
const PAYMENT_TEMPLATE_ALIASES: Record<string, string> = {
  'payment-received': 'payment_success',
  'payment-failed': 'payment_failed',
};

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

function jsonResponse(
  req: Request,
  status: number,
  body: Record<string, unknown>,
  requestId: string,
  requestStart: number
) {
  return new Response(
    JSON.stringify({
      ...body,
      requestId,
      durationMs: Date.now() - requestStart,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(req),
      },
    }
  );
}

interface EmailRequest {
  to: string;
  subject?: string;
  template?: string;
  html?: string;
  data?: Record<string, unknown>;
  templateSlug?: string;
  variables?: Record<string, unknown>;
  toName?: string;
  userId?: string;
  productType?: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  storeId?: string;
  language?: string;
}

function logEvent(
  level: 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, unknown>
) {
  const payload = JSON.stringify({ level, message, ...context });
  if (level === 'error') console.error(payload);
  else if (level === 'warn') console.warn(payload);
  else console.log(payload);
}

function normalizePaymentData(data: Record<string, unknown>): Record<string, unknown> {
  return {
    customerName: data.customerName ?? data.customer_name ?? 'Client',
    amount: data.amount ?? 0,
    currency: data.currency ?? 'XOF',
    orderNumber: data.orderNumber ?? data.order_number ?? '',
    transactionId: data.transactionId ?? data.transaction_id ?? '',
    reason: data.reason ?? data.error_message ?? '',
  };
}

function generatePaymentEmailHTML(template: string, data: Record<string, unknown>): string {
  const normalized = normalizePaymentData(data);
  const customerName = String(normalized.customerName);
  const amount = Number(normalized.amount) || 0;
  const currency = String(normalized.currency);
  const orderNumber = String(normalized.orderNumber);
  const transactionId = String(normalized.transactionId);
  const reason = String(normalized.reason);

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(amount);

  switch (template) {
    case 'payment_success':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Paiement confirmé</title></head>
        <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;">
            <h1 style="margin:0;">✅ Paiement confirmé</h1>
          </div>
          <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
            <p>Bonjour ${customerName},</p>
            <p>Votre paiement a été confirmé avec succès !</p>
            <div style="background:white;padding:20px;border-radius:5px;margin:20px 0;">
              <p style="margin:0;"><strong>Montant:</strong> ${formattedAmount}</p>
              ${orderNumber ? `<p style="margin:10px 0 0 0;"><strong>Commande:</strong> #${orderNumber}</p>` : ''}
              ${transactionId ? `<p style="margin:10px 0 0 0;"><strong>Transaction:</strong> ${transactionId}</p>` : ''}
            </div>
            <p>Merci pour votre achat !</p>
            <p style="margin-top:30px;">Cordialement,<br>L'équipe Emarzona</p>
          </div>
        </body></html>`;

    case 'payment_failed':
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Paiement échoué</title></head>
        <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0;">
            <h1 style="margin:0;">❌ Paiement échoué</h1>
          </div>
          <div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;">
            <p>Bonjour ${customerName},</p>
            <p>Votre paiement de ${formattedAmount} a échoué.</p>
            ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
            <p>Veuillez réessayer ou contacter le support si le problème persiste.</p>
            <p style="margin-top:30px;">Cordialement,<br>L'équipe Emarzona</p>
          </div>
        </body></html>`;

    case 'payment_cancelled':
      return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px;">
        <p>Bonjour ${customerName},</p>
        <p>Votre paiement de ${formattedAmount} a été annulé.</p>
        ${reason ? `<p><strong>Raison:</strong> ${reason}</p>` : ''}
        <p>Cordialement,<br>L'équipe Emarzona</p></body></html>`;

    case 'payment_refunded':
      return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px;">
        <p>Bonjour ${customerName},</p>
        <p>Un remboursement de ${formattedAmount} a été effectué.</p>
        <p>Cordialement,<br>L'équipe Emarzona</p></body></html>`;

    case 'payment_pending':
      return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:20px;">
        <p>Bonjour ${customerName},</p>
        <p>Votre paiement de ${formattedAmount} est en cours de traitement.</p>
        <p>Cordialement,<br>L'équipe Emarzona</p></body></html>`;

    default:
      return `<!DOCTYPE html><html><body><p>Bonjour ${customerName},</p></body></html>`;
  }
}

function defaultPaymentSubject(template: string): string {
  const subjects: Record<string, string> = {
    payment_success: '✅ Paiement confirmé - Emarzona',
    payment_failed: '❌ Paiement échoué - Emarzona',
    payment_cancelled: 'Paiement annulé - Emarzona',
    payment_refunded: 'Remboursement effectué - Emarzona',
    payment_pending: 'Paiement en attente - Emarzona',
  };
  return subjects[template] || 'Notification Emarzona';
}

serve(async req => {
  const requestStart = Date.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const isProduction = Deno.env.get('DENO_ENV') === 'production';
    if (isProduction && ALLOWED_ORIGINS.length === 0) {
      return jsonResponse(
        req,
        500,
        { error: 'ALLOWED_ORIGINS is required in production' },
        requestId,
        requestStart
      );
    }

    const internalSecret = req.headers.get('x-internal-secret');
    const expectedInternalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse(
        req,
        500,
        { error: 'Supabase configuration missing' },
        requestId,
        requestStart
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let isAuthorized = false;
    let isInternalCall = false;
    let callerEmail = '';
    let callerUserId = '';

    if (expectedInternalSecret && internalSecret?.trim() === expectedInternalSecret.trim()) {
      isAuthorized = true;
      isInternalCall = true;
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!isAuthorized && token && token === supabaseServiceKey) {
      isAuthorized = true;
      isInternalCall = true;
    }

    if (!isAuthorized && token) {
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (!userError && userData.user) {
        isAuthorized = true;
        callerUserId = userData.user.id;
        if (userData.user.email) {
          callerEmail = userData.user.email.toLowerCase();
        }
      }
    }

    if (!isAuthorized) {
      logEvent('warn', 'Unauthorized send-email call', { requestId });
      return jsonResponse(req, 401, { error: 'Unauthorized' }, requestId, requestStart);
    }

    if (!RESEND_API_KEY) {
      return jsonResponse(
        req,
        500,
        { error: 'Email service not configured' },
        requestId,
        requestStart
      );
    }

    const body: EmailRequest = await req.json();
    const {
      to,
      subject: requestSubject,
      template,
      html,
      data,
      templateSlug,
      variables = {},
      toName,
      userId,
      productType,
      productId,
      productName,
      orderId,
      storeId,
      language,
    } = body;

    if (!to) {
      return jsonResponse(
        req,
        400,
        { error: 'Missing required parameter: to' },
        requestId,
        requestStart
      );
    }

    const normalizedTo = to.trim().toLowerCase();
    if (!normalizedTo.includes('@')) {
      return jsonResponse(
        req,
        400,
        { error: 'Invalid recipient email address' },
        requestId,
        requestStart
      );
    }

    const slug = (templateSlug || '').trim();
    let normalizedTemplate = (template || '').trim();
    if (normalizedTemplate && PAYMENT_TEMPLATE_ALIASES[normalizedTemplate]) {
      normalizedTemplate = PAYMENT_TEMPLATE_ALIASES[normalizedTemplate];
    }

    // Autorisation destinataire / template
    if (!isInternalCall) {
      if (html) {
        return jsonResponse(
          req,
          403,
          { error: 'Custom HTML is restricted to internal calls' },
          requestId,
          requestStart
        );
      }

      if (slug) {
        const selfOnly = callerEmail === normalizedTo;
        const storeAccess = callerUserId
          ? await verifyStoreAccess(supabase, callerUserId, {
              storeId,
              productId,
              orderId,
            })
          : { allowed: false };
        if (!selfOnly && !storeAccess.allowed) {
          return jsonResponse(
            req,
            403,
            { error: 'Not allowed to send templated email to this recipient' },
            requestId,
            requestStart
          );
        }
      } else if (normalizedTemplate) {
        if (!USER_ALLOWED_TEMPLATES.has(normalizedTemplate)) {
          return jsonResponse(
            req,
            403,
            { error: 'Template not allowed for user-initiated requests' },
            requestId,
            requestStart
          );
        }
        if (!callerEmail || callerEmail !== normalizedTo) {
          return jsonResponse(
            req,
            403,
            { error: 'User-initiated requests can only target the authenticated user email' },
            requestId,
            requestStart
          );
        }
      } else {
        return jsonResponse(
          req,
          400,
          { error: 'Missing template, templateSlug, or html (internal only)' },
          requestId,
          requestStart
        );
      }
    }

    let finalSubject = (requestSubject || '').trim();
    let htmlContent = html || '';
    let templateId: string | undefined;
    let resolvedSlug = slug || normalizedTemplate || 'custom';
    let emailCategory: EmailCategory = 'transactional';
    let fromEmail = RESEND_FROM_EMAIL;
    let fromName = RESEND_FROM_NAME;

    if (slug) {
      const rendered = await renderDbTemplate(supabase, slug, variables, {
        productType: productType ?? null,
        language,
        userId,
      });
      if (!rendered) {
        return jsonResponse(
          req,
          404,
          { error: `Template not found: ${slug}` },
          requestId,
          requestStart
        );
      }
      finalSubject = finalSubject || rendered.subject;
      htmlContent = rendered.html;
      templateId = rendered.templateId;
      resolvedSlug = rendered.templateSlug;
      emailCategory = (rendered.category as EmailCategory) || 'transactional';
      if (rendered.fromEmail) fromEmail = rendered.fromEmail;
      if (rendered.fromName) fromName = rendered.fromName;
    } else if (!htmlContent && normalizedTemplate) {
      htmlContent = generatePaymentEmailHTML(normalizedTemplate, data || {});
      finalSubject = finalSubject || defaultPaymentSubject(normalizedTemplate);
      resolvedSlug = normalizedTemplate;
      emailCategory = 'transactional';
    }

    const eligibility = await canSendEmailToRecipient(
      supabase,
      normalizedTo,
      emailCategory,
      userId
    );
    if (!eligibility.allowed) {
      logEvent('info', 'Email skipped by compliance', {
        requestId,
        to: normalizedTo,
        category: emailCategory,
        reason: eligibility.reason,
      });
      await logEmailSend(supabase, {
        template_id: templateId,
        template_slug: resolvedSlug,
        recipient_email: normalizedTo,
        recipient_name: toName,
        user_id: userId,
        subject: finalSubject || resolvedSlug,
        product_type: productType,
        product_id: productId,
        product_name: productName,
        order_id: orderId,
        store_id: storeId,
        variables,
        sendgrid_status: 'failed',
        error_message: eligibility.reason,
        error_code: 'COMPLIANCE_SKIPPED',
      });
      return jsonResponse(
        req,
        200,
        {
          success: false,
          skipped: true,
          reason: eligibility.reason,
          to: normalizedTo,
        },
        requestId,
        requestStart
      );
    }

    if (!finalSubject) {
      return jsonResponse(
        req,
        400,
        { error: 'Missing subject (required when not using templateSlug or payment template)' },
        requestId,
        requestStart
      );
    }

    if (!htmlContent) {
      return jsonResponse(req, 400, { error: 'Missing HTML content' }, requestId, requestStart);
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [normalizedTo],
        subject: finalSubject,
        html: htmlContent,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      await logEmailSend(supabase, {
        template_id: templateId,
        template_slug: resolvedSlug,
        recipient_email: normalizedTo,
        recipient_name: toName,
        user_id: userId,
        subject: finalSubject,
        html_content: htmlContent,
        product_type: productType,
        product_id: productId,
        product_name: productName,
        order_id: orderId,
        store_id: storeId,
        variables,
        sendgrid_status: 'failed',
        error_message: errorData,
        error_code: String(resendResponse.status),
      });
      return jsonResponse(
        req,
        resendResponse.status,
        { error: 'Failed to send email', details: errorData },
        requestId,
        requestStart
      );
    }

    const result = await resendResponse.json();

    await logEmailSend(supabase, {
      template_id: templateId,
      template_slug: resolvedSlug,
      recipient_email: normalizedTo,
      recipient_name: toName,
      user_id: userId,
      subject: finalSubject,
      html_content: htmlContent,
      product_type: productType,
      product_id: productId,
      product_name: productName,
      order_id: orderId,
      store_id: storeId,
      variables,
      sendgrid_message_id: result.id,
      sendgrid_status: 'sent',
    });

    logEvent('info', 'Email sent', {
      requestId,
      template: resolvedSlug,
      to: normalizedTo,
      durationMs: Date.now() - requestStart,
    });

    return jsonResponse(
      req,
      200,
      {
        success: true,
        messageId: result.id,
        to: normalizedTo,
        subject: finalSubject,
        template: resolvedSlug,
      },
      requestId,
      requestStart
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    logEvent('error', 'Error in send-email function', {
      requestId,
      error: errorMessage,
    });
    return jsonResponse(req, 500, { error: errorMessage }, requestId, requestStart);
  }
});
