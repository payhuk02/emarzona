/**
 * useCourseReports - Hook pour la génération de rapports de cours
 * 
 * Fournit 4 types de rapports :
 * 1. Rapport d'inscription (enrollment report)
 * 2. Rapport de revenue (revenue report)
 * 3. Rapport d'étudiants (student report)
 * 4. Rapport de complétion (completion report)
 * 
 * @author Payhuk Team
 * @date 29 Octobre 2025
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Type de rapport
 */
export type ReportType = 'enrollment' | 'revenue' | 'student' | 'completion';

/**
 * Période de rapport
 */
export type ReportPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * Format d'export
 */
export type ExportFormat = 'csv' | 'json' | 'pdf';

/**
 * Rapport d'inscription
 */
export interface EnrollmentReport {
  period: ReportPeriod;
  total_enrollments: number;
  new_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  cancelled_enrollments: number;
  growth_rate: number; // %
  enrollments_by_day: Array<{
    date: string;
    count: number;
  }>;
  enrollments_by_course: Array<{
    course_id: string;
    course_name: string;
    count: number;
  }>;
  enrollments_by_status: Array<{
    status: string;
    count: number;
  }>;
}

/**
 * Rapport de revenue
 */
export interface RevenueReport {
  period: ReportPeriod;
  total_revenue: number;
  revenue_growth: number; // %
  avg_transaction_value: number;
  total_transactions: number;
  pending_revenue: number;
  refunded_revenue: number;
  revenue_by_day: Array<{
    date: string;
    amount: number;
  }>;
  revenue_by_course: Array<{
    course_id: string;
    course_name: string;
    revenue: number;
    enrollments: number;
  }>;
  revenue_by_payment_method: Array<{
    method: string;
    amount: number;
  }>;
}

/**
 * Rapport d'étudiants
 */
export interface StudentReport {
  period: ReportPeriod;
  total_students: number;
  active_students: number;
  new_students: number;
  returning_students: number;
  churn_rate: number; // %
  avg_courses_per_student: number;
  avg_completion_rate: number;
  most_active_students: Array<{
    student_id: string;
    student_name: string;
    courses_enrolled: number;
    total_time_spent: number;
    avg_completion: number;
  }>;
  student_retention_by_month: Array<{
    month: string;
    retention_rate: number;
  }>;
}

/**
 * Rapport de complétion
 */
export interface CompletionReport {
  period: ReportPeriod;
  total_completions: number;
  avg_completion_rate: number;
  avg_completion_time: number; // jours
  completion_by_course: Array<{
    course_id: string;
    course_name: string;
    total_enrollments: number;
    completions: number;
    completion_rate: number;
    avg_time: number;
  }>;
  completion_trend: Array<{
    date: string;
    count: number;
  }>;
  certificates_issued: number;
  avg_quiz_score: number;
}

/**
 * Configuration du rapport
 */
export interface ReportConfig {
  period: ReportPeriod;
  course_id?: string;
  student_id?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Calculer les dates de début et fin selon la période
 */
const getPeriodDates = (period: ReportPeriod): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(end.getDate() - 7);
      break;
    case 'month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2020); // Date arbitraire très ancienne
      break;
  }

  return { start, end };
};

/**
 * Hook useCourseReports
 */
export const useCourseReports = (config: ReportConfig) => {
  const { period, course_id, student_id, start_date, end_date } = config;

  // Déterminer les dates
  const dates = useMemo(() => {
    if (start_date && end_date) {
      return { start: new Date(start_date), end: new Date(end_date) };
    }
    return getPeriodDates(period);
  }, [period, start_date, end_date]);

  /**
   * Rapport d'inscription
   */
  const { data: enrollmentReport, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ['enrollment-report', period, course_id, dates],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name)
        `)
        .gte('enrolled_at', dates.start.toISOString())
        .lte('enrolled_at', dates.end.toISOString());

      if (course_id) {
        query = query.eq('course_id', course_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enrollments = data || [];

      // Calculer les métriques
      const report: EnrollmentReport = {
        period,
        total_enrollments: enrollments.length,
        new_enrollments: enrollments.filter((e) => e.status === 'active' || e.status === 'pending')
          .length,
        active_enrollments: enrollments.filter((e) => e.status === 'active').length,
        completed_enrollments: enrollments.filter((e) => e.status === 'completed').length,
        cancelled_enrollments: enrollments.filter((e) => e.status === 'cancelled' || e.status === 'refunded').length,
        growth_rate: 0, // TODO: Calculer vs période précédente
        enrollments_by_day: [],
        enrollments_by_course: [],
        enrollments_by_status: [],
      };

      // Grouper par jour
      const byDay = new Map<string, number>();
      enrollments.forEach((enrollment) => {
        const date = new Date(enrollment.enrolled_at).toISOString().split('T')[0];
        byDay.set(date, (byDay.get(date) || 0) + 1);
      });
      report.enrollments_by_day = Array.from(byDay.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      // Grouper par cours
      const byCourse = new Map<string, { course_name: string; count: number }>();
      enrollments.forEach((enrollment) => {
        const existing = byCourse.get(enrollment.course_id) || {
          course_name: enrollment.courses.name,
          count: 0,
        };
        existing.count++;
        byCourse.set(enrollment.course_id, existing);
      });
      report.enrollments_by_course = Array.from(byCourse.entries()).map(
        ([course_id, { course_name, count }]) => ({
          course_id,
          course_name,
          count,
        })
      );

      // Grouper par statut
      const byStatus = new Map<string, number>();
      enrollments.forEach((enrollment) => {
        byStatus.set(enrollment.status, (byStatus.get(enrollment.status) || 0) + 1);
      });
      report.enrollments_by_status = Array.from(byStatus.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      return report;
    },
  });

  /**
   * Rapport de revenue
   */
  const { data: revenueReport, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenue-report', period, course_id, dates],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name)
        `)
        .gte('enrolled_at', dates.start.toISOString())
        .lte('enrolled_at', dates.end.toISOString());

      if (course_id) {
        query = query.eq('course_id', course_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enrollments = data || [];

      // Calculer les métriques
      const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0);
      const pendingRevenue = enrollments
        .filter((e) => e.status === 'pending')
        .reduce((sum, e) => sum + (e.amount_paid || 0), 0);
      const refundedRevenue = enrollments
        .filter((e) => e.status === 'refunded')
        .reduce((sum, e) => sum + (e.amount_paid || 0), 0);

      const report: RevenueReport = {
        period,
        total_revenue: totalRevenue,
        revenue_growth: 0, // TODO: Calculer vs période précédente
        avg_transaction_value: enrollments.length > 0 ? totalRevenue / enrollments.length : 0,
        total_transactions: enrollments.length,
        pending_revenue: pendingRevenue,
        refunded_revenue: refundedRevenue,
        revenue_by_day: [],
        revenue_by_course: [],
        revenue_by_payment_method: [],
      };

      // Grouper par jour
      const byDay = new Map<string, number>();
      enrollments.forEach((enrollment) => {
        const date = new Date(enrollment.enrolled_at).toISOString().split('T')[0];
        byDay.set(date, (byDay.get(date) || 0) + (enrollment.amount_paid || 0));
      });
      report.revenue_by_day = Array.from(byDay.entries()).map(([date, amount]) => ({
        date,
        amount,
      }));

      // Grouper par cours
      const byCourse = new Map<
        string,
        { course_name: string; revenue: number; enrollments: number }
      >();
      enrollments.forEach((enrollment) => {
        const existing = byCourse.get(enrollment.course_id) || {
          course_name: enrollment.courses.name,
          revenue: 0,
          enrollments: 0,
        };
        existing.revenue += enrollment.amount_paid || 0;
        existing.enrollments++;
        byCourse.set(enrollment.course_id, existing);
      });
      report.revenue_by_course = Array.from(byCourse.entries()).map(
        ([course_id, data]) => ({
          course_id,
          ...data,
        })
      );

      // Grouper par méthode de paiement
      const byPaymentMethod = new Map<string, number>();
      enrollments.forEach((enrollment) => {
        const method = enrollment.payment_method || 'Non spécifié';
        byPaymentMethod.set(method, (byPaymentMethod.get(method) || 0) + (enrollment.amount_paid || 0));
      });
      report.revenue_by_payment_method = Array.from(byPaymentMethod.entries()).map(
        ([method, amount]) => ({
          method,
          amount,
        })
      );

      return report;
    },
  });

  /**
   * Rapport d'étudiants
   */
  const { data: studentReport, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student-report', period, student_id, dates],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          students:auth.users!inner(raw_user_meta_data)
        `)
        .gte('enrolled_at', dates.start.toISOString())
        .lte('enrolled_at', dates.end.toISOString());

      if (student_id) {
        query = query.eq('student_id', student_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enrollments = data || [];

      // Compter les étudiants uniques
      const uniqueStudents = new Set(enrollments.map((e) => e.student_id));

      const report: StudentReport = {
        period,
        total_students: uniqueStudents.size,
        active_students: enrollments.filter((e) => e.status === 'active').length,
        new_students: uniqueStudents.size, // TODO: Filtrer vraiment nouveaux
        returning_students: 0, // TODO: Calculer
        churn_rate: 0, // TODO: Calculer
        avg_courses_per_student: uniqueStudents.size > 0 ? enrollments.length / uniqueStudents.size : 0,
        avg_completion_rate:
          enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
            : 0,
        most_active_students: [],
        student_retention_by_month: [],
      };

      // Calculer les étudiants les plus actifs
      const studentStats = new Map<
        string,
        {
          student_name: string;
          courses_enrolled: number;
          total_time_spent: number;
          total_progress: number;
        }
      >();

      enrollments.forEach((enrollment) => {
        const existing = studentStats.get(enrollment.student_id) || {
          student_name: enrollment.students.raw_user_meta_data?.full_name || 'Inconnu',
          courses_enrolled: 0,
          total_time_spent: 0,
          total_progress: 0,
        };
        existing.courses_enrolled++;
        existing.total_time_spent += enrollment.time_spent || 0;
        existing.total_progress += enrollment.progress || 0;
        studentStats.set(enrollment.student_id, existing);
      });

      report.most_active_students = Array.from(studentStats.entries())
        .map(([student_id, stats]) => ({
          student_id,
          student_name: stats.student_name,
          courses_enrolled: stats.courses_enrolled,
          total_time_spent: stats.total_time_spent,
          avg_completion:
            stats.courses_enrolled > 0 ? stats.total_progress / stats.courses_enrolled : 0,
        }))
        .sort((a, b) => b.total_time_spent - a.total_time_spent)
        .slice(0, 10);

      return report;
    },
  });

  /**
   * Rapport de complétion
   */
  const { data: completionReport, isLoading: isLoadingCompletion } = useQuery({
    queryKey: ['completion-report', period, course_id, dates],
    queryFn: async () => {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner(name)
        `)
        .gte('enrolled_at', dates.start.toISOString())
        .lte('enrolled_at', dates.end.toISOString());

      if (course_id) {
        query = query.eq('course_id', course_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const enrollments = data || [];

      const completions = enrollments.filter((e) => e.status === 'completed');

      const report: CompletionReport = {
        period,
        total_completions: completions.length,
        avg_completion_rate:
          enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length
            : 0,
        avg_completion_time: 0, // TODO: Calculer
        completion_by_course: [],
        completion_trend: [],
        certificates_issued: enrollments.filter((e) => e.has_certificate).length,
        avg_quiz_score:
          enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + (e.average_score || 0), 0) / enrollments.length
            : 0,
      };

      // Grouper par cours
      const byCourse = new Map<
        string,
        {
          course_name: string;
          total: number;
          completed: number;
          total_days: number;
        }
      >();

      enrollments.forEach((enrollment) => {
        const existing = byCourse.get(enrollment.course_id) || {
          course_name: enrollment.courses.name,
          total: 0,
          completed: 0,
          total_days: 0,
        };
        existing.total++;
        if (enrollment.status === 'completed') {
          existing.completed++;
          // TODO: Calculer les jours
        }
        byCourse.set(enrollment.course_id, existing);
      });

      report.completion_by_course = Array.from(byCourse.entries()).map(
        ([course_id, data]) => ({
          course_id,
          course_name: data.course_name,
          total_enrollments: data.total,
          completions: data.completed,
          completion_rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
          avg_time: data.completed > 0 ? data.total_days / data.completed : 0,
        })
      );

      // Tendance de complétion
      const byDay = new Map<string, number>();
      completions.forEach((enrollment) => {
        const date = new Date(enrollment.updated_at).toISOString().split('T')[0];
        byDay.set(date, (byDay.get(date) || 0) + 1);
      });
      report.completion_trend = Array.from(byDay.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      return report;
    },
  });

  /**
   * Exporter un rapport
   */
  const exportReport = (type: ReportType, format: ExportFormat = 'csv') => {
    let data: any;
    let filename: string;

    switch (type) {
      case 'enrollment':
        data = enrollmentReport;
        filename = `enrollment-report-${period}`;
        break;
      case 'revenue':
        data = revenueReport;
        filename = `revenue-report-${period}`;
        break;
      case 'student':
        data = studentReport;
        filename = `student-report-${period}`;
        break;
      case 'completion':
        data = completionReport;
        filename = `completion-report-${period}`;
        break;
    }

    if (!data) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Conversion simple en CSV (à améliorer)
      const csv = JSON.stringify(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    // Rapports
    enrollmentReport,
    revenueReport,
    studentReport,
    completionReport,

    // États de chargement
    isLoadingEnrollment,
    isLoadingRevenue,
    isLoadingStudent,
    isLoadingCompletion,
    isLoading:
      isLoadingEnrollment || isLoadingRevenue || isLoadingStudent || isLoadingCompletion,

    // Utilitaires
    exportReport,
    config,
    dates,
  };
};

export default useCourseReports;

