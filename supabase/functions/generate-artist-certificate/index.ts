/**
 * Edge Function: Génération Automatique de Certificats Artistes
 * Date: 28 Janvier 2025
 *
 * Déclenchée automatiquement après confirmation de paiement
 * pour générer les certificats d'authenticité
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CertificateGenerationRequest {
  order_id: string;
  order_item_id: string;
  product_id: string;
  artist_product_id: string;
  user_id: string;
}

serve(async req => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer les headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Créer le client Supabase avec service_role pour bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parser le body
    const body: CertificateGenerationRequest = await req.json();
    const { order_id, order_item_id, product_id, artist_product_id, user_id } = body;

    if (!order_id || !product_id || !artist_product_id || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Vérifier si un certificat existe déjà
    const { data: existingCert } = await supabase
      .from('artist_product_certificates')
      .select('id, certificate_number')
      .eq('order_id', order_id)
      .eq('product_id', product_id)
      .single();

    if (existingCert) {
      return new Response(
        JSON.stringify({
          success: true,
          certificate_id: existingCert.id,
          certificate_number: existingCert.certificate_number,
          message: 'Certificat déjà existant',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les informations nécessaires
    const [orderResult, artistProductResult, productResult] = await Promise.all([
      supabase.from('orders').select('*, customers(*)').eq('id', order_id).single(),
      supabase.from('artist_products').select('*').eq('id', artist_product_id).single(),
      supabase.from('products').select('*').eq('id', product_id).single(),
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
    const product = productResult.data;

    // Vérifier si un certificat doit être généré
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

    // Générer le numéro de certificat
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const certificateNumber = `ART-${year}-${random}`;

    // Générer le code de vérification
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let verificationCode = '';
    for (let i = 0; i < 8; i++) {
      verificationCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Préparer les données
    const customer = order.customers as any;
    const certificateData = {
      order_id,
      order_item_id,
      product_id,
      artist_product_id,
      user_id,
      certificate_number: certificateNumber,
      certificate_type: artistProduct.certificate_of_authenticity
        ? 'authenticity'
        : artistProduct.artwork_edition_type === 'limited_edition'
          ? 'limited_edition'
          : 'handmade',
      edition_number: artistProduct.edition_number || null,
      total_edition: artistProduct.total_editions || null,
      signed_by_artist: artistProduct.signature_authenticated || false,
      signed_date: artistProduct.signature_authenticated ? new Date().toISOString() : null,
      artwork_title: artistProduct.artwork_title,
      artist_name: artistProduct.artist_name,
      artwork_medium: artistProduct.artwork_medium || null,
      artwork_year: artistProduct.artwork_year || null,
      purchase_date: order.created_at || new Date().toISOString(),
      buyer_name: customer?.name || customer?.full_name || 'Client',
      buyer_email: customer?.email || order.customer_email || null,
      is_generated: false, // Sera mis à jour après génération PDF
      verification_code: verificationCode,
    };

    // Créer l'enregistrement (sans PDF pour l'instant)
    const { data: certificate, error: insertError } = await supabase
      .from('artist_product_certificates')
      .insert(certificateData)
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error creating certificate: ${insertError.message}`);
    }

    // Note: La génération du PDF se fera côté client ou via une autre Edge Function
    // car jsPDF nécessite le navigateur. Pour l'instant, on crée juste l'enregistrement.
    // Le PDF sera généré lors du premier téléchargement ou via un webhook.

    return new Response(
      JSON.stringify({
        success: true,
        certificate_id: certificate.id,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        message: 'Certificat créé avec succès. Le PDF sera généré lors du premier téléchargement.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-artist-certificate:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
