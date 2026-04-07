/**
 * Hooks pour gérer les certificats
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateAndUploadCertificate } from '@/lib/courses/certificate-generator';
import { logger } from '@/lib/logger';

/**
 * Hook pour récupérer un certificat
 */
export const useCertificate = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ['certificate', enrollmentId],
    queryFn: async () => {
      if (!enrollmentId) return null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          *,
          enrollment:course_enrollments(
            *,
            course:courses(
              *,
              product:products(*)
            )
          )
        `)
        .eq('enrollment_id', enrollmentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!enrollmentId,
  });
};

/**
 * Hook pour créer un certificat
 */
export const useCreateCertificate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      enrollmentId,
      courseId,
    }: {
      enrollmentId: string;
      courseId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Vérifier que le cours est complété à 100%
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('completed_lessons, total_lessons')
        .eq('id', enrollmentId)
        .single();

      if (!enrollment || enrollment.completed_lessons !== enrollment.total_lessons) {
        throw new Error('Vous devez compléter tout le cours pour obtenir le certificat');
      }

      // Récupérer les infos complètes
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          course:courses(
            *,
            product:products(name, store_id)
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollmentError || !enrollment) {
        throw new Error('Enrollment not found');
      }

      // Récupérer le profil utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      // Récupérer l'instructeur
      const { data: instructor } = await supabase
        .from('course_sections')
        .select(`
          lessons:course_lessons(
            instructor_id,
            profiles:instructor_id(full_name)
          )
        `)
        .eq('course_id', courseId)
        .limit(1)
        .maybeSingle();

      // Générer un numéro de certificat unique
      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Créer le certificat (certificate_url sera mis à jour après génération PDF)
      const { data: certificate, error } = await supabase
        .from('course_certificates')
        .insert({
          enrollment_id: enrollmentId,
          course_id: courseId,
          user_id: user.id,
          certificate_number: certificateNumber,
          certificate_url: 'pending', // Temporaire, sera remplacé par l'URL du PDF
          student_name: profile?.full_name || user.email || 'Étudiant',
          course_title: ((enrollment.course as Record<string, unknown>)?.product as Record<string, unknown>)?.name as string || 'Cours',
          instructor_name: ((instructor?.lessons as Array<Record<string, unknown>>)?.[0]?.profiles as Record<string, unknown>)?.full_name as string || 'Emarzona Academy',
          completion_date: enrollment.completion_date ? enrollment.completion_date.split('T')[0] : new Date().toISOString().split('T')[0],
          verification_code: await generateVerificationCode(),
        })
        .select()
        .single();

      if (error) throw error;

      // 🆕 Générer et uploader le PDF
      try {
        const storeId = ((enrollment.course as Record<string, unknown>)?.product as Record<string, unknown>)?.store_id as string | undefined;
        if (storeId && certificate) {
          await generateAndUploadCertificate(
            certificate.id,
            courseId,
            storeId,
            {
              student_name: certificate.student_name,
              course_name: certificate.course_title,
              completion_date: certificate.completion_date,
              certificate_number: certificate.certificate_number,
              instructor_name: certificate.instructor_name,
              verification_code: certificate.verification_code,
            }
          );
        }
      } catch (pdfError) {
        // Ne pas faire échouer la création si le PDF échoue
        logger.warn('Error generating certificate PDF', {
          error: pdfError,
          certificateId: certificate.id,
        });
      }

      return certificate;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['certificate', variables.enrollmentId] });
      toast({
        title: 'Certificat généré ! 🎉',
        description: 'Votre certificat est prêt à être téléchargé.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier si un utilisateur peut obtenir un certificat
 */
export const useCanGetCertificate = (enrollmentId: string | undefined) => {
  return useQuery({
    queryKey: ['can-get-certificate', enrollmentId],
    queryFn: async () => {
      if (!enrollmentId) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Vérifier progression
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('completed_lessons, total_lessons')
        .eq('id', enrollmentId)
        .eq('user_id', user.id)
        .single();

      if (!enrollment) return false;

      // Le certificat est disponible si toutes les leçons sont complétées
      return enrollment.completed_lessons === enrollment.total_lessons && enrollment.total_lessons > 0;
    },
    enabled: !!enrollmentId,
  });
};

/**
 * Génère un code de vérification unique
 */
async function generateVerificationCode(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_certificate_verification_code');
  if (error) {
    // Fallback si la fonction n'existe pas
    return `VERIFY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
  }
  return data;
}

/**
 * Hook pour récupérer tous les certificats d'un utilisateur
 */
export const useMyCertificates = () => {
  return useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('course_certificates')
        .select(`
          *,
          enrollment:course_enrollments(
            *,
            course:courses(
              *,
              product:products(*)
            )
          )
        `)
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};







