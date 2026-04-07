/**
 * Bibliothèque SendGrid - Email Marketing Universel
 * Date : 27 octobre 2025
 * Supporte: Digital, Physical, Service, Course, Artist
 */

import type {
  SendEmailPayload,
  EmailTemplate,
  SendGridEmailRequest,
  SendGridResponse,
} from '@/types/email';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { emailRateLimiter } from '@/lib/email/email-rate-limiter';
import { emailRetryService } from '@/lib/email/email-retry-service';

const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';

/**
 * Envoyer un email via SendGrid (fonction interne avec retry)
 */
const sendEmailInternal = async (payload: SendEmailPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  const startTime = Date.now();

  if (!SENDGRID_API_KEY) {
    logger.warn('SendGrid API Key non configurée. Email non envoyé.', {
      payload: { to: payload.to, subject: payload.subject },
    });
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
  const  sendGridRequest: SendGridEmailRequest = {
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
  const processingTime = Date.now() - startTime;

  // 6. Logger l'email (même en cas d'erreur)
  const errorText = response.ok ? undefined : await response.text();
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
    error_message: errorText,
    error_code: response.ok ? undefined : response.status.toString(),
    processing_time_ms: processingTime,
  });

  if (!response.ok) {
    const error = new Error(`SendGrid API error: ${response.status} ${errorText}`);
    (error as any).statusCode = response.status;
    throw error;
  }

  return {
    success: true,
    messageId: messageId || undefined,
  };
};

/**
 * Envoyer un email via SendGrid avec rate limiting et retry automatique
 */
export const sendEmail = async (payload: SendEmailPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  try {
    // Utiliser le rate limiter pour gérer la queue
    const result = await emailRateLimiter.enqueue(
      async () => {
        // Utiliser le retry service pour gérer les retries
        const retryResult = await emailRetryService.executeWithRetry(
          () => sendEmailInternal(payload),
          {
            maxRetries: 3,
            initialDelay: 1000,
            maxDelay: 30000,
            multiplier: 2,
            jitter: true,
          }
        );

        if (!retryResult.success) {
          throw retryResult.error || new Error('Failed to send email after retries');
        }

        return retryResult.result;
      },
      3 // maxRetries pour le rate limiter
    );

    return result;
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue lors de l\'envoi de l\'email';
    logger.error('Error sending email', {
      error: errorMessage,
      payload: { to: payload.to, subject: payload.subject },
    });
    return {
      success: false,
      error: errorMessage,
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
      logger.error('Error fetching template', {
        error: error.message,
        slug,
        productType,
      });
      return null;
    }

    return data as EmailTemplate;
  } catch (error) {
    logger.error('Error in getTemplate', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      productType,
    });
    return null;
  }
};

/**
 * Interface pour les données de log d'email
 */
interface EmailLogData {
  template_id?: string;
  template_slug: string;
  recipient_email: string;
  recipient_name?: string;
  user_id?: string;
  subject: string;
  html_content?: string;
  product_type?: string;
  product_id?: string;
  product_name?: string;
  order_id?: string;
  store_id?: string;
  variables?: Record<string, string | number | boolean | null | undefined>;
  sendgrid_message_id?: string;
  sendgrid_status?: string;
  error_message?: string;
  error_code?: string;
  processing_time_ms?: number;
  attempt_number?: number;
  retry_count?: number;
}

/**
 * Logger un email envoyé
 */
const logEmail = async (logData: EmailLogData) => {
  try {
    const { error } = await supabase
      .from('email_logs')
      .insert({
        ...logData,
        sent_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Error logging email', {
        error: error.message,
        emailData: { 
          to: logData.recipient_email, 
          subject: logData.subject, 
          templateId: logData.template_id 
        },
      });
    }
  } catch (error) {
    logger.error('Error in logEmail', {
      error: error instanceof Error ? error.message : String(error),
      emailData: { 
        to: logData.recipient_email, 
        subject: logData.subject, 
        templateId: logData.template_id 
      },
    });
  }
};

/**
 * Remplacer les variables dans le contenu
 */
const replaceVariables = (content: string, variables: Record<string, string | number | boolean | null | undefined>): string => {
  let  result= content;

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
 * Envoyer email de confirmation - Œuvre d'Artiste
 */
export const sendArtistProductConfirmation = async (params: {
  userEmail: string;
  userName: string;
  userId?: string;
  orderId: string;
  productId: string;
  productName: string;
  artistName: string;
  editionNumber?: string;
  totalEditions?: number;
  certificateAvailable: boolean;
  authenticityCertificateLink?: string;
  shippingAddress?: string;
  deliveryDate?: string;
  trackingNumber?: string;
  trackingLink?: string;
}) => {
  return sendEmail({
    templateSlug: 'order-confirmation-artist',
    to: params.userEmail,
    toName: params.userName,
    userId: params.userId,
    productType: 'artist',
    productId: params.productId,
    productName: params.productName,
    orderId: params.orderId,
    variables: {
      user_name: params.userName,
      order_id: params.orderId,
      product_name: params.productName,
      artist_name: params.artistName,
      edition_number: params.editionNumber,
      total_editions: params.totalEditions,
      certificate_available: params.certificateAvailable,
      authenticity_certificate_link: params.authenticityCertificateLink,
      shipping_address: params.shippingAddress,
      delivery_date: params.deliveryDate,
      tracking_number: params.trackingNumber,
      tracking_link: params.trackingLink,
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

/**
 * Envoyer email de mise à jour de tracking
 */
export const sendTrackingUpdateEmail = async (params: {
  userEmail: string;
  userName: string;
  userId?: string;
  orderId: string;
  trackingNumber: string;
  trackingUrl?: string;
  status: string;
  carrierName?: string;
  estimatedDelivery?: string;
  latestEvent?: {
    description: string;
    location?: string;
    timestamp: string;
  };
}) => {
  // Déterminer le template selon le statut
  let  templateSlug= 'shipment-tracking-update';
  
  if (params.status === 'delivered') {
    templateSlug = 'shipment-delivered';
  } else if (params.status === 'out_for_delivery') {
    templateSlug = 'shipment-out-for-delivery';
  }

  return sendEmail({
    templateSlug,
    to: params.userEmail,
    toName: params.userName,
    userId: params.userId,
    orderId: params.orderId,
    productType: 'physical', // Tracking concerne principalement les produits physiques
    variables: {
      user_name: params.userName,
      order_id: params.orderId,
      tracking_number: params.trackingNumber,
      tracking_url: params.trackingUrl || `https://tracking.example.com/${params.trackingNumber}`,
      status: params.status,
      carrier_name: params.carrierName || 'Transporteur',
      estimated_delivery: params.estimatedDelivery,
      latest_event_description: params.latestEvent?.description,
      latest_event_location: params.latestEvent?.location,
      latest_event_timestamp: params.latestEvent?.timestamp 
        ? new Date(params.latestEvent.timestamp).toLocaleString('fr-FR')
        : undefined,
    },
  });
};







