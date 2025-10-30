/**
 * Bibliothèque SendGrid - Email Marketing Universel
 * Date : 27 octobre 2025
 * Supporte: Digital, Physical, Service, Course
 */

import type {
  SendEmailPayload,
  EmailTemplate,
  SendGridEmailRequest,
  SendGridResponse,
} from '@/types/email';
import { supabase } from '@/integrations/supabase/client';

const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

/**
 * Envoyer un email via SendGrid
 */
export const sendEmail = async (payload: SendEmailPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    if (!SENDGRID_API_KEY) {
      console.warn('⚠️  SendGrid API Key non configurée. Email non envoyé.');
      return {
        success: false,
        error: 'SendGrid API Key not configured',
      };
    }

    // 1. Récupérer le template
    const template = await getTemplate(payload.templateSlug, payload.productType);
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${payload.templateSlug}`,
      };
    }

    // 2. Déterminer la langue
    const language = payload.language || (await getUserLanguage(payload.userId)) || 'fr';

    // 3. Remplacer les variables dans le contenu
    const subject = replaceVariables(template.subject[language] || template.subject['fr'], payload.variables);
    const htmlContent = replaceVariables(template.html_content[language] || template.html_content['fr'], payload.variables);

    // 4. Préparer la requête SendGrid
    const sendGridRequest: SendGridEmailRequest = {
      personalizations: [
        {
          to: [{ email: payload.to, name: payload.toName }],
          subject,
          dynamic_template_data: payload.variables,
        },
      ],
      from: {
        email: template.from_email,
        name: template.from_name,
      },
      reply_to: payload.replyTo ? { email: payload.replyTo } : undefined,
      content: [
        {
          type: 'text/html',
          value: htmlContent,
        },
      ],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
      },
      custom_args: {
        template_id: template.id,
        template_slug: template.slug,
        user_id: payload.userId || '',
        product_type: payload.productType || '',
        product_id: payload.productId || '',
        order_id: payload.orderId || '',
      },
    };

    // 5. Envoyer via SendGrid
    const response = await fetch(SENDGRID_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendGridRequest),
    });

    const messageId = response.headers.get('X-Message-Id');

    // 6. Logger l'email
    await logEmail({
      template_id: template.id,
      template_slug: template.slug,
      recipient_email: payload.to,
      recipient_name: payload.toName,
      user_id: payload.userId,
      subject,
      html_content: htmlContent,
      product_type: payload.productType,
      product_id: payload.productId,
      product_name: payload.productName,
      order_id: payload.orderId,
      store_id: payload.storeId,
      variables: payload.variables,
      sendgrid_message_id: messageId || undefined,
      sendgrid_status: response.ok ? 'queued' : 'failed',
      error_message: response.ok ? undefined : await response.text(),
      error_code: response.ok ? undefined : response.status.toString(),
    });

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status} ${await response.text()}`);
    }

    return {
      success: true,
      messageId: messageId || undefined,
    };
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Récupérer un template (avec fallback)
 */
export const getTemplate = async (
  slug: string,
  productType?: string
): Promise<EmailTemplate | null> => {
  try {
    // Essayer d'abord avec le product_type spécifique
    if (productType) {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('slug', slug)
        .eq('product_type', productType)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        return data as EmailTemplate;
      }
    }

    // Fallback : template universel (product_type = null)
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('slug', slug)
      .is('product_type', null)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data as EmailTemplate;
  } catch (error) {
    console.error('Error in getTemplate:', error);
    return null;
  }
};

/**
 * Logger un email envoyé
 */
const logEmail = async (logData: any) => {
  try {
    const { error } = await supabase
      .from('email_logs')
      .insert({
        ...logData,
        sent_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error logging email:', error);
    }
  } catch (error) {
    console.error('Error in logEmail:', error);
  }
};

/**
 * Remplacer les variables dans le contenu
 */
const replaceVariables = (content: string, variables: { [key: string]: any }): string => {
  let result = content;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value || ''));
  });

  return result;
};

/**
 * Récupérer la langue préférée de l'utilisateur
 */
const getUserLanguage = async (userId?: string): Promise<string | null> => {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('email_preferences')
      .select('preferred_language')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    return data.preferred_language;
  } catch (error) {
    return null;
  }
};

// ============================================================
// HELPERS SPÉCIFIQUES PAR TYPE DE PRODUIT
// ============================================================

/**
 * Envoyer email de confirmation - Produit Digital
 */
export const sendDigitalProductConfirmation = async (params: {
  userEmail: string;
  userName: string;
  userId?: string;
  orderId: string;
  productId: string;
  productName: string;
  downloadLink: string;
  fileFormat?: string;
  fileSize?: string;
  licensingType?: 'standard' | 'plr' | 'copyrighted';
  licenseTerms?: string;
}) => {
  return sendEmail({
    templateSlug: 'order-confirmation-digital',
    to: params.userEmail,
    toName: params.userName,
    userId: params.userId,
    productType: 'digital',
    productId: params.productId,
    productName: params.productName,
    orderId: params.orderId,
    variables: {
      user_name: params.userName,
      order_id: params.orderId,
      product_name: params.productName,
      download_link: params.downloadLink,
      file_format: params.fileFormat,
      file_size: params.fileSize,
      licensing_type: params.licensingType,
      license_terms: params.licenseTerms,
    },
  });
};

/**
 * Envoyer email de confirmation - Produit Physique
 */
export const sendPhysicalProductConfirmation = async (params: {
  userEmail: string;
  userName: string;
  userId?: string;
  orderId: string;
  productId: string;
  productName: string;
  shippingAddress: string;
  deliveryDate: string;
  trackingNumber?: string;
  trackingLink?: string;
}) => {
  return sendEmail({
    templateSlug: 'order-confirmation-physical',
    to: params.userEmail,
    toName: params.userName,
    userId: params.userId,
    productType: 'physical',
    productId: params.productId,
    productName: params.productName,
    orderId: params.orderId,
    variables: {
      user_name: params.userName,
      order_id: params.orderId,
      product_name: params.productName,
      shipping_address: params.shippingAddress,
      delivery_date: params.deliveryDate,
      tracking_number: params.trackingNumber,
      tracking_link: params.trackingLink,
    },
  });
};

/**
 * Envoyer email de confirmation - Service
 */
export const sendServiceConfirmation = async (params: {
  userEmail: string;
  userName: string;
  userId?: string;
  orderId: string;
  productId: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  bookingLink?: string;
  providerName?: string;
}) => {
  return sendEmail({
    templateSlug: 'order-confirmation-service',
    to: params.userEmail,
    toName: params.userName,
    userId: params.userId,
    productType: 'service',
    productId: params.productId,
    productName: params.serviceName,
    orderId: params.orderId,
    variables: {
      user_name: params.userName,
      order_id: params.orderId,
      service_name: params.serviceName,
      booking_date: params.bookingDate,
      booking_time: params.bookingTime,
      booking_link: params.bookingLink,
      provider_name: params.providerName,
    },
  });
};

/**
 * Envoyer email d'inscription - Cours
 */
export const sendCourseEnrollmentConfirmation = async (params: {
  userEmail: string;
  userName: string;
  userId?: string;
  courseId: string;
  courseName: string;
  courseLink: string;
  instructorName: string;
  courseDuration?: string;
  certificateAvailable?: boolean;
  licensingType?: 'standard' | 'plr' | 'copyrighted';
  licenseTerms?: string;
}) => {
  return sendEmail({
    templateSlug: 'course-enrollment-confirmation',
    to: params.userEmail,
    toName: params.userName,
    userId: params.userId,
    productType: 'course',
    productId: params.courseId,
    productName: params.courseName,
    variables: {
      user_name: params.userName,
      course_name: params.courseName,
      enrollment_date: new Date().toLocaleDateString('fr-FR'),
      course_link: params.courseLink,
      instructor_name: params.instructorName,
      course_duration: params.courseDuration,
      certificate_available: params.certificateAvailable,
      licensing_type: params.licensingType,
      license_terms: params.licenseTerms,
    },
  });
};

/**
 * Envoyer email de bienvenue (universel)
 */
export const sendWelcomeEmail = async (params: {
  userEmail: string;
  userName: string;
  userId?: string;
}) => {
  return sendEmail({
    templateSlug: 'welcome-user',
    to: params.userEmail,
    toName: params.userName,
    userId: params.userId,
    variables: {
      user_name: params.userName,
      user_email: params.userEmail,
    },
  });
};

