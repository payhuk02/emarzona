/**
 * Drip Content Hooks for Courses
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer le déverrouillage automatique du contenu drip
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface SectionUnlockStatus {
  section_id: string;
  course_id: string;
  enrollment_id: string;
  is_unlocked: boolean;
  unlock_date: string | null;
  days_until_unlock: number | null;
}

export interface UnlockedSections {
  section_id: string;
  is_unlocked: boolean;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useCheckSectionUnlock - Vérifie si une section est déverrouillée
 */
export const useCheckSectionUnlock = (
  courseId: string | undefined,
  sectionId: string | undefined,
  enrollmentId: string | undefined
) => {
  return useQuery({
    queryKey: ['section-unlock', courseId, sectionId, enrollmentId],
    queryFn: async () => {
      if (!courseId || !sectionId || !enrollmentId) {
        throw new Error('IDs manquants');
      }

      const { data, error } = await supabase.rpc('check_drip_unlock', {
        p_course_id: courseId,
        p_section_id: sectionId,
        p_enrollment_id: enrollmentId,
      });

      if (error) {
        logger.error('Error checking section unlock', { error, courseId, sectionId, enrollmentId });
        throw error;
      }

      return data as boolean;
    },
    enabled: !!courseId && !!sectionId && !!enrollmentId,
  });
};

/**
 * useUnlockedSections - Récupère toutes les sections déverrouillées
 */
export const useUnlockedSections = (
  courseId: string | undefined,
  enrollmentId: string | undefined
) => {
  return useQuery({
    queryKey: ['unlocked-sections', courseId, enrollmentId],
    queryFn: async () => {
      if (!courseId || !enrollmentId) {
        throw new Error('IDs manquants');
      }

      const { data, error } = await supabase.rpc('get_unlocked_sections', {
        p_course_id: courseId,
        p_enrollment_id: enrollmentId,
      });

      if (error) {
        logger.error('Error fetching unlocked sections', { error, courseId, enrollmentId });
        throw error;
      }

      return (data || []) as UnlockedSections[];
    },
    enabled: !!courseId && !!enrollmentId,
  });
};

/**
 * useNextUnlockDate - Récupère la prochaine date de déverrouillage
 */
export const useNextUnlockDate = (
  courseId: string | undefined,
  sectionId: string | undefined,
  enrollmentId: string | undefined
) => {
  return useQuery({
    queryKey: ['next-unlock-date', courseId, sectionId, enrollmentId],
    queryFn: async () => {
      if (!courseId || !sectionId || !enrollmentId) {
        throw new Error('IDs manquants');
      }

      const { data, error } = await supabase.rpc('get_next_unlock_date', {
        p_course_id: courseId,
        p_section_id: sectionId,
        p_enrollment_id: enrollmentId,
      });

      if (error) {
        logger.error('Error fetching next unlock date', { error, courseId, sectionId, enrollmentId });
        throw error;
      }

      return data as string | null;
    },
    enabled: !!courseId && !!sectionId && !!enrollmentId,
  });
};

/**
 * useSectionUnlockStatus - Récupère le statut de déverrouillage d'une section
 */
export const useSectionUnlockStatus = (
  sectionId: string | undefined,
  enrollmentId: string | undefined
) => {
  return useQuery({
    queryKey: ['section-unlock-status', sectionId, enrollmentId],
    queryFn: async () => {
      if (!sectionId || !enrollmentId) {
        throw new Error('IDs manquants');
      }

      const { data, error } = await supabase
        .from('course_section_unlock_status')
        .select('*')
        .eq('section_id', sectionId)
        .eq('enrollment_id', enrollmentId)
        .single();

      if (error) {
        logger.error('Error fetching section unlock status', { error, sectionId, enrollmentId });
        throw error;
      }

      return data as SectionUnlockStatus;
    },
    enabled: !!sectionId && !!enrollmentId,
  });
};

