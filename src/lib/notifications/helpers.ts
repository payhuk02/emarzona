/**
 * Helpers pour créer des notifications automatiques
 * Lors d'événements clés (enrollment, completion, etc.)
 * Date : 27 octobre 2025
 */

import { supabase } from '@/integrations/supabase/client';
import type { CreateNotificationData } from '@/types/notifications';

/**
 * Créer une notification
 */
export const createNotification = async (data: CreateNotificationData) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata || {},
      action_url: data.action_url,
      action_label: data.action_label,
      priority: data.priority || 'normal',
    });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    console.log(`✅ Notification créée: ${data.title}`);
    return true;
  } catch (error) {
    console.error('Exception creating notification:', error);
    return false;
  }
};

/**
 * Notification : Inscription à un cours
 */
export const notifyCourseEnrollment = async (
  userId: string,
  courseName: string,
  courseSlug: string
) => {
  return createNotification({
    user_id: userId,
    type: 'course_enrollment',
    title: `Bienvenue dans ${courseName} !`,
    message: `Vous êtes maintenant inscrit à ce cours. Commencez votre apprentissage dès maintenant.`,
    action_url: `/courses/${courseSlug}`,
    action_label: 'Commencer le cours',
    priority: 'normal',
    metadata: {
      course_slug: courseSlug,
    },
  });
};

/**
 * Notification : Leçon terminée
 */
export const notifyLessonComplete = async (
  userId: string,
  lessonTitle: string,
  courseSlug: string
) => {
  return createNotification({
    user_id: userId,
    type: 'lesson_complete',
    title: `Leçon terminée !`,
    message: `Vous avez terminé "${lessonTitle}". Continuez sur votre lancée !`,
    action_url: `/courses/${courseSlug}`,
    action_label: 'Continuer',
    priority: 'low',
    metadata: {
      lesson_title: lessonTitle,
      course_slug: courseSlug,
    },
  });
};

/**
 * Notification : Cours terminé
 */
export const notifyCourseComplete = async (
  userId: string,
  courseName: string,
  courseSlug: string,
  certificateEnabled: boolean
) => {
  return createNotification({
    user_id: userId,
    type: 'course_complete',
    title: `Félicitations ! Cours terminé 🎉`,
    message: certificateEnabled
      ? `Vous avez terminé ${courseName}. Votre certificat est prêt !`
      : `Vous avez terminé ${courseName}. Bravo !`,
    action_url: `/courses/${courseSlug}`,
    action_label: certificateEnabled ? 'Télécharger le certificat' : 'Voir le cours',
    priority: 'high',
    metadata: {
      course_name: courseName,
      course_slug: courseSlug,
      certificate_enabled: certificateEnabled,
    },
  });
};

/**
 * Notification : Certificat disponible
 */
export const notifyCertificateReady = async (
  userId: string,
  courseName: string,
  courseSlug: string
) => {
  return createNotification({
    user_id: userId,
    type: 'certificate_ready',
    title: `Votre certificat est prêt ! 🏆`,
    message: `Félicitations ! Vous pouvez maintenant télécharger votre certificat pour ${courseName}.`,
    action_url: `/courses/${courseSlug}`,
    action_label: 'Télécharger',
    priority: 'high',
    metadata: {
      course_name: courseName,
      course_slug: courseSlug,
    },
  });
};

/**
 * Notification : Quiz réussi
 */
export const notifyQuizPassed = async (
  userId: string,
  quizTitle: string,
  score: number,
  courseSlug: string
) => {
  return createNotification({
    user_id: userId,
    type: 'quiz_passed',
    title: `Quiz réussi ! ✅`,
    message: `Vous avez obtenu ${score}% au quiz "${quizTitle}". Excellent travail !`,
    action_url: `/courses/${courseSlug}`,
    action_label: 'Continuer',
    priority: 'normal',
    metadata: {
      quiz_title: quizTitle,
      score,
      course_slug: courseSlug,
    },
  });
};

/**
 * Notification : Quiz échoué
 */
export const notifyQuizFailed = async (
  userId: string,
  quizTitle: string,
  score: number,
  courseSlug: string
) => {
  return createNotification({
    user_id: userId,
    type: 'quiz_failed',
    title: `Quiz non réussi`,
    message: `Vous avez obtenu ${score}% au quiz "${quizTitle}". Réessayez pour améliorer votre score.`,
    action_url: `/courses/${courseSlug}`,
    action_label: 'Réessayer',
    priority: 'normal',
    metadata: {
      quiz_title: quizTitle,
      score,
      course_slug: courseSlug,
    },
  });
};

/**
 * Notification : Nouveau cours disponible
 */
export const notifyNewCourse = async (
  userId: string,
  courseName: string,
  courseSlug: string,
  instructorName: string
) => {
  return createNotification({
    user_id: userId,
    type: 'new_course',
    title: `Nouveau cours disponible !`,
    message: `${instructorName} a publié "${courseName}". Découvrez-le maintenant.`,
    action_url: `/courses/${courseSlug}`,
    action_label: 'Découvrir',
    priority: 'low',
    metadata: {
      course_name: courseName,
      course_slug: courseSlug,
      instructor_name: instructorName,
    },
  });
};

/**
 * Notification : Vente affilié
 */
export const notifyAffiliateSale = async (
  userId: string,
  courseName: string,
  commission: number,
  currency: string = 'XOF'
) => {
  return createNotification({
    user_id: userId,
    type: 'affiliate_sale',
    title: `Nouvelle vente affilié ! 💰`,
    message: `Vous avez généré une vente pour "${courseName}". Commission: ${commission.toLocaleString()} ${currency}`,
    action_url: `/affiliate/courses`,
    action_label: 'Voir mes statistiques',
    priority: 'high',
    metadata: {
      course_name: courseName,
      commission,
      currency,
    },
  });
};

/**
 * Notification : Commission affilié disponible
 */
export const notifyAffiliateCommission = async (
  userId: string,
  amount: number,
  currency: string = 'XOF'
) => {
  return createNotification({
    user_id: userId,
    type: 'affiliate_commission',
    title: `Commission disponible !`,
    message: `Votre commission de ${amount.toLocaleString()} ${currency} est maintenant disponible.`,
    action_url: `/affiliate/dashboard`,
    action_label: 'Voir mes gains',
    priority: 'high',
    metadata: {
      amount,
      currency,
    },
  });
};

