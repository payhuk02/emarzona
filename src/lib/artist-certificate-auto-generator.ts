/**
 * Générateur Automatique de Certificats pour Commandes Artistes
 * Date: 28 Janvier 2025
 * 
 * Génère automatiquement un certificat d'authenticité après confirmation de paiement
 */

import { supabase } from '@/integrations/supabase/client';
import { generateAndUploadCertificate } from '@/lib/artist-certificate-generator';
import { logger } from '@/lib/logger';
import type { ArtistCertificateData } from '@/lib/artist-certificate-generator';

/**
 * Génère un code de vérification unique
 */
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut les caractères ambigus
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Génère automatiquement un certificat pour une commande artiste
 * Appelé après confirmation de paiement
 */
export async function autoGenerateArtistCertificate(
  orderId: string,
  orderItemId: string,
  productId: string,
  artistProductId: string,
  userId: string
): Promise<{ certificateId: string; certificateNumber: string }> {
  try {
    logger.info('Début génération automatique certificat', {
      orderId,
      productId,
      artistProductId,
    });

    // 1. Récupérer les informations de la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error(`Commande non trouvée: ${orderError?.message}`);
    }

    // 2. Récupérer les informations du produit artiste
    const { data: artistProduct, error: artistError } = await supabase
      .from('artist_products')
      .select('*')
      .eq('id', artistProductId)
      .single();

    if (artistError || !artistProduct) {
      throw new Error(`Produit artiste non trouvé: ${artistError?.message}`);
    }

    // 3. Récupérer les informations du produit de base
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new Error(`Produit non trouvé: ${productError?.message}`);
    }

    // 4. Vérifier si un certificat existe déjà
    const { data: existingCertificate } = await supabase
      .from('artist_product_certificates')
      .select('id')
      .eq('order_id', orderId)
      .eq('product_id', productId)
      .single();

    if (existingCertificate) {
      logger.info('Certificat déjà existant, retour de l\'existant', {
        certificateId: existingCertificate.id,
      });
      return {
        certificateId: existingCertificate.id,
        certificateNumber: '', // Sera récupéré si nécessaire
      };
    }

    // 5. Générer le numéro de certificat
    const { data: certNumberData, error: certNumberError } = await supabase.rpc(
      'generate_artist_certificate_number'
    );

    if (certNumberError) {
      // Fallback si la fonction SQL n'existe pas
      const year = new Date().getFullYear();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const certificateNumber = `ART-${year}-${random}`;
      
      logger.warn('Fonction SQL non disponible, utilisation fallback', {
        certificateNumber,
      });
    }

    const certificateNumber = certNumberData || `ART-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 6. Générer le code de vérification
    const verificationCode = generateVerificationCode();

    // 7. Préparer les données du certificat
    const certificateData: ArtistCertificateData = {
      certificateNumber,
      artworkTitle: artistProduct.artwork_title,
      artistName: artistProduct.artist_name,
      artworkMedium: artistProduct.artwork_medium || undefined,
      artworkYear: artistProduct.artwork_year || undefined,
      editionNumber: artistProduct.edition_number || undefined,
      totalEdition: artistProduct.total_editions || undefined,
      signedByArtist: artistProduct.signature_authenticated || false,
      signedDate: artistProduct.signature_authenticated ? new Date().toISOString() : undefined,
      purchaseDate: order.created_at || new Date().toISOString(),
      buyerName: (order.customers as any)?.name || (order.customers as any)?.full_name || 'Client',
      buyerEmail: (order.customers as any)?.email || order.customer_email || undefined,
      certificateType: artistProduct.certificate_of_authenticity 
        ? 'authenticity' 
        : artistProduct.artwork_edition_type === 'limited_edition'
        ? 'limited_edition'
        : 'handmade',
      verificationCode,
    };

    // 8. Générer et uploader le PDF
    const { pdfUrl } = await generateAndUploadCertificate(
      certificateData,
      orderId,
      productId
    );

    // 9. Créer l'enregistrement dans la base de données
    const { data: certificate, error: insertError } = await supabase
      .from('artist_product_certificates')
      .insert({
        order_id: orderId,
        order_item_id: orderItemId,
        product_id: productId,
        artist_product_id: artistProductId,
        user_id: userId,
        certificate_number: certificateNumber,
        certificate_type: certificateData.certificateType,
        edition_number: certificateData.editionNumber,
        total_edition: certificateData.totalEdition,
        signed_by_artist: certificateData.signedByArtist || false,
        signed_date: certificateData.signedDate,
        certificate_pdf_url: pdfUrl,
        artwork_title: certificateData.artworkTitle,
        artist_name: certificateData.artistName,
        artwork_medium: certificateData.artworkMedium,
        artwork_year: certificateData.artworkYear,
        purchase_date: certificateData.purchaseDate,
        buyer_name: certificateData.buyerName,
        buyer_email: certificateData.buyerEmail,
        is_generated: true,
        generated_at: new Date().toISOString(),
        verification_code: verificationCode,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Erreur lors de la création du certificat', {
        error: insertError,
        orderId,
      });
      throw new Error(`Erreur création certificat: ${insertError.message}`);
    }

    logger.info('Certificat généré automatiquement avec succès', {
      certificateId: certificate.id,
      certificateNumber,
      orderId,
    });

    return {
      certificateId: certificate.id,
      certificateNumber: certificate.certificate_number,
    };

  } catch (error) {
    logger.error('Erreur dans autoGenerateArtistCertificate', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
      productId,
      artistProductId,
    });
    throw error;
  }
}

/**
 * Vérifie si un certificat doit être généré pour une commande
 * (vérifie si le produit artiste a certificate_of_authenticity = true)
 */
export async function shouldGenerateCertificate(
  artistProductId: string
): Promise<boolean> {
  try {
    const { data: artistProduct, error } = await supabase
      .from('artist_products')
      .select('certificate_of_authenticity, artwork_edition_type')
      .eq('id', artistProductId)
      .single();

    if (error || !artistProduct) {
      return false;
    }

    // Générer un certificat si:
    // - certificate_of_authenticity est activé
    // - OU c'est une édition limitée
    return (
      artistProduct.certificate_of_authenticity === true ||
      artistProduct.artwork_edition_type === 'limited_edition'
    );
  } catch (error) {
    logger.error('Erreur vérification génération certificat', { error });
    return false;
  }
}

