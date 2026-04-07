/**
 * Système de Notifications pour Réservations de Services
 * Date: 3 Février 2025
 * 
 * SMS, notifications push, rappels automatiques
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { sendUnifiedNotification } from './unified-notifications';

// =====================================================
// TYPES
// =====================================================

export interface BookingNotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  
  // Timing des rappels
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;
  reminder_30min_enabled: boolean;
  
  // Types de notifications
  confirmation_enabled: boolean;
  reminder_enabled: boolean;
  cancellation_enabled: boolean;
  reschedule_enabled: boolean;
  completion_enabled: boolean;
}

export interface BookingNotificationData {
  booking_id: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  booking_end_time?: string;
  location?: string;
  staff_name?: string;
  meeting_url?: string;
  cancellation_reason?: string;
  reschedule_date?: string;
  reschedule_time?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: 'email' | 'sms' | 'push' | 'in_app';
  sent_at?: string;
  error?: string;
}

// =====================================================
// FONCTIONS DE NOTIFICATION
// =====================================================

/**
 * Envoie une notification SMS pour une réservation
 */
export async function sendBookingSMS(
  phoneNumber: string,
  data: BookingNotificationData,
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule'
): Promise<NotificationResult> {
  try {
    // Récupérer les templates SMS depuis la base de données ou utiliser des templates par défaut
    const message = getSMSTemplate(type, data);
    
    // Appeler une Edge Function ou API externe pour envoyer le SMS
    // Pour l'instant, on utilise une Edge Function Supabase
    const { data: result, error } = await supabase.functions.invoke('send-sms', {
      body: {
        to: phoneNumber,
        message,
        type: 'booking_notification',
      },
    });
    
    if (error) {
      logger.error('Error sending SMS', { error, phoneNumber, type });
      return {
        success: false,
        channel: 'sms',
        error: error.message,
      };
    }
    
    return {
      success: true,
      channel: 'sms',
      sent_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error sending booking SMS', { error, phoneNumber, type });
    return {
      success: false,
      channel: 'sms',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Envoie une notification push pour une réservation
 */
export async function sendBookingPush(
  userId: string,
  data: BookingNotificationData,
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule'
): Promise<NotificationResult> {
  try {
    const title = getPushTitle(type, data);
    const body = getPushBody(type, data);
    
    // Enregistrer la notification push dans la base de données
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: `service_booking_${type}`,
        title,
        body,
        data: {
          booking_id: data.booking_id,
          service_name: data.service_name,
          booking_date: data.booking_date,
          booking_time: data.booking_time,
        },
        channel: 'push',
        read: false,
      });
    
    if (error) {
      logger.error('Error creating push notification', { error, userId, type });
      return {
        success: false,
        channel: 'push',
        error: error.message,
      };
    }
    
    // Si l'utilisateur a un service worker enregistré, envoyer la notification push
    // Cela nécessite une configuration supplémentaire côté client
    
    return {
      success: true,
      channel: 'push',
      sent_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error sending booking push notification', { error, userId, type });
    return {
      success: false,
      channel: 'push',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Envoie une notification email pour une réservation
 */
export async function sendBookingEmail(
  email: string,
  data: BookingNotificationData,
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule'
): Promise<NotificationResult> {
  try {
    const subject = getEmailSubject(type, data);
    const template = getEmailTemplate(type, data);
    
    // Récupérer le user_id depuis le booking
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .select('user_id, customer_id')
      .eq('id', data.booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${data.booking_id}`);
    }

    // Utiliser user_id ou customer_id selon disponibilité
    const userId = booking.user_id || booking.customer_id;
    if (!userId) {
      throw new Error(`No user_id or customer_id found for booking ${data.booking_id}`);
    }

    // Utiliser le système de notifications unifié
    await sendUnifiedNotification({
      user_id: userId,
      type: `service_booking_${type}` as any,
      title: subject,
      message: template,
      channel: 'email',
      metadata: {
        booking_id: data.booking_id,
        service_name: data.service_name,
        booking_date: data.booking_date,
        booking_time: data.booking_time,
      },
    });
    
    return {
      success: true,
      channel: 'email',
      sent_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Error sending booking email', { error, email, type });
    return {
      success: false,
      channel: 'email',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Envoie toutes les notifications pour une réservation selon les préférences
 */
export async function sendBookingNotifications(
  userId: string,
  preferences: BookingNotificationPreferences,
  data: BookingNotificationData,
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  channels: ('email' | 'sms' | 'push' | 'in_app')[] = ['email', 'sms', 'push', 'in_app']
): Promise<NotificationResult[]> {
  const  results: NotificationResult[] = [];
  
  // Email
  if (channels.includes('email') && preferences.email_enabled) {
    if (
      (type === 'confirmation' && preferences.confirmation_enabled) ||
      (type === 'reminder' && preferences.reminder_enabled) ||
      (type === 'cancellation' && preferences.cancellation_enabled) ||
      (type === 'reschedule' && preferences.reschedule_enabled)
    ) {
      const result = await sendBookingEmail(data.customer_email, data, type);
      results.push(result);
    }
  }
  
  // SMS
  if (channels.includes('sms') && preferences.sms_enabled && data.customer_phone) {
    if (
      (type === 'confirmation' && preferences.confirmation_enabled) ||
      (type === 'reminder' && preferences.reminder_enabled) ||
      (type === 'cancellation' && preferences.cancellation_enabled) ||
      (type === 'reschedule' && preferences.reschedule_enabled)
    ) {
      const result = await sendBookingSMS(data.customer_phone, data, type);
      results.push(result);
    }
  }
  
  // Push
  if (channels.includes('push') && preferences.push_enabled) {
    if (
      (type === 'confirmation' && preferences.confirmation_enabled) ||
      (type === 'reminder' && preferences.reminder_enabled) ||
      (type === 'cancellation' && preferences.cancellation_enabled) ||
      (type === 'reschedule' && preferences.reschedule_enabled)
    ) {
      const result = await sendBookingPush(userId, data, type);
      results.push(result);
    }
  }
  
  // In-app
  if (channels.includes('in_app') && preferences.in_app_enabled) {
    await sendUnifiedNotification({
      user_id: userId,
      type: `service_booking_${type}` as any,
      title: getPushTitle(type, data),
      message: getPushBody(type, data),
      channel: 'in_app',
      metadata: {
        booking_id: data.booking_id,
        service_name: data.service_name,
        booking_date: data.booking_date,
        booking_time: data.booking_time,
      },
    });
    
    results.push({
      success: true,
      channel: 'in_app',
      sent_at: new Date().toISOString(),
    });
  }
  
  return results;
}

// =====================================================
// TEMPLATES
// =====================================================

function getSMSTemplate(
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  data: BookingNotificationData
): string {
  switch (type) {
    case 'confirmation':
      return `Votre réservation pour ${data.service_name} est confirmée le ${formatDate(data.booking_date)} à ${data.booking_time}. Merci !`;
    
    case 'reminder':
      return `Rappel: Votre réservation ${data.service_name} est prévue le ${formatDate(data.booking_date)} à ${data.booking_time}. À bientôt !`;
    
    case 'cancellation':
      return `Votre réservation ${data.service_name} du ${formatDate(data.booking_date)} a été annulée.${data.cancellation_reason ? ` Raison: ${data.cancellation_reason}` : ''}`;
    
    case 'reschedule':
      return `Votre réservation ${data.service_name} a été replanifiée au ${formatDate(data.reschedule_date || data.booking_date)} à ${data.reschedule_time || data.booking_time}.`;
    
    default:
      return '';
  }
}

function getPushTitle(
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  data: BookingNotificationData
): string {
  switch (type) {
    case 'confirmation':
      return 'Réservation confirmée';
    case 'reminder':
      return 'Rappel de réservation';
    case 'cancellation':
      return 'Réservation annulée';
    case 'reschedule':
      return 'Réservation replanifiée';
    default:
      return 'Notification de réservation';
  }
}

function getPushBody(
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  data: BookingNotificationData
): string {
  switch (type) {
    case 'confirmation':
      return `${data.service_name} - ${formatDate(data.booking_date)} à ${data.booking_time}`;
    case 'reminder':
      return `N'oubliez pas: ${data.service_name} demain à ${data.booking_time}`;
    case 'cancellation':
      return `Votre réservation du ${formatDate(data.booking_date)} a été annulée`;
    case 'reschedule':
      return `Nouvelle date: ${formatDate(data.reschedule_date || data.booking_date)} à ${data.reschedule_time || data.booking_time}`;
    default:
      return '';
  }
}

function getEmailSubject(
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  data: BookingNotificationData
): string {
  switch (type) {
    case 'confirmation':
      return `Confirmation de réservation - ${data.service_name}`;
    case 'reminder':
      return `Rappel: Réservation ${data.service_name} demain`;
    case 'cancellation':
      return `Annulation de réservation - ${data.service_name}`;
    case 'reschedule':
      return `Replanification de réservation - ${data.service_name}`;
    default:
      return 'Notification de réservation';
  }
}

function getEmailTemplate(
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule',
  data: BookingNotificationData
): string {
  const baseTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${getEmailSubject(type, data)}</h2>
      <p>Bonjour ${data.customer_name},</p>
  `;
  
  switch (type) {
    case 'confirmation':
      return `${baseTemplate}
        <p>Votre réservation pour <strong>${data.service_name}</strong> a été confirmée.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Date:</strong> ${formatDate(data.booking_date)}</p>
          <p><strong>Heure:</strong> ${data.booking_time}${data.booking_end_time ? ` - ${data.booking_end_time}` : ''}</p>
          ${data.location ? `<p><strong>Lieu:</strong> ${data.location}</p>` : ''}
          ${data.staff_name ? `<p><strong>Prestataire:</strong> ${data.staff_name}</p>` : ''}
          ${data.meeting_url ? `<p><strong>Lien de réunion:</strong> <a href="${data.meeting_url}">${data.meeting_url}</a></p>` : ''}
        </div>
        <p>Nous avons hâte de vous voir !</p>
      </div>`;
    
    case 'reminder':
      return `${baseTemplate}
        <p>Ceci est un rappel pour votre réservation <strong>${data.service_name}</strong>.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p><strong>Date:</strong> ${formatDate(data.booking_date)}</p>
          <p><strong>Heure:</strong> ${data.booking_time}</p>
          ${data.location ? `<p><strong>Lieu:</strong> ${data.location}</p>` : ''}
        </div>
        <p>À bientôt !</p>
      </div>`;
    
    case 'cancellation':
      return `${baseTemplate}
        <p>Votre réservation pour <strong>${data.service_name}</strong> du ${formatDate(data.booking_date)} a été annulée.</p>
        ${data.cancellation_reason ? `<p><strong>Raison:</strong> ${data.cancellation_reason}</p>` : ''}
        <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
      </div>`;
    
    case 'reschedule':
      return `${baseTemplate}
        <p>Votre réservation pour <strong>${data.service_name}</strong> a été replanifiée.</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Nouvelle date:</strong> ${formatDate(data.reschedule_date || data.booking_date)}</p>
          <p><strong>Nouvelle heure:</strong> ${data.reschedule_time || data.booking_time}</p>
        </div>
        <p>Merci de votre compréhension.</p>
      </div>`;
    
    default:
      return baseTemplate + '</div>';
  }
}

// =====================================================
// RAPPELS AUTOMATIQUES
// =====================================================

/**
 * Planifie les rappels automatiques pour une réservation
 */
export async function scheduleBookingReminders(
  bookingId: string,
  bookingDate: string,
  bookingTime: string,
  preferences: BookingNotificationPreferences
): Promise<void> {
  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
  
  // Rappel 24h avant
  if (preferences.reminder_24h_enabled) {
    const reminder24h = new Date(bookingDateTime);
    reminder24h.setHours(reminder24h.getHours() - 24);
    
    if (reminder24h > new Date()) {
      await createReminder(bookingId, reminder24h, '24h', preferences);
    }
  }
  
  // Rappel 2h avant
  if (preferences.reminder_2h_enabled) {
    const reminder2h = new Date(bookingDateTime);
    reminder2h.setHours(reminder2h.getHours() - 2);
    
    if (reminder2h > new Date()) {
      await createReminder(bookingId, reminder2h, '2h', preferences);
    }
  }
  
  // Rappel 30min avant
  if (preferences.reminder_30min_enabled) {
    const reminder30min = new Date(bookingDateTime);
    reminder30min.setMinutes(reminder30min.getMinutes() - 30);
    
    if (reminder30min > new Date()) {
      await createReminder(bookingId, reminder30min, '30min', preferences);
    }
  }
}

/**
 * Crée un rappel dans la base de données
 */
async function createReminder(
  bookingId: string,
  scheduledAt: Date,
  timing: '24h' | '2h' | '30min',
  preferences: BookingNotificationPreferences
): Promise<void> {
  // Récupérer les infos de la réservation
  const { data: booking, error: bookingError } = await supabase
    .from('service_bookings')
    .select(`
      *,
      products!inner (name, store_id)
    `)
    .eq('id', bookingId)
    .single();
  
  if (bookingError || !booking) {
    logger.error('Error fetching booking for reminder', { error: bookingError, bookingId });
    return;
  }
  
  // Récupérer les infos utilisateur
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', booking.user_id)
    .maybeSingle();
  
  // Créer les rappels selon les canaux activés
  const reminders = [];
  const serviceName = (booking.products as { name?: string })?.name || 'Service';
  const storeId = (booking.products as { store_id?: string })?.store_id || '';
  
  if (preferences.email_enabled && preferences.reminder_enabled) {
    reminders.push({
      booking_id: bookingId,
      service_id: booking.product_id,
      store_id: storeId,
      user_id: booking.user_id,
      reminder_type: 'email',
      reminder_scheduled_at: scheduledAt.toISOString(),
      reminder_message: `Rappel ${timing}: Votre réservation ${serviceName} est prévue demain.`,
      status: 'pending',
    });
  }
  
  if (preferences.sms_enabled && preferences.reminder_enabled && userProfile?.phone) {
    reminders.push({
      booking_id: bookingId,
      service_id: booking.product_id,
      store_id: storeId,
      user_id: booking.user_id,
      reminder_type: 'sms',
      reminder_scheduled_at: scheduledAt.toISOString(),
      reminder_message: `Rappel ${timing}: Réservation ${serviceName} demain.`,
      status: 'pending',
    });
  }
  
  if (preferences.push_enabled && preferences.reminder_enabled) {
    reminders.push({
      booking_id: bookingId,
      service_id: booking.product_id,
      store_id: storeId,
      user_id: booking.user_id,
      reminder_type: 'push',
      reminder_scheduled_at: scheduledAt.toISOString(),
      reminder_message: `Rappel ${timing}: Réservation ${serviceName} demain.`,
      status: 'pending',
    });
  }
  
  if (reminders.length > 0) {
    const { error } = await supabase
      .from('service_booking_reminders')
      .insert(reminders);
    
    if (error) {
      logger.error('Error creating reminders', { error, bookingId });
    }
  }
}

/**
 * Récupère les préférences de notification d'un utilisateur
 */
export async function getUserBookingNotificationPreferences(
  userId: string
): Promise<BookingNotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error || !data) {
    // Retourner les préférences par défaut
    return {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      reminder_24h_enabled: true,
      reminder_2h_enabled: true,
      reminder_30min_enabled: false,
      confirmation_enabled: true,
      reminder_enabled: true,
      cancellation_enabled: true,
      reschedule_enabled: true,
      completion_enabled: true,
    };
  }
  
  return {
    email_enabled: data.email_enabled ?? true,
    sms_enabled: data.sms_enabled ?? false,
    push_enabled: data.push_enabled ?? true,
    in_app_enabled: data.in_app_enabled ?? true,
    reminder_24h_enabled: data.reminder_24h_enabled ?? true,
    reminder_2h_enabled: data.reminder_2h_enabled ?? true,
    reminder_30min_enabled: data.reminder_30min_enabled ?? false,
    confirmation_enabled: data.confirmation_enabled ?? true,
    reminder_enabled: data.reminder_enabled ?? true,
    cancellation_enabled: data.cancellation_enabled ?? true,
    reschedule_enabled: data.reschedule_enabled ?? true,
    completion_enabled: data.completion_enabled ?? true,
  };
}

// =====================================================
// UTILITAIRES
// =====================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}







