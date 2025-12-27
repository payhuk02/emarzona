/**
 * Générateur de Certificats PDF pour Produits Artistes
 * Date: 28 Janvier 2025
 * 
 * Génère des certificats d'authenticité professionnels en PDF
 */

import { loadPDFModules } from '@/lib/pdf-loader';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ArtistCertificateData {
  certificateNumber: string;
  artworkTitle: string;
  artistName: string;
  artworkMedium?: string;
  artworkYear?: number;
  editionNumber?: number;
  totalEdition?: number;
  signedByArtist?: boolean;
  signedDate?: string;
  purchaseDate: string;
  buyerName: string;
  buyerEmail?: string;
  certificateType: 'authenticity' | 'limited_edition' | 'handmade';
  verificationCode?: string;
}

/**
 * Charge une image depuis une URL
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Génère un certificat PDF professionnel pour un produit artiste
 */
export async function generateArtistCertificatePDF(
  data: ArtistCertificateData
): Promise<Blob> {
  try {
    const { jsPDF } = await loadPDFModules();
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Couleurs
    const primaryColor = [60, 60, 60];
    const accentColor = [139, 92, 246]; // Violet
    const textColor = [75, 85, 99];
    
    // ================================================================
    // FOND DÉCORATIF
    // ================================================================
    
    // Bordure décorative
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(2);
    doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);
    
    // Ligne décorative en haut
    doc.setFillColor(...accentColor);
    doc.rect(margin, margin, pageWidth - 2 * margin, 3, 'F');
    
    // ================================================================
    // EN-TÊTE
    // ================================================================
    
    let  yPosition= margin + 15;
    
    // Titre principal
    doc.setFontSize(32);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    const titleText = 'CERTIFICAT D\'AUTHENTICITÉ';
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, (pageWidth - titleWidth) / 2, yPosition);
    
    yPosition += 10;
    
    // Sous-titre
    doc.setFontSize(14);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    const subtitleText = 'Certificat d\'Authenticité et de Propriété';
    const subtitleWidth = doc.getTextWidth(subtitleText);
    doc.text(subtitleText, (pageWidth - subtitleWidth) / 2, yPosition);
    
    yPosition += 20;
    
    // ================================================================
    // CONTENU PRINCIPAL
    // ================================================================
    
    // Séparateur
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(margin + 10, yPosition, pageWidth - margin - 10, yPosition);
    yPosition += 15;
    
    // Texte d'introduction
    doc.setFontSize(11);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    const introText = 'Le présent certificat atteste que l\'œuvre décrite ci-dessous est authentique et provient directement de l\'artiste.';
    doc.text(introText, margin + 10, yPosition, {
      maxWidth: pageWidth - 2 * margin - 20,
      align: 'justify',
    });
    
    yPosition += 20;
    
    // ================================================================
    // INFORMATIONS ŒUVRE
    // ================================================================
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('INFORMATIONS SUR L\'ŒUVRE', margin + 10, yPosition);
    
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    
    const artworkInfo = [
      ['Titre de l\'œuvre', data.artworkTitle],
      ['Artiste', data.artistName],
      ...(data.artworkMedium ? [['Médium', data.artworkMedium]] : []),
      ...(data.artworkYear ? [['Année', data.artworkYear.toString()]] : []),
      ...(data.editionNumber && data.totalEdition 
        ? [['Édition', `${data.editionNumber} / ${data.totalEdition}`]]
        : []),
    ];
    
    artworkInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin + 15, yPosition);
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(`${label}:`);
      doc.text(value, margin + 15 + labelWidth + 5, yPosition);
      yPosition += 7;
    });
    
    yPosition += 10;
    
    // ================================================================
    // INFORMATIONS ACHETEUR
    // ================================================================
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('INFORMATIONS SUR L\'ACHETEUR', margin + 10, yPosition);
    
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    
    const buyerInfo = [
      ['Nom', data.buyerName],
      ...(data.buyerEmail ? [['Email', data.buyerEmail]] : []),
      ['Date d\'achat', format(new Date(data.purchaseDate), 'dd MMMM yyyy', { locale: fr })],
    ];
    
    buyerInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin + 15, yPosition);
      doc.setFont('helvetica', 'normal');
      const labelWidth = doc.getTextWidth(`${label}:`);
      doc.text(value, margin + 15 + labelWidth + 5, yPosition);
      yPosition += 7;
    });
    
    yPosition += 10;
    
    // ================================================================
    // SIGNATURE ARTISTE
    // ================================================================
    
    if (data.signedByArtist) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('SIGNATURE DE L\'ARTISTE', margin + 10, yPosition);
      
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.text('✓ Cette œuvre est signée par l\'artiste', margin + 15, yPosition);
      
      if (data.signedDate) {
        yPosition += 6;
        doc.text(`Date de signature: ${format(new Date(data.signedDate), 'dd MMMM yyyy', { locale: fr })}`, margin + 15, yPosition);
      }
      
      yPosition += 15;
    }
    
    // ================================================================
    // NUMÉRO DE CERTIFICAT
    // ================================================================
    
    yPosition = pageHeight - margin - 40;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Numéro de Certificat:', margin + 10, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(...accentColor);
    const certNumWidth = doc.getTextWidth(data.certificateNumber);
    doc.text(data.certificateNumber, margin + 10, yPosition + 5);
    
    // Code de vérification si disponible
    if (data.verificationCode) {
      yPosition += 10;
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      doc.text(`Code de vérification: ${data.verificationCode}`, margin + 10, yPosition);
    }
    
    // ================================================================
    // PIED DE PAGE
    // ================================================================
    
    yPosition = pageHeight - margin - 15;
    
    doc.setFontSize(8);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'italic');
    const footerText = 'Ce certificat est un document officiel. En cas de doute, contactez le vendeur.';
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, yPosition);
    
    // ================================================================
    // GÉNÉRATION DU BLOB
    // ================================================================
    
    const pdfBlob = doc.output('blob');
    logger.info('Certificat PDF généré avec succès', {
      certificateNumber: data.certificateNumber,
      size: pdfBlob.size,
    });
    
    return pdfBlob;
    
  } catch (error) {
    logger.error('Erreur lors de la génération du certificat PDF', {
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}

/**
 * Génère un certificat et l'upload dans Supabase Storage
 */
export async function generateAndUploadCertificate(
  data: ArtistCertificateData,
  orderId: string,
  productId: string
): Promise<{ pdfUrl: string; imageUrl?: string }> {
  try {
    // Générer le PDF
    const pdfBlob = await generateArtistCertificatePDF(data);
    
    // Upload vers Supabase Storage
    const { supabase } = await import('@/integrations/supabase/client');
    
    const fileName = `certificate-${data.certificateNumber}-${Date.now()}.pdf`;
    const filePath = `artist-certificates/${orderId}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-files')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false,
      });
    
    if (uploadError) {
      throw new Error(`Erreur upload PDF: ${uploadError.message}`);
    }
    
    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('product-files')
      .getPublicUrl(filePath);
    
    const pdfUrl = urlData.publicUrl;
    
    logger.info('Certificat uploadé avec succès', {
      certificateNumber: data.certificateNumber,
      pdfUrl,
    });
    
    return { pdfUrl };
    
  } catch (error) {
    logger.error('Erreur lors de la génération et upload du certificat', {
      error: error instanceof Error ? error.message : String(error),
      data,
    });
    throw error;
  }
}







