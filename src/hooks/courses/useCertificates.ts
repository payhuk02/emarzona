/**
 * Hooks pour gérer les certificats
 * Date : 27 octobre 2025
 * Phase : 6 - Quiz et Certificats
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

      // Générer un numéro de certificat unique
      const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Créer le certificat
      const { data, error } = await supabase
        .from('course_certificates')
        .insert({
          enrollment_id: enrollmentId,
          course_id: courseId,
          user_id: user.id,
          certificate_number: certificateNumber,
          issued_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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

