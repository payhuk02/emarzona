import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { isDuplicateAuthUserError } from '../_shared/auth-admin-utils.ts';
import { resolveCustomerPortalPath } from '../_shared/guest-customer-magic-link.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata == null) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

const PAID_STATUSES = new Set(['paid', 'completed']);

/**
 * Lie l'utilisateur auth aux artefacts d'achat (licences, customer, enrollments).
 */
async function backfillPurchaseAccess(
  supabaseAdmin: ReturnType<typeof createClient>,
  options: {
    userId: string;
    orderId: string;
    customerId: string | null;
    email: string;
  }
): Promise<void> {
  const { userId, orderId, customerId, email } = options;

  // Licences digitales de cette commande (ou même email sans user)
  await supabaseAdmin
    .from('digital_licenses')
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .is('user_id', null);

  await supabaseAdmin
    .from('digital_licenses')
    .update({ user_id: userId, order_id: orderId, updated_at: new Date().toISOString() })
    .is('user_id', null)
    .ilike('customer_email', email);

  if (customerId) {
    await supabaseAdmin
      .from('customers')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .is('user_id', null);
  }

  // Enrollments cours créés sans user (rare) — lier par email via metadata n/a;
  // auto_enroll utilise déjà auth.users.email. On s'assure que les enrollments
  // orphelins liés à la commande (si stockés) restent accessibles.
  const { data: courseItems } = await supabaseAdmin
    .from('order_items')
    .select('product_id')
    .eq('order_id', orderId)
    .eq('product_type', 'course');

  for (const item of courseItems ?? []) {
    if (!item.product_id) continue;
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('product_id', item.product_id)
      .maybeSingle();
    if (!course?.id) continue;
    try {
      await supabaseAdmin.rpc('enroll_user_in_course', {
        p_course_id: course.id,
        p_order_id: orderId,
        p_user_id: userId,
      });
    } catch (err) {
      console.warn('enroll_user_in_course backfill failed', err);
    }
  }
}

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { orderId, email } = await req.json();

    if (!orderId || typeof orderId !== 'string' || !email || typeof email !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'orderId et email requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail.includes('@')) {
      return new Response(JSON.stringify({ success: false, error: 'Email invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const siteUrl = Deno.env.get('SITE_URL') || defaultAllowedOrigin;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, payment_status, customer_id, metadata')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return new Response(JSON.stringify({ success: false, error: 'Commande introuvable' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!PAID_STATUSES.has(String(order.payment_status ?? '').toLowerCase())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Paiement non encore confirmé',
          code: 'PAYMENT_NOT_CONFIRMED',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderMeta = parseMetadata(order.metadata);
    let orderEmail: string | null =
      typeof orderMeta.customer_email === 'string'
        ? normalizeEmail(orderMeta.customer_email)
        : null;

    if (!orderEmail && order.customer_id) {
      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('email')
        .eq('id', order.customer_id)
        .maybeSingle();
      if (customer?.email) {
        orderEmail = normalizeEmail(customer.email);
      }
    }

    if (!orderEmail || orderEmail !== normalizedEmail) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email non associé à cette commande',
          code: 'EMAIL_MISMATCH',
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_type, product_id, products(slug)')
      .eq('order_id', orderId)
      .limit(1);

    const productType = orderItems?.[0]?.product_type ?? null;
    let redirectPath = resolveCustomerPortalPath(productType);

    // Cours : rediriger vers /learn/:slug si disponible
    if (productType === 'course') {
      const productRow = orderItems?.[0]?.products as { slug?: string } | null;
      const slug = productRow?.slug;
      if (slug) {
        redirectPath = `/learn/${encodeURIComponent(slug)}`;
      } else if (orderItems?.[0]?.product_id) {
        const { data: product } = await supabaseAdmin
          .from('products')
          .select('slug')
          .eq('id', orderItems[0].product_id)
          .maybeSingle();
        if (product?.slug) {
          redirectPath = `/learn/${encodeURIComponent(product.slug)}`;
        }
      }
    }

    const redirectTo = `${siteUrl.replace(/\/$/, '')}${redirectPath}`;

    let targetUserId: string | null = null;

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        guest_checkout: true,
        provisioned_via: 'guest-customer-access',
      },
    });

    if (createError) {
      if (!isDuplicateAuthUserError(createError)) {
        throw createError;
      }
      // Compte existant : magic link (pas de 409) + récupération user id
      const { data: linkProbe, error: probeError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: normalizedEmail,
        options: { redirectTo },
      });
      if (probeError || !linkProbe?.properties?.action_link) {
        console.error('generateLink for existing user failed', probeError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Impossible de générer le lien de connexion',
            code: 'LINK_GENERATION_FAILED',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUserId = linkProbe.user?.id ?? null;
      if (targetUserId) {
        await backfillPurchaseAccess(supabaseAdmin, {
          userId: targetUserId,
          orderId,
          customerId: order.customer_id ?? null,
          email: normalizedEmail,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          actionLink: linkProbe.properties.action_link,
          redirectPath,
          existingUser: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    targetUserId = created.user?.id ?? null;
    if (!targetUserId) {
      throw new Error('Utilisateur introuvable');
    }

    await backfillPurchaseAccess(supabaseAdmin, {
      userId: targetUserId,
      orderId,
      customerId: order.customer_id ?? null,
      email: normalizedEmail,
    });

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error('generateLink failed', linkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Impossible de générer le lien de connexion',
          code: 'LINK_GENERATION_FAILED',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        actionLink: linkData.properties.action_link,
        redirectPath,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('guest-customer-access error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
