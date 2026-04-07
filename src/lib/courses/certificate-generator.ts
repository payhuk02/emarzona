/**
 * Générateur de Certificats de Cours avec PDF
 * Date: 3 Février 2025
 *
 * Génération PDF professionnelle avec templates personnalisables
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import jsPDF from 'jspdf';

// =====================================================
// TYPES
// =====================================================

export interface CertificateTemplate {
  id: string;
  template_name: string;
  template_type: 'classic' | 'modern' | 'elegant' | 'minimalist' | 'professional' | 'custom';
  design_config: {
    background_color: string;
    border_color: string;
    border_width: number;
    border_style: string;
    text_color: string;
    accent_color: string;
    logo_url?: string;
    watermark: string;
    font_family: string;
    title_font_size: number;
    name_font_size: number;
    body_font_size: number;
  };
  show_student_name: boolean;
  show_course_name: boolean;
  show_completion_date: boolean;
  show_certificate_number: boolean;
  show_instructor_name: boolean;
  show_final_score: boolean;
  show_duration: boolean;
  show_verification_code: boolean;
  header_text: string;
  subheader_text: string;
  body_text: string;
  footer_text?: string;
  show_signature: boolean;
  signature_name?: string;
  signature_title?: string;
  signature_image_url?: string;
}

export interface CertificateData {
  student_name: string;
  course_name: string;
  completion_date: string;
  certificate_number: string;
  instructor_name: string;
  final_score?: number;
  duration_minutes?: number;
  verification_code?: string;
}

// =====================================================
// FONCTIONS
// =====================================================

/**
 * Récupère le template de certificat pour un cours
 */
export async function getCertificateTemplate(
  courseId: string,
  storeId: string
): Promise<CertificateTemplate | null> {
  // Chercher template spécifique au cours
  const { data: courseTemplate } = await supabase
    .from('course_certificate_templates')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_active', true)
    .maybeSingle();

  if (courseTemplate) {
    return courseTemplate as CertificateTemplate;
  }

  // Chercher template par défaut du store
  const { data: defaultTemplate } = await supabase
    .from('course_certificate_templates')
    .select('*')
    .eq('store_id', storeId)
    .is('course_id', null)
    .eq('is_default', true)
    .eq('is_active', true)
    .maybeSingle();

  if (defaultTemplate) {
    return defaultTemplate as CertificateTemplate;
  }

  // Retourner template par défaut système
  return getDefaultTemplate();
}

/**
 * Template par défaut
 */
function getDefaultTemplate(): CertificateTemplate {
  return {
    id: 'default',
    template_name: 'Template Classique',
    template_type: 'classic',
    design_config: {
      background_color: '#FFFFFF',
      border_color: '#F97316',
      border_width: 8,
      border_style: 'double',
      text_color: '#1F2937',
      accent_color: '#F97316',
      watermark: 'Emarzona Academy',
      font_family: 'Arial',
      title_font_size: 48,
      name_font_size: 36,
      body_font_size: 18,
    },
    show_student_name: true,
    show_course_name: true,
    show_completion_date: true,
    show_certificate_number: true,
    show_instructor_name: true,
    show_final_score: false,
    show_duration: false,
    show_verification_code: true,
    header_text: 'CERTIFICAT',
    subheader_text: 'de Réussite',
    body_text: 'Ceci certifie que {student_name} a terminé avec succès le cours {course_name}',
    show_signature: true,
    signature_name: 'Emarzona Academy',
    signature_title: 'Instructeur',
  };
}

/**
 * Génère un PDF de certificat
 */
export async function generateCertificatePDF(
  template: CertificateTemplate,
  data: CertificateData
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const config = template.design_config;

  // Couleur de fond
  doc.setFillColor(config.background_color);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Bordure décorative
  doc.setDrawColor(config.border_color);
  doc.setLineWidth(config.border_width);
  doc.rect(margin, margin, contentWidth, contentHeight);

  // Bordure intérieure
  doc.setLineWidth(2);
  doc.rect(margin + 10, margin + 10, contentWidth - 20, contentHeight - 20);

  // Logo (si disponible)
  if (config.logo_url) {
    try {
      const img = await loadImage(config.logo_url);
      const logoSize = 40;
      doc.addImage(img, 'PNG', pageWidth / 2 - logoSize / 2, margin + 20, logoSize, logoSize);
    } catch (error) {
      logger.warn('Error loading logo', { error, logoUrl: config.logo_url });
    }
  }

  // Titre
  doc.setFontSize(config.title_font_size);
  doc.setTextColor(config.text_color);
  doc.setFont(config.font_family, 'bold');
  doc.text(template.header_text, pageWidth / 2, margin + 60, { align: 'center' });

  // Sous-titre
  doc.setFontSize(config.body_font_size);
  doc.setFont(config.font_family, 'normal');
  doc.setTextColor(config.accent_color);
  doc.text(template.subheader_text, pageWidth / 2, margin + 75, { align: 'center' });

  // Texte principal
  doc.setFontSize(config.body_font_size);
  doc.setTextColor(config.text_color);
  doc.setFont(config.font_family, 'normal');

  const bodyText = template.body_text
    .replace('{student_name}', data.student_name)
    .replace('{course_name}', data.course_name);

  const splitBody = doc.splitTextToSize(bodyText, contentWidth - 40);
  let  yPos= margin + 100;

  splitBody.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  });

  // Nom de l'étudiant (si activé)
  if (template.show_student_name) {
    yPos += 10;
    doc.setFontSize(config.name_font_size);
    doc.setFont(config.font_family, 'bold');
    doc.setTextColor(config.accent_color);
    doc.text(data.student_name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.setDrawColor(config.accent_color);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 60, yPos, pageWidth / 2 + 60, yPos);
  }

  // Nom du cours (si activé)
  if (template.show_course_name) {
    yPos += 20;
    doc.setFontSize(config.body_font_size + 4);
    doc.setFont(config.font_family, 'bold');
    doc.setTextColor(config.text_color);
    doc.text(data.course_name, pageWidth / 2, yPos, { align: 'center' });
  }

  // Informations supplémentaires
  yPos = pageHeight - margin - 60;
  const infoY = yPos;

  if (template.show_completion_date) {
    const dateText = `Date: ${new Date(data.completion_date).toLocaleDateString('fr-FR')}`;
    doc.setFontSize(12);
    doc.setFont(config.font_family, 'normal');
    doc.text(dateText, margin + 20, infoY);
  }

  if (template.show_certificate_number) {
    const certText = `N°: ${data.certificate_number}`;
    doc.text(certText, pageWidth - margin - 20, infoY, { align: 'right' });
  }

  if (template.show_verification_code && data.verification_code) {
    const verifyText = `Code: ${data.verification_code}`;
    doc.setFontSize(10);
    doc.setTextColor('#666666');
    doc.text(verifyText, pageWidth / 2, infoY + 10, { align: 'center' });
  }

  // Signature
  if (template.show_signature) {
    const signatureY = pageHeight - margin - 30;

    if (template.signature_image_url) {
      try {
        const sigImg = await loadImage(template.signature_image_url);
        doc.addImage(sigImg, 'PNG', margin + 20, signatureY - 20, 40, 20);
      } catch (error) {
        logger.warn('Error loading signature image', { error });
      }
    }

    doc.setFontSize(12);
    doc.setFont(config.font_family, 'bold');
    doc.setTextColor(config.text_color);
    doc.line(margin + 20, signatureY, margin + 80, signatureY);
    doc.text(template.signature_name || 'Emarzona Academy', margin + 50, signatureY + 8, {
      align: 'center',
    });

    if (template.signature_title) {
      doc.setFontSize(10);
      doc.setFont(config.font_family, 'normal');
      doc.setTextColor('#666666');
      doc.text(template.signature_title, margin + 50, signatureY + 15, { align: 'center' });
    }
  }

  // Watermark
  doc.setFontSize(10);
  doc.setTextColor('#E5E7EB');
  doc.setFont(config.font_family, 'italic');
  doc.text(config.watermark, pageWidth / 2, pageHeight - margin - 10, { align: 'center' });

  // Générer le blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Charge une image depuis une URL
 */
function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Upload le PDF vers Supabase Storage
 */
export async function uploadCertificatePDF(certificateId: string, pdfBlob: Blob): Promise<string> {
  const fileName = `certificate-${certificateId}.pdf`;
  const filePath = `course-certificates/${fileName}`;

  const { data, error } = await supabase.storage.from('certificates').upload(filePath, pdfBlob, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (error) {
    logger.error('Error uploading certificate PDF', { error, certificateId });
    throw error;
  }

  // Récupérer l'URL publique
  const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Génère et upload un certificat complet
 */
export async function generateAndUploadCertificate(
  certificateId: string,
  courseId: string,
  storeId: string,
  data: CertificateData
): Promise<{ pdfUrl: string; imageUrl?: string }> {
  // Récupérer le template
  const template = await getCertificateTemplate(courseId, storeId);
  if (!template) {
    throw new Error('No certificate template found');
  }

  // Générer le PDF
  const pdfBlob = await generateCertificatePDF(template, data);

  // Upload le PDF
  const pdfUrl = await uploadCertificatePDF(certificateId, pdfBlob);

  // Mettre à jour le certificat dans la base
  await supabase
    .from('course_certificates')
    .update({
      certificate_url: pdfUrl,
      certificate_pdf_url: pdfUrl,
    })
    .eq('id', certificateId);

  return { pdfUrl };
}







