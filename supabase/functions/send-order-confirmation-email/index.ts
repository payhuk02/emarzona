import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  order_id: string;
  customer_email: string;
  customer_name: string;
  customer_id?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: EmailPayload = await req.json();

    if (!payload.order_id || !payload.customer_email) {
      return new Response(
        JSON.stringify({ error: 'order_id and customer_email are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing order confirmation emails for order ${payload.order_id}...`);

    // Récupérer la commande avec tous les détails
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
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
      `)
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

    // Grouper les items par type de produit
    const itemsByType: Record<string, typeof order.order_items> = {};
    
    (order.order_items || []).forEach((item: any) => {
      const productType = item.product_type || 'generic';
      if (!itemsByType[productType]) {
        itemsByType[productType] = [];
      }
      itemsByType[productType].push(item);
    });

    const emailResults = [];

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
              console.log(`Skipping email for product type: ${productType}`);
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

    return new Response(
      JSON.stringify({
        success: true,
        orderId: payload.order_id,
        emailsSent: emailResults.filter((r) => r.emailSent).length,
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
async function sendDigitalEmail(supabase: any, order: any, item: any, payload: EmailPayload): Promise<boolean> {
  // Récupérer les détails du produit digital
  const { data: digitalProduct } = await supabase
    .from('digital_products')
    .select('*, license:digital_licenses(*)')
    .eq('product_id', item.product_id)
    .single();

  if (!digitalProduct) {
    console.warn(`Digital product not found for product_id: ${item.product_id}`);
    return false;
  }

  // Récupérer le template depuis la base de données
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('slug', 'order-confirmation-digital')
    .eq('is_active', true)
    .single();

  if (!template) {
    console.warn('Template order-confirmation-digital not found');
    return false;
  }

  // Envoyer l'email via SendGrid directement
  return await sendEmailViaSendGrid(
    supabase,
    { email: payload.customer_email, name: payload.customer_name },
    template,
    {
      user_name: payload.customer_name,
      order_id: order.id,
      product_name: item.product_name,
      download_link: digitalProduct.download_url || '#',
      file_format: digitalProduct.file_format,
      file_size: digitalProduct.file_size,
      licensing_type: digitalProduct.license_type,
    },
    'digital',
    item.product_id,
    order.id
  );
}

async function sendPhysicalEmail(supabase: any, order: any, item: any, payload: EmailPayload): Promise<boolean> {
  // Récupérer l'adresse de livraison
  const shippingAddress = order.shipping_address || order.customer?.address || 'Non spécifiée';

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      templateSlug: 'order-confirmation-physical',
      to: payload.customer_email,
      toName: payload.customer_name,
      userId: payload.customer_id,
      productType: 'physical',
      productId: item.product_id,
      productName: item.product_name,
      orderId: order.id,
      variables: {
        user_name: payload.customer_name,
        order_id: order.id,
        product_name: item.product_name,
        shipping_address: shippingAddress,
        delivery_date: order.expected_delivery_date || 'À déterminer',
        tracking_number: order.tracking_number,
        tracking_link: order.tracking_link,
      },
    },
  });

  return !error;
}

async function sendServiceEmail(supabase: any, order: any, item: any, payload: EmailPayload): Promise<boolean> {
  // Récupérer les détails de la réservation
  const bookingDate = item.item_metadata?.booking_date || 'À déterminer';
  const bookingTime = item.item_metadata?.booking_time || 'À déterminer';

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
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
        service_name: item.product_name,
        booking_date: bookingDate,
        booking_time: bookingTime,
        booking_link: item.item_metadata?.booking_link || '#',
        provider_name: item.item_metadata?.provider_name || 'Notre équipe',
      },
    },
  });

  return !error;
}

async function sendCourseEmail(supabase: any, order: any, item: any, payload: EmailPayload): Promise<boolean> {
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

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
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
    },
  });

  return !error;
}

async function sendArtistEmail(supabase: any, order: any, item: any, payload: EmailPayload): Promise<boolean> {
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

  const { error } = await supabase.functions.invoke('send-email', {
    body: {
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
    },
  });

  return !error;
}

