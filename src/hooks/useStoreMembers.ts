/**
 * Store Members Hooks
 * Date: 2 Février 2025
 * 
 * Hooks pour gérer les membres d'équipe d'une boutique
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { sendTeamInvitationNotification } from '@/lib/team/team-notifications';

// =====================================================
// TYPES
// =====================================================

export interface StoreMember {
  id: string;
  store_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff' | 'support' | 'viewer';
  permissions: Record<string, boolean>;
  invited_by: string;
  invited_at: string;
  invitation_token: string | null;
  invitation_expires_at: string;
  status: 'pending' | 'active' | 'inactive' | 'removed';
  joined_at: string | null;
  removed_at: string | null;
  removed_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relations
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
  invited_by_user?: {
    id: string;
    email: string;
    user_metadata?: {
      display_name?: string;
    };
  };
}

export interface StoreMemberInviteData {
  email: string;
  role: 'manager' | 'staff' | 'support' | 'viewer';
  permissions?: Record<string, boolean>;
  message?: string;
}

export interface StoreMemberUpdateData {
  role?: 'manager' | 'staff' | 'support' | 'viewer';
  permissions?: Record<string, boolean>;
  status?: 'active' | 'inactive';
}

// =====================================================
// HOOK: useStoreMembers
// =====================================================

export const useStoreMembers = (storeId: string | null) => {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['store-members', storeId],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const { data, error } = await supabase
        .from('store_members')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching store members:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Récupérer les profils des membres
      const userIds = [
        ...new Set(data.map((m) => m.user_id).concat(data.map((m) => m.invited_by).filter(Boolean))),
      ];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      // Récupérer les emails via la fonction RPC
      const { data: emailsData } = await supabase.rpc('get_users_emails', {
        p_user_ids: userIds,
      });

      const emailMap = new Map<string, string>();
      if (emailsData) {
        emailsData.forEach((item: { user_id: string; email: string }) => {
          emailMap.set(item.user_id, item.email);
        });
      }

      // Combiner les données
      const membersWithUsers = data.map((member) => {
        const profile = profiles?.find((p) => p.user_id === member.user_id);
        const inviterProfile = profiles?.find((p) => p.user_id === member.invited_by);
        const email = emailMap.get(member.user_id) || '';
        const inviterEmail = member.invited_by ? emailMap.get(member.invited_by) || '' : '';

        return {
          ...member,
          user: profile
            ? {
                id: member.user_id,
                email: email,
                user_metadata: {
                  display_name: profile.display_name,
                  avatar_url: profile.avatar_url,
                },
              }
            : {
                id: member.user_id,
                email: email,
                user_metadata: {},
              },
          invited_by_user: inviterProfile && member.invited_by
            ? {
                id: member.invited_by,
                email: inviterEmail,
                user_metadata: {
                  display_name: inviterProfile.display_name,
                },
              }
            : member.invited_by
            ? {
                id: member.invited_by,
                email: inviterEmail,
                user_metadata: {},
              }
            : undefined,
        };
      });

      return membersWithUsers as StoreMember[];
    },
    enabled: !!storeId,
    staleTime: 30000, // 30 secondes
  });
};

// =====================================================
// HOOK: useStoreMemberInvite
// =====================================================

export const useStoreMemberInvite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ storeId, inviteData }: { storeId: string; inviteData: StoreMemberInviteData }) => {
      // Générer un token d'invitation unique
      const invitationToken = crypto.randomUUID();

      // Vérifier si l'utilisateur existe
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('email', inviteData.email)
        .single();

      let userId: string | null = null;

      if (existingUser) {
        userId = existingUser.user_id;
      } else {
        // Si l'utilisateur n'existe pas, on devra créer l'invitation différemment
        // Pour l'instant, on retourne une erreur
        throw new Error('L\'utilisateur doit d\'abord créer un compte sur la plateforme');
      }

      // Vérifier si l'utilisateur n'est pas déjà membre
      const { data: existingMember } = await supabase
        .from('store_members')
        .select('id')
        .eq('store_id', storeId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('Cet utilisateur est déjà membre de cette boutique');
      }

      // Créer l'invitation
      const { data, error } = await supabase
        .from('store_members')
        .insert({
          store_id: storeId,
          user_id: userId,
          role: inviteData.role,
          permissions: inviteData.permissions || {},
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          invitation_token: invitationToken,
          invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error inviting store member:', error);
        throw error;
      }

      // Récupérer les informations de la boutique et de l'inviteur
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single();

      const { data: inviterData } = await supabase.auth.getUser();

      // Envoyer les notifications (email + in-app)
      await sendTeamInvitationNotification({
        storeId,
        storeName: storeData?.name || 'Boutique',
        inviterEmail: inviterData.user?.email || '',
        inviterName: inviterData.user?.user_metadata?.display_name,
        memberEmail: inviteData.email,
        role: inviteData.role,
        invitationToken: invitationToken,
        message: inviteData.message,
      }).catch((err) => {
        logger.warn('Error sending invitation notification', { error: err });
      });

      return data as StoreMember;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-members', variables.storeId] });
      toast({
        title: 'Invitation envoyée',
        description: `Une invitation a été envoyée à ${variables.inviteData.email}`,
      });
    },
    onError: (error: Error) => {
      logger.error('Error inviting store member:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer l\'invitation',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreMemberUpdate
// =====================================================

export const useStoreMemberUpdate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      memberId,
      updateData,
    }: {
      storeId: string;
      memberId: string;
      updateData: StoreMemberUpdateData;
    }) => {
      const { data, error } = await supabase
        .from('store_members')
        .update(updateData)
        .eq('id', memberId)
        .eq('store_id', storeId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating store member:', error);
        throw error;
      }

      return data as StoreMember;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-members', variables.storeId] });
      toast({
        title: 'Membre mis à jour',
        description: 'Les modifications ont été enregistrées',
      });
    },
    onError: (error: Error) => {
      logger.error('Error updating store member:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le membre',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreMemberRemove
// =====================================================

export const useStoreMemberRemove = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ storeId, memberId }: { storeId: string; memberId: string }) => {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.data.user?.id;

      if (!userId) {
        throw new Error('Non authentifié');
      }

      // Marquer comme retiré plutôt que supprimer
      const { data, error } = await supabase
        .from('store_members')
        .update({
          status: 'removed',
          removed_at: new Date().toISOString(),
          removed_by: userId,
        })
        .eq('id', memberId)
        .eq('store_id', storeId)
        .select()
        .single();

      if (error) {
        logger.error('Error removing store member:', error);
        throw error;
      }

      return data as StoreMember;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-members', variables.storeId] });
      toast({
        title: 'Membre retiré',
        description: 'Le membre a été retiré de l\'équipe',
      });
    },
    onError: (error: Error) => {
      logger.error('Error removing store member:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de retirer le membre',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreMemberAcceptInvitation
// =====================================================

export const useStoreMemberAcceptInvitation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (token: string) => {
      const { data, error } = await supabase.rpc('accept_store_invitation', {
        _token: token,
      });

      if (error) {
        logger.error('Error accepting invitation:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Invitation invalide ou expirée');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-members'] });
      toast({
        title: 'Invitation acceptée',
        description: 'Vous avez rejoint l\'équipe avec succès',
      });
    },
    onError: (error: Error) => {
      logger.error('Error accepting invitation:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'accepter l\'invitation',
        variant: 'destructive',
      });
    },
  });
};

// =====================================================
// HOOK: useStoreMemberPermissions
// =====================================================

export const useStoreMemberPermissions = (storeId: string | null, userId?: string) => {
  return useQuery({
    queryKey: ['store-member-permissions', storeId, userId],
    queryFn: async () => {
      if (!storeId || !userId) {
        return null;
      }

      const { data, error } = await supabase.rpc('get_store_member_role', {
        _store_id: storeId,
        _user_id: userId,
      });

      if (error) {
        logger.error('Error fetching member permissions:', error);
        return null;
      }

      return data;
    },
    enabled: !!storeId && !!userId,
  });
};

// =====================================================
// HOOK: useHasStorePermission
// =====================================================

export const useHasStorePermission = (
  storeId: string | null,
  permission: string,
  userId?: string
) => {
  return useQuery({
    queryKey: ['has-store-permission', storeId, permission, userId],
    queryFn: async () => {
      if (!storeId || !userId) {
        return false;
      }

      const { data, error } = await supabase.rpc('has_store_permission', {
        _store_id: storeId,
        _user_id: userId,
        _permission: permission,
      });

      if (error) {
        logger.error('Error checking store permission:', error);
        return false;
      }

      return data as boolean;
    },
    enabled: !!storeId && !!userId && !!permission,
  });
};

