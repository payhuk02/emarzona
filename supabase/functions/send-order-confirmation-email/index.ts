import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { getProjectRefFromSupabaseUrl, isServiceRoleJwt } from '../_shared/edge-auth-utils.ts';
import { mintOrderDownloadLink } from '../_shared/mint-download-token.ts';
import { CHECKOUT_GUEST_WINDOW_MS } from '../_shared/order-checkout-auth.ts';
import {
  formatOrderDateTime,
  formatShippingAddress,
  resolveCustomerPortalLink,
  resolvePhysicalWhatsAppLink,
} from '../_shared/physical-order-email-utils.ts';
import { sendSellerOrderNotificationEmail, sendSellerPaymentFailedEmail } from '../_shared/seller-order-notification-email.ts';

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
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-internal-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

interface EmailPayload {
  order_id: string;
  customer_email?: string;
  customer_name?: string;
  customer_id?: string;
  seller_only?: boolean;
  notify_seller_payment_failed?: boolean;
}

function parseOrderMetadata(metadata: unknown): Record<string, unknown> {
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

const EDGE_INTERNAL_SECRET = Deno.env.get('EDGE_INTERNAL_SECRET');

async function invokeSendEmail(
  supabase: SupabaseClient<any, 'public', any>,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const headers: Record<string, string> = {};
  if (EDGE_INTERNAL_SECRET) {
    headers['x-internal-secret'] = EDGE_INTERNAL_SECRET;
  }

  const { data, error } = await supabase.functions.invoke('send-email', { body, headers });

  if (error) {
    console.error('send-email invoke error:', error);
    return { ok: false, error: error.message };
  }

  const result = data as { success?: boolean; error?: string } | null;
  if (result?.success === false || result?.error) {
    return { ok: false, error: result.error || 'send-email failed' };
  }

  return { ok: true };
}

serve(async req => {
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedInternalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase configuration missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload: EmailPayload = await req.json();

    if (!payload.order_id) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(supabaseUrl, supabaseServiceKey);
    let isAuthorized = false;
    if (expectedInternalSecret && internalSecret?.trim() === expectedInternalSecret.trim()) {
      isAuthorized = true;
    }
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!isAuthorized && token && token === supabaseServiceKey) {
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
      const checkoutToken = req.headers.get('x-checkout-token')?.trim();
      if (checkoutToken) {
        const { data: orderRow } = await authClient
          .from('orders')
          .select('id, created_at, metadata, customer_id, payment_status, status')
          .eq('id', payload.order_id)
          .maybeSingle();

        const orderMetadata = parseOrderMetadata(orderRow?.metadata);
        const orderToken =
          typeof orderMetadata.checkout_token === 'string' ? orderMetadata.checkout_token : null;
        const createdMs = orderRow?.created_at ? new Date(orderRow.created_at).getTime() : NaN;
        const withinGuestWindow =
          !Number.isNaN(createdMs) && Date.now() - createdMs <= CHECKOUT_GUEST_WINDOW_MS;
        const isCodOrConfirmed =
          orderRow?.payment_status === 'cod_pending' ||
          orderRow?.status === 'confirmed';

        if (orderToken && checkoutToken === orderToken && (withinGuestWindow || isCodOrConfirmed)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing order confirmation emails for order ${payload.order_id}...`);

    // Récupérer la commande avec tous les détails
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          product_id,
          product_type,
          product_name,
          quantity,
          item_metadata
        ),
        customer:customers (
          id,
          email,
          full_name,
          phone
        )
      `
      )
      .eq('id', payload.order_id)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found', details: orderError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const orderMetadata = parseOrderMetadata(order.metadata);
    const orderItems = (order.order_items || []) as Array<Record<string, unknown>>;
    const primaryItem = orderItems[0] || {
      product_name: 'Produit',
      product_type: 'generic',
    };

    // Seller payment-failed email path (triggered by SQL enqueue on failed/cancelled)
    if (payload.notify_seller_payment_failed) {
      if (orderMetadata.seller_failed_email_sent_at) {
        return new Response(
          JSON.stringify({
            success: true,
            orderId: payload.order_id,
            duplicate: true,
            message: 'Seller payment-failed email already sent',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const failedResult = await sendSellerPaymentFailedEmail(supabase, {
        order: { ...order, metadata: orderMetadata },
        items: orderItems.length > 0 ? orderItems : [primaryItem],
        primaryItem,
        invokeSendEmail: body => invokeSendEmail(supabase, body),
      });

      return new Response(
        JSON.stringify({
          success: true,
          orderId: payload.order_id,
          sellerPaymentFailedEmailSent: failedResult.sent,
          sellerPaymentFailedSkipped: failedResult.skipped,
          sellerPaymentFailedError: failedResult.error,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerEmailsAlreadySent = Boolean(orderMetadata.confirmation_email_sent_at);
    const sellerEmailAlreadySent = Boolean(orderMetadata.seller_order_email_sent_at);
    const sellerOnly = payload.seller_only === true;
    const hasCustomerEmail = Boolean(payload.customer_email?.trim());

    if (customerEmailsAlreadySent && sellerEmailAlreadySent) {
      console.log(
        `Order confirmation emails already sent for order ${payload.order_id} (customer + seller)`
      );
      return new Response(
        JSON.stringify({
          success: true,
          orderId: payload.order_id,
          message: 'Confirmation emails already sent',
          duplicate: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailResults: Array<Record<string, unknown>> = [];
    let emailsSentCount = 0;

    if (!sellerOnly && hasCustomerEmail && !customerEmailsAlreadySent) {
      // Grouper les items par type de produit
      const itemsByType: Record<string, typeof order.order_items> = {};

      (order.order_items || []).forEach((item: any) => {
        const productType = item.product_type || 'generic';
        if (!itemsByType[productType]) {
          itemsByType[productType] = [];
        }
        itemsByType[productType].push(item);
      });

      // Traiter chaque type de produit
      for (const [productType, items] of Object.entries(itemsByType)) {
        for (const item of items) {
          try {
            let emailSent = false;

            switch (productType) {
              case 'digital':
                emailSent = await sendDigitalEmail(supabase, order, item, payload);
                break;

              case 'physical':
                emailSent = await sendPhysicalEmail(supabase, order, item, payload);
                break;

              case 'service':
                emailSent = await sendServiceEmail(supabase, order, item, payload);
                break;

              case 'course':
                emailSent = await sendCourseEmail(supabase, order, item, payload);
                break;

              case 'artist':
                emailSent = await sendArtistEmail(supabase, order, item, payload);
                break;

              default:
                console.log(`Using physical fallback email for product type: ${productType}`);
                emailSent = await sendPhysicalEmail(supabase, order, item, payload);
            }

            emailResults.push({
              productType,
              productId: item.product_id,
              productName: item.product_name,
              emailSent,
            });
          } catch (error) {
            console.error(`Error sending email for item ${item.id}:`, error);
            emailResults.push({
              productType,
              productId: item.product_id,
              productName: item.product_name,
              emailSent: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }

      emailsSentCount = emailResults.filter(r => r.emailSent).length;
    } else {
      console.log(
        `Customer confirmation emails already sent for order ${payload.order_id} at ${orderMetadata.confirmation_email_sent_at}`
      );
    }

    let sellerEmailSent = sellerEmailAlreadySent;
    let sellerEmailSkipped: string | undefined;
    let sellerEmailError: string | undefined;

    if (!sellerEmailAlreadySent && orderItems.length > 0) {
      try {
        const sellerResult = await sendSellerOrderNotificationEmail(supabase, {
          order,
          items: orderItems,
          primaryItem: orderItems[0],
          invokeSendEmail: body => invokeSendEmail(supabase, body),
        });
        sellerEmailSent = sellerResult.sent;
        sellerEmailSkipped = sellerResult.skipped;
        sellerEmailError = sellerResult.error;
        if (sellerResult.error) {
          console.warn('Seller order notification email failed:', sellerResult.error);
        }
      } catch (error) {
        sellerEmailError = error instanceof Error ? error.message : String(error);
        console.warn('Seller order notification email failed:', sellerEmailError);
      }
    }

    if (emailsSentCount > 0 || sellerEmailSent) {
      const metadataPatch: Record<string, unknown> = { ...orderMetadata };

      if (emailsSentCount > 0) {
        metadataPatch.confirmation_email_sent_at = new Date().toISOString();
        metadataPatch.confirmation_emails_sent = emailsSentCount;
      }

      if (sellerEmailSent) {
        metadataPatch.seller_order_email_sent_at = new Date().toISOString();
      }

      await supabase
        .from('orders')
        .update({ metadata: metadataPatch })
        .eq('id', payload.order_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: payload.order_id,
        emailsSent: emailsSentCount,
        sellerEmailSent,
        sellerEmailSkipped,
        sellerEmailError,
        totalItems: emailResults.length,
        results: emailResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-order-confirmation-email:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions pour chaque type de produit
async function sendDigitalEmail(
  supabase: any,
  order: any,
  item: any,
  payload: EmailPayload
): Promise<boolean> {
  const { data: digitalProduct } = await supabase
    .from('digital_products')
    .select(
      'id, product_id, main_file_url, main_file_format, main_file_size_mb, total_size_mb, digital_type, license_type'
    )
    .eq('product_id', item.product_id)
    .single();

  if (!digitalProduct) {
    console.warn(`Digital product not found for product_id: ${item.product_id}`);
    return false;
  }

  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  const customerId = payload.customer_id || order.customer_id || order.customer?.id;

  let downloadLink = `${siteUrl}/account/digital`;
  let downloadExpiresAt: string | undefined;

  if (customerId && digitalProduct.main_file_url) {
    const { data: license } = await supabase
      .from('digital_licenses')
      .select('id')
      .eq('order_id', order.id)
      .eq('digital_product_id', digitalProduct.id)
      .maybeSingle();

    const secureLink = await mintOrderDownloadLink(supabase, {
      siteUrl,
      productId: item.product_id,
      fileUrl: digitalProduct.main_file_url,
      customerId,
      licenseId: license?.id ?? null,
      expiresHours: 48,
    });

    if (secureLink) {
      downloadLink = secureLink;
      downloadExpiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    } else {
      console.warn(
        `Secure download link not minted for order ${order.id}, product ${item.product_id}`
      );
    }
  }

  const fileSizeLabel =
    digitalProduct.total_size_mb != null
      ? `${digitalProduct.total_size_mb} MB`
      : digitalProduct.main_file_size_mb != null
        ? `${digitalProduct.main_file_size_mb} MB`
        : undefined;

  const result = await invokeSendEmail(supabase, {
    templateSlug: 'order-confirmation-digital',
    to: payload.customer_email,
    toName: payload.customer_name,
    userId: payload.customer_id,
    productType: 'digital',
    productId: item.product_id,
    productName: item.product_name,
    orderId: order.id,
    variables: {
      user_name: payload.customer_name,
      order_id: order.id,
      order_number: order.order_number ?? order.id,
      product_name: item.product_name,
      download_link: downloadLink,
      download_expires_at: downloadExpiresAt,
      file_format: digitalProduct.main_file_format || digitalProduct.digital_type || 'digital',
      file_size: fileSizeLabel,
      licensing_type: digitalProduct.license_type,
    },
  });

  return result.ok;
}

async function sendPhysicalEmail(
  supabase: any,
  order: any,
  item: any,
  payload: EmailPayload
): Promise<boolean> {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
  const orderNumber = order.order_number ?? order.id;

  let storeName = 'Boutique';
  if (order.store_id) {
    const { data: storeRow } = await supabase
      .from('stores')
      .select('name')
      .eq('id', order.store_id)
      .maybeSingle();
    if (storeRow?.name) storeName = storeRow.name;
  }

  const shippingAddress = formatShippingAddress(order, item);
  const orderDate = formatOrderDateTime(order.created_at);

  let whatsappLink: string | null = null;
  let customerPortalLink = `${siteUrl.replace(/\/$/, '')}/login?email=${encodeURIComponent(payload.customer_email.trim())}&redirect=${encodeURIComponent('/account/physical')}`;

  try {
    whatsappLink = await resolvePhysicalWhatsAppLink(supabase, {
      productId: item.product_id,
      productName: item.product_name,
      orderNumber,
    });
  } catch (error) {
    console.warn('WhatsApp link resolution failed:', error);
  }

  try {
    customerPortalLink = await resolveCustomerPortalLink(supabase, {
      email: payload.customer_email,
      siteUrl,
      productType: 'physical',
    });
  } catch (error) {
    console.warn('Customer portal link resolution failed:', error);
  }

  const result = await invokeSendEmail(supabase, {
    templateSlug: 'order-confirmation-physical',
    to: payload.customer_email,
    toName: payload.customer_name,
    userId: payload.customer_id,
    productType: 'physical',
    productId: item.product_id,
    productName: item.product_name,
    orderId: order.id,
    storeId: order.store_id,
    variables: {
      user_name: payload.customer_name,
      user_email: payload.customer_email,
      order_id: order.id,
      order_number: orderNumber,
      store_name: storeName,
      product_name: item.product_name,
      order_date: orderDate,
      shipping_address: shippingAddress,
      delivery_date: order.expected_delivery_date || '',
      tracking_number: order.tracking_number,
      tracking_link: order.tracking_link,
      whatsapp_link: whatsappLink,
      customer_portal_link: customerPortalLink,
    },
  });

  return result.ok;
}

async function sendServiceEmail(
  supabase: any,
  order: any,
  item: any,
  payload: EmailPayload
): Promise<boolean> {
  // Récupérer les détails de la réservation
  const bookingDate = item.item_metadata?.booking_date || 'À déterminer';
  const bookingTime = item.item_metadata?.booking_time || 'À déterminer';

  const result = await invokeSendEmail(supabase, {
    templateSlug: 'order-confirmation-service',
    to: payload.customer_email,
    toName: payload.customer_name,
    userId: payload.customer_id,
    productType: 'service',
    productId: item.product_id,
    productName: item.product_name,
    orderId: order.id,
    variables: {
      user_name: payload.customer_name,
      order_id: order.id,
      order_number: order.order_number ?? order.id,
      service_name: item.product_name,
      booking_date: bookingDate,
      booking_time: bookingTime,
      booking_link: item.item_metadata?.booking_link || '#',
      provider_name: item.item_metadata?.provider_name || 'Notre équipe',
    },
  });

  return result.ok;
}

async function sendCourseEmail(
  supabase: any,
  order: any,
  item: any,
  payload: EmailPayload
): Promise<boolean> {
  // Récupérer les détails du cours
  const { data: course } = await supabase
    .from('course_products')
    .select('*, instructor:profiles(*)')
    .eq('product_id', item.product_id)
    .single();

  if (!course) {
    console.warn(`Course not found for product_id: ${item.product_id}`);
    return false;
  }

  const result = await invokeSendEmail(supabase, {
    templateSlug: 'course-enrollment-confirmation',
    to: payload.customer_email,
    toName: payload.customer_name,
    userId: payload.customer_id,
    productType: 'course',
    productId: item.product_id,
    productName: item.product_name,
    variables: {
      user_name: payload.customer_name,
      course_name: item.product_name,
      enrollment_date: new Date().toLocaleDateString('fr-FR'),
      course_link: course.enrollment_url || '#',
      instructor_name: course.instructor?.full_name || 'Notre équipe',
      course_duration: course.duration,
      certificate_available: course.certificate_available || false,
    },
  });

  return result.ok;
}

async function sendArtistEmail(
  supabase: any,
  order: any,
  item: any,
  payload: EmailPayload
): Promise<boolean> {
  // Récupérer les détails de l'œuvre d'artiste
  const { data: artistProduct } = await supabase
    .from('artist_products')
    .select('*, artist:profiles(*)')
    .eq('product_id', item.product_id)
    .single();

  if (!artistProduct) {
    console.warn(`Artist product not found for product_id: ${item.product_id}`);
    return false;
  }

  const result = await invokeSendEmail(supabase, {
    templateSlug: 'order-confirmation-artist',
    to: payload.customer_email,
    toName: payload.customer_name,
    userId: payload.customer_id,
    productType: 'artist',
    productId: item.product_id,
    productName: item.product_name,
    orderId: order.id,
    variables: {
      user_name: payload.customer_name,
      order_id: order.id,
      order_number: order.order_number ?? order.id,
      product_name: item.product_name,
      artist_name: artistProduct.artist?.full_name || artistProduct.artist_name || 'Artiste',
      edition_number: item.item_metadata?.edition_number,
      total_editions: artistProduct.total_editions,
      certificate_available: artistProduct.certificate_available || false,
      authenticity_certificate_link: item.item_metadata?.certificate_link,
      shipping_address: order.shipping_address || 'À déterminer',
      delivery_date: order.expected_delivery_date || 'À déterminer',
      tracking_number: order.tracking_number,
      tracking_link: order.tracking_link,
    },
  });

  return result.ok;
}
