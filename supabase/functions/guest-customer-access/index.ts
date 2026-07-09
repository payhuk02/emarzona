import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

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

function resolvePortalPath(productType: string | null | undefined): string {
  switch (productType) {
    case 'digital':
      return '/account/downloads';
    case 'course':
      return '/account/courses';
    case 'service':
      return '/account/bookings';
    case 'artist':
      return '/account/artist';
    case 'physical':
      return '/account/physical';
    default:
      return '/account/orders';
  }
}

const PAID_STATUSES = new Set(['paid', 'completed']);

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
      .select('id, payment_status, customer_id, customer_email, metadata')
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

    let orderEmail = order.customer_email ? normalizeEmail(order.customer_email) : null;

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
        JSON.stringify({ success: false, error: 'Email non associé à cette commande', code: 'EMAIL_MISMATCH' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_type')
      .eq('order_id', orderId)
      .limit(1);

    const productType = orderItems?.[0]?.product_type ?? null;
    const redirectPath = resolvePortalPath(productType);
    const redirectTo = `${siteUrl.replace(/\/$/, '')}${redirectPath}`;

    let targetUserId: string | null = null;

    const { data: userByEmail, error: lookupError } =
      await supabaseAdmin.auth.admin.getUserByEmail(normalizedEmail);

    if (!lookupError && userByEmail?.user?.id) {
      targetUserId = userByEmail.user.id;
    }

    if (!targetUserId) {
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
        if (
          createError.message.toLowerCase().includes('already') ||
          createError.message.toLowerCase().includes('registered')
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Un compte existe déjà. Connectez-vous avec cet email.',
              code: 'USER_EXISTS_LOGIN_REQUIRED',
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw createError;
      }
      targetUserId = created.user?.id ?? null;
    }

    if (!targetUserId) {
      throw new Error('Utilisateur introuvable');
    }

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
