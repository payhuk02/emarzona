import { supabase } from '@/integrations/supabase/client';

export interface EnrollUserInCourseParams {
  courseId: string;
  orderId?: string | null;
  userId?: string | null;
}

export function mapCourseEnrollmentError(message: string): string {
  if (message.includes('ENROLLMENT_ACCESS_DENIED')) {
    return 'Accès refusé. Achetez le cours ou inscrivez-vous à une offre gratuite valide.';
  }
  if (message.includes('ENROLLMENT_FORBIDDEN')) {
    return "Vous n'êtes pas autorisé à inscrire cet utilisateur.";
  }
  if (message.includes('COURSE_NOT_FOUND')) {
    return 'Cours introuvable.';
  }
  if (message.includes('UNAUTHORIZED')) {
    return 'Vous devez être connecté pour vous inscrire.';
  }
  return message;
}

/**
 * Secure enrollment via RPC (no direct INSERT on course_enrollments).
 */
export async function enrollUserInCourse({
  courseId,
  orderId,
  userId,
}: EnrollUserInCourseParams): Promise<string> {
  const { data, error } = await supabase.rpc('enroll_user_in_course', {
    p_course_id: courseId,
    p_order_id: orderId ?? null,
    p_user_id: userId ?? null,
  });

  if (error) {
    throw new Error(mapCourseEnrollmentError(error.message));
  }

  if (!data) {
    throw new Error("Impossible de finaliser l'inscription au cours.");
  }

  return String(data);
}
