/**
 * useCourseAlerts - Hook pour la gestion des alertes de cours
 * 
 * Fournit des alertes automatiques pour :
 * - Capacité faible (places limitées)
 * - Deadlines approchantes
 * - Étudiants inactifs
 * - Taux de complétion faible
 * - Paiements en attente
 * 
 * @author Payhuk Team
 * @date 29 Octobre 2025
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Type d'alerte
 */
export type AlertType =
  | 'low_capacity'        // Capacité faible
  | 'deadline_approaching' // Deadline proche
  | 'student_inactive'     // Étudiant inactif
  | 'low_completion'       // Taux de complétion faible
  | 'pending_payment'      // Paiement en attente
  | 'expiring_access';     // Accès expirant bientôt

/**
 * Niveau de sévérité
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Alerte de cours
 */
export interface CourseAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  course_id?: string;
  course_name?: string;
  enrollment_id?: string;
  student_name?: string;
  metadata?: {
    remaining_spots?: number;
    days_until_deadline?: number;
    days_inactive?: number;
    completion_rate?: number;
    amount_due?: number;
    expiry_date?: string;
  };
  created_at: string;
  acknowledged: boolean;
}

/**
 * Configuration des alertes
 */
export interface AlertConfig {
  lowCapacityThreshold: number; // Pourcentage (ex: 10 = 10% restant)
  deadlineWarningDays: number; // Jours avant la deadline
  inactivityDays: number; // Jours d'inactivité
  lowCompletionThreshold: number; // Pourcentage de complétion
  expiryWarningDays: number; // Jours avant expiration
}

/**
 * Filtres pour les alertes
 */
export interface AlertFilters {
  type?: AlertType;
  severity?: AlertSeverity;
  acknowledged?: boolean;
  course_id?: string;
}

/**
 * Configuration par défaut
 */
const DEFAULT_CONFIG: AlertConfig = {
  lowCapacityThreshold: 10, // 10% restant
  deadlineWarningDays: 7, // 7 jours
  inactivityDays: 14, // 14 jours
  lowCompletionThreshold: 30, // 30%
  expiryWarningDays: 7, // 7 jours
};

/**
 * Hook useCourseAlerts
 */
export const useCourseAlerts = (config: Partial<AlertConfig> = {}) => {
  const alertConfig = { ...DEFAULT_CONFIG, ...config };

  /**
   * Générer les alertes de capacité faible
   */
  const { data: lowCapacityAlerts = [] } = useQuery({
    queryKey: ['course-alerts-capacity', alertConfig.lowCapacityThreshold],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .gt('max_students', 0);

      if (error) throw error;

      const alerts: CourseAlert[] = [];

      data?.forEach((course) => {
        const remainingSpots = course.max_students - course.enrolled_students;
        const capacityPercentage = (remainingSpots / course.max_students) * 100;

        if (capacityPercentage <= alertConfig.lowCapacityThreshold && capacityPercentage > 0) {
          const severity: AlertSeverity =
            capacityPercentage <= 5 ? 'critical' : capacityPercentage <= 10 ? 'warning' : 'info';

          alerts.push({
            id: `low-capacity-${course.id}`,
            type: 'low_capacity',
            severity,
            title: 'Capacité limitée',
            message: `Le cours "${course.name}" arrive à saturation (${remainingSpots} places restantes)`,
            course_id: course.id,
            course_name: course.name,
            metadata: {
              remaining_spots: remainingSpots,
            },
            created_at: new Date().toISOString(),
            acknowledged: false,
          });
        }
      });

      return alerts;
    },
  });

  /**
   * Générer les alertes d'étudiants inactifs
   */
  const { data: inactivityAlerts = [] } = useQuery({
    queryKey: ['course-alerts-inactivity', alertConfig.inactivityDays],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - alertConfig.inactivityDays);

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name),
          students:auth.users!inner(raw_user_meta_data)
        `)
        .eq('status', 'active')
        .lt('last_activity_at', cutoffDate.toISOString());

      if (error) throw error;

      const alerts: CourseAlert[] = [];

      data?.forEach((enrollment) => {
        const daysSinceActivity = Math.floor(
          (new Date().getTime() - new Date(enrollment.last_activity_at || enrollment.enrolled_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const severity: AlertSeverity = daysSinceActivity >= 30 ? 'critical' : 'warning';

        alerts.push({
          id: `inactive-${enrollment.id}`,
          type: 'student_inactive',
          severity,
          title: 'Étudiant inactif',
          message: `${enrollment.students.raw_user_meta_data?.full_name || 'Étudiant'} n'a pas progressé depuis ${daysSinceActivity} jours`,
          course_id: enrollment.course_id,
          course_name: enrollment.courses.name,
          enrollment_id: enrollment.id,
          student_name: enrollment.students.raw_user_meta_data?.full_name,
          metadata: {
            days_inactive: daysSinceActivity,
          },
          created_at: new Date().toISOString(),
          acknowledged: false,
        });
      });

      return alerts;
    },
  });

  /**
   * Générer les alertes de taux de complétion faible
   */
  const { data: lowCompletionAlerts = [] } = useQuery({
    queryKey: ['course-alerts-low-completion', alertConfig.lowCompletionThreshold],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name),
          students:auth.users!inner(raw_user_meta_data)
        `)
        .eq('status', 'active')
        .lt('progress', alertConfig.lowCompletionThreshold);

      if (error) throw error;

      const alerts: CourseAlert[] = [];

      data?.forEach((enrollment) => {
        // Seulement alerter si inscrit depuis plus de 7 jours
        const enrolledDaysAgo = Math.floor(
          (new Date().getTime() - new Date(enrollment.enrolled_at).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (enrolledDaysAgo >= 7) {
          const severity: AlertSeverity = enrollment.progress < 10 ? 'critical' : 'warning';

          alerts.push({
            id: `low-completion-${enrollment.id}`,
            type: 'low_completion',
            severity,
            title: 'Taux de complétion faible',
            message: `${enrollment.students.raw_user_meta_data?.full_name || 'Étudiant'} n'a complété que ${enrollment.progress}% du cours`,
            course_id: enrollment.course_id,
            course_name: enrollment.courses.name,
            enrollment_id: enrollment.id,
            student_name: enrollment.students.raw_user_meta_data?.full_name,
            metadata: {
              completion_rate: enrollment.progress,
            },
            created_at: new Date().toISOString(),
            acknowledged: false,
          });
        }
      });

      return alerts;
    },
  });

  /**
   * Générer les alertes de paiements en attente
   */
  const { data: pendingPaymentAlerts = [] } = useQuery({
    queryKey: ['course-alerts-pending-payment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name, price),
          students:auth.users!inner(raw_user_meta_data)
        `)
        .eq('status', 'pending');

      if (error) throw error;

      const alerts: CourseAlert[] = [];

      data?.forEach((enrollment) => {
        const severity: AlertSeverity = 'warning';

        alerts.push({
          id: `pending-payment-${enrollment.id}`,
          type: 'pending_payment',
          severity,
          title: 'Paiement en attente',
          message: `Paiement en attente pour ${enrollment.students.raw_user_meta_data?.full_name || 'Étudiant'}`,
          course_id: enrollment.course_id,
          course_name: enrollment.courses.name,
          enrollment_id: enrollment.id,
          student_name: enrollment.students.raw_user_meta_data?.full_name,
          metadata: {
            amount_due: enrollment.courses.price,
          },
          created_at: new Date().toISOString(),
          acknowledged: false,
        });
      });

      return alerts;
    },
  });

  /**
   * Générer les alertes d'accès expirant
   */
  const { data: expiringAccessAlerts = [] } = useQuery({
    queryKey: ['course-alerts-expiring-access', alertConfig.expiryWarningDays],
    queryFn: async () => {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + alertConfig.expiryWarningDays);

      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name),
          students:auth.users!inner(raw_user_meta_data)
        `)
        .eq('status', 'active')
        .not('expiry_date', 'is', null)
        .lt('expiry_date', warningDate.toISOString());

      if (error) throw error;

      const alerts: CourseAlert[] = [];

      data?.forEach((enrollment) => {
        if (!enrollment.expiry_date) return;

        const daysUntilExpiry = Math.ceil(
          (new Date(enrollment.expiry_date).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiry >= 0) {
          const severity: AlertSeverity = daysUntilExpiry <= 2 ? 'critical' : 'warning';

          alerts.push({
            id: `expiring-access-${enrollment.id}`,
            type: 'expiring_access',
            severity,
            title: 'Accès expirant bientôt',
            message: `L'accès de ${enrollment.students.raw_user_meta_data?.full_name || 'Étudiant'} expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`,
            course_id: enrollment.course_id,
            course_name: enrollment.courses.name,
            enrollment_id: enrollment.id,
            student_name: enrollment.students.raw_user_meta_data?.full_name,
            metadata: {
              expiry_date: enrollment.expiry_date,
            },
            created_at: new Date().toISOString(),
            acknowledged: false,
          });
        }
      });

      return alerts;
    },
  });

  /**
   * Combiner toutes les alertes
   */
  const allAlerts = useMemo(() => {
    return [
      ...lowCapacityAlerts,
      ...inactivityAlerts,
      ...lowCompletionAlerts,
      ...pendingPaymentAlerts,
      ...expiringAccessAlerts,
    ].sort((a, b) => {
      // Trier par sévérité puis par date
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    lowCapacityAlerts,
    inactivityAlerts,
    lowCompletionAlerts,
    pendingPaymentAlerts,
    expiringAccessAlerts,
  ]);

  /**
   * Filtrer les alertes
   */
  const filterAlerts = (filters: AlertFilters = {}) => {
    return allAlerts.filter((alert) => {
      if (filters.type && alert.type !== filters.type) return false;
      if (filters.severity && alert.severity !== filters.severity) return false;
      if (filters.acknowledged !== undefined && alert.acknowledged !== filters.acknowledged)
        return false;
      if (filters.course_id && alert.course_id !== filters.course_id) return false;
      return true;
    });
  };

  /**
   * Statistiques des alertes
   */
  const stats = useMemo(() => {
    return {
      total: allAlerts.length,
      critical: allAlerts.filter((a) => a.severity === 'critical').length,
      warning: allAlerts.filter((a) => a.severity === 'warning').length,
      info: allAlerts.filter((a) => a.severity === 'info').length,
      unacknowledged: allAlerts.filter((a) => !a.acknowledged).length,
      by_type: {
        low_capacity: allAlerts.filter((a) => a.type === 'low_capacity').length,
        deadline_approaching: allAlerts.filter((a) => a.type === 'deadline_approaching').length,
        student_inactive: allAlerts.filter((a) => a.type === 'student_inactive').length,
        low_completion: allAlerts.filter((a) => a.type === 'low_completion').length,
        pending_payment: allAlerts.filter((a) => a.type === 'pending_payment').length,
        expiring_access: allAlerts.filter((a) => a.type === 'expiring_access').length,
      },
    };
  }, [allAlerts]);

  return {
    // Toutes les alertes
    alerts: allAlerts,
    
    // Alertes par type
    lowCapacityAlerts,
    inactivityAlerts,
    lowCompletionAlerts,
    pendingPaymentAlerts,
    expiringAccessAlerts,

    // Utilitaires
    filterAlerts,
    stats,

    // Configuration
    config: alertConfig,
  };
};

export default useCourseAlerts;

