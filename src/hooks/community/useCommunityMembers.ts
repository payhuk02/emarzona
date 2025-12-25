/**
 * Hooks pour la gestion des membres de la communauté
 * Date: 31 Janvier 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityMember, CommunityMemberFormData, CommunityMembersFilter } from '@/types/community';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Fetch all community members with filters
export function useCommunityMembers(filter?: CommunityMembersFilter) {
  return useQuery({
    queryKey: ['community-members', filter],
    queryFn: async () => {
      let query = supabase
        .from('community_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.status && filter.status.length > 0) {
        query = query.in('status', filter.status);
      }

      if (filter?.role && filter.role.length > 0) {
        query = query.in('role', filter.role);
      }

      if (filter?.country) {
        query = query.eq('country', filter.country);
      }

      if (filter?.search) {
        query = query.or(`first_name.ilike.%${filter.search}%,last_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%,profession.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching community members', { error });
        throw error;
      }

      return data as CommunityMember[];
    },
  });
}

// Fetch single community member
export function useCommunityMember(memberId: string) {
  return useQuery({
    queryKey: ['community-member', memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) {
        logger.error('Error fetching community member', { error });
        throw error;
      }

      return data as CommunityMember;
    },
    enabled: !!memberId,
  });
}

// Fetch current user's community member profile
export function useCurrentCommunityMember() {
  return useQuery({
    queryKey: ['current-community-member'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // PGRST116 = no rows returned (user doesn't have a profile yet)
      // This is expected and not an error
      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching current community member', { error });
        // Don't throw for 403 errors - user might not have permission yet
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          return null;
        }
        throw error;
      }

      return data as CommunityMember | null;
    },
    retry: false, // Don't retry on auth errors
  });
}

// Create community member
export function useCreateCommunityMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (formData: CommunityMemberFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('community_members')
        .insert({
          user_id: user.id,
          ...formData,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating community member', { error });
        throw error;
      }

      return data as CommunityMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
      queryClient.invalidateQueries({ queryKey: ['current-community-member'] });
      toast({
        title: 'Demande envoyée',
        description: 'Votre demande d\'adhésion à la communauté a été envoyée avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

// Update community member
export function useUpdateCommunityMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId, formData }: { memberId: string; formData: Partial<CommunityMemberFormData> }) => {
      const { data, error } = await supabase
        .from('community_members')
        .update(formData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating community member', { error });
        throw error;
      }

      return data as CommunityMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
      queryClient.invalidateQueries({ queryKey: ['community-member', data.id] });
      queryClient.invalidateQueries({ queryKey: ['current-community-member'] });
      toast({
        title: 'Profil mis à jour',
        description: 'Votre profil a été mis à jour avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

// Update member status (admin only)
export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: CommunityMember['status'] }) => {
      const { data, error } = await supabase
        .from('community_members')
        .update({ status })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating member status', { error });
        throw error;
      }

      return data as CommunityMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du membre a été mis à jour avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

// Delete community member
export function useDeleteCommunityMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('id', memberId);

      if (error) {
        logger.error('Error deleting community member', { error });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-members'] });
      toast({
        title: 'Membre supprimé',
        description: 'Le membre a été supprimé de la communauté.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
}

