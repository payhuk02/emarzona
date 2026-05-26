/**
 * Edge Function: Génération automatique de certificats artistes + PDF serveur
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  buildArtistCertificatePdfBytes,
  uploadArtistCertificatePdf,
  type ArtistCertificatePdfInput,
} from '../_shared/artist-certificate-pdf.ts';
import { logArtistFulfillmentEvent } from '../_shared/artist-fulfillment-observability.ts';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-internal-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

interface CertificateGenerationRequest {
  order_id: string;
  order_item_id: string;
  product_id: string;
  artist_product_id: string;
  user_id: string;
}

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ART-${year}-${random}`;
}

function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generatePdfAndUpload(
  supabase: ReturnType<typeof createClient>,
  certificate: {
    id: string;
    order_id: string;
    certificate_number: string;
    certificate_type: string;
    edition_number: number | null;
    total_edition: number | null;
    signed_by_artist: boolean;
    signed_date: string | null;
    artwork_title: string;
    artist_name: string;
    artwork_medium: string | null;
    artwork_year: number | null;
    purchase_date: string;
    buyer_name: string;
    buyer_email: string | null;
    verification_code: string | null;
  }
): Promise<string> {
  const pdfInput: ArtistCertificatePdfInput = {
    certificateNumber: certificate.certificate_number,
    artworkTitle: certificate.artwork_title,
    artistName: certificate.artist_name,
    artworkMedium: certificate.artwork_medium,
    artworkYear: certificate.artwork_year,
    editionNumber: certificate.edition_number,
    totalEdition: certificate.total_edition,
    signedByArtist: certificate.signed_by_artist,
    signedDate: certificate.signed_date,
    purchaseDate: certificate.purchase_date,
    buyerName: certificate.buyer_name,
    buyerEmail: certificate.buyer_email,
    certificateType: certificate.certificate_type as ArtistCertificatePdfInput['certificateType'],
    verificationCode: certificate.verification_code,
  };

  const pdfBytes = await buildArtistCertificatePdfBytes(pdfInput);
  const pdfUrl = await uploadArtistCertificatePdf(
    supabase,
    certificate.order_id,
    certificate.certificate_number,
    pdfBytes
  );

  const { error: updateError } = await supabase
    .from('artist_product_certificates')
    .update({
      certificate_pdf_url: pdfUrl,
      is_generated: true,
      generated_at: new Date().toISOString(),
    })
    .eq('id', certificate.id);

  if (updateError) {
    throw new Error(`Error updating certificate PDF URL: ${updateError.message}`);
  }

  return pdfUrl;
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  let fulfillmentCtx: {
    order_id?: string;
    product_id?: string;
    artist_product_id?: string;
  } = {};

  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const expectedInternalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
    if (!expectedInternalSecret) {
      return new Response(JSON.stringify({ error: 'EDGE_INTERNAL_SECRET is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!internalSecret || internalSecret.trim() !== expectedInternalSecret.trim()) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CertificateGenerationRequest = await req.json();
    const { order_id, order_item_id, product_id, artist_product_id, user_id } = body;
    fulfillmentCtx = { order_id, product_id, artist_product_id };

    if (!order_id || !product_id || !artist_product_id || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingCert } = await supabase
      .from('artist_product_certificates')
      .select('*')
      .eq('order_id', order_id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (existingCert?.certificate_pdf_url && existingCert.is_generated) {
      return new Response(
        JSON.stringify({
          success: true,
          certificate_id: existingCert.id,
          certificate_number: existingCert.certificate_number,
          certificate_pdf_url: existingCert.certificate_pdf_url,
          message: 'Certificat déjà généré',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingCert && !existingCert.certificate_pdf_url) {
      const pdfUrl = await generatePdfAndUpload(supabase, existingCert);
      return new Response(
        JSON.stringify({
          success: true,
          certificate_id: existingCert.id,
          certificate_number: existingCert.certificate_number,
          certificate_pdf_url: pdfUrl,
          message: 'PDF généré pour certificat existant',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [orderResult, artistProductResult, productResult] = await Promise.all([
      supabase
        .from('orders')
        .select('id,created_at,customer_email,customers(name,full_name,email)')
        .eq('id', order_id)
        .single(),
      supabase
        .from('artist_products')
        .select(
          'id,certificate_of_authenticity,artwork_edition_type,edition_number,total_editions,signature_authenticated,artwork_title,artist_name,artwork_medium,artwork_year'
        )
        .eq('id', artist_product_id)
        .single(),
      supabase.from('products').select('id').eq('id', product_id).single(),
    ]);

    if (orderResult.error || !orderResult.data) {
      throw new Error(`Order not found: ${orderResult.error?.message}`);
    }
    if (artistProductResult.error || !artistProductResult.data) {
      throw new Error(`Artist product not found: ${artistProductResult.error?.message}`);
    }
    if (productResult.error || !productResult.data) {
      throw new Error(`Product not found: ${productResult.error?.message}`);
    }

    const order = orderResult.data;
    const artistProduct = artistProductResult.data;

    const shouldGenerate =
      artistProduct.certificate_of_authenticity === true ||
      artistProduct.artwork_edition_type === 'limited_edition';

    if (!shouldGenerate) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Certificat non requis pour ce produit',
          certificate_generated: false,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customer = order.customers as {
      name?: string;
      full_name?: string;
      email?: string;
    } | null;
    const certificateNumber = generateCertificateNumber();
    const verificationCode = generateVerificationCode();

    const certificateType = artistProduct.certificate_of_authenticity
      ? 'authenticity'
      : artistProduct.artwork_edition_type === 'limited_edition'
        ? 'limited_edition'
        : 'handmade';

    const certificateData = {
      order_id,
      order_item_id: order_item_id || null,
      product_id,
      artist_product_id,
      user_id,
      certificate_number: certificateNumber,
      certificate_type: certificateType,
      edition_number: artistProduct.edition_number || null,
      total_edition: artistProduct.total_editions || null,
      signed_by_artist: artistProduct.signature_authenticated || false,
      signed_date: artistProduct.signature_authenticated
        ? new Date().toISOString().slice(0, 10)
        : null,
      artwork_title: artistProduct.artwork_title,
      artist_name: artistProduct.artist_name,
      artwork_medium: artistProduct.artwork_medium || null,
      artwork_year: artistProduct.artwork_year || null,
      purchase_date: (order.created_at || new Date().toISOString()).slice(0, 10),
      buyer_name: customer?.name || customer?.full_name || 'Client',
      buyer_email: customer?.email || order.customer_email || null,
      is_generated: false,
      is_public: true,
      verification_code: verificationCode,
    };

    const { data: certificate, error: insertError } = await supabase
      .from('artist_product_certificates')
      .insert(certificateData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error creating certificate: ${insertError.message}`);
    }

    const pdfUrl = await generatePdfAndUpload(supabase, certificate);

    await logArtistFulfillmentEvent(supabase, {
      event_type: 'certificate.pdf_ready',
      severity: 'info',
      order_id,
      product_id,
      artist_product_id,
      metadata: { certificate_id: certificate.id, certificate_number: certificateNumber },
    });

    return new Response(
      JSON.stringify({
        success: true,
        certificate_id: certificate.id,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        certificate_pdf_url: pdfUrl,
        message: 'Certificat créé et PDF généré avec succès',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-artist-certificate:', error);
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await logArtistFulfillmentEvent(supabase, {
        event_type: 'certificate.edge_error',
        severity: 'error',
        order_id: fulfillmentCtx.order_id,
        product_id: fulfillmentCtx.product_id,
        artist_product_id: fulfillmentCtx.artist_product_id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
