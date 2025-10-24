import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: string;
  is_suspended: boolean;
  suspension_reason: string | null;
}

// Types pour le tri (uniquement colonnes qui existent dans profiles)
type SortColumn = 'created_at' | 'display_name';
type SortDirection = 'asc' | 'desc';

// Types pour les filtres
export interface UserFilters {
  role?: 'admin' | 'user' | 'all';
  status?: 'active' | 'suspended' | 'all';
  searchTerm?: string;
}

interface UseAllUsersOptions {
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortDirection?: SortDirection;
  filters?: UserFilters;
}

export const useAllUsers = (options: UseAllUsersOptions = {}) => {
  const {
    page = 1,
    pageSize = 20,
    sortBy = 'created_at',
    sortDirection = 'desc',
    filters = {},
  } = options;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      logger.log('Fetching users with options:', { page, pageSize, sortBy, sortDirection, filters });

      // Construire la requête de base
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      // Appliquer les filtres
      if (filters.status === 'active') {
        query = query.eq('is_suspended', false);
      } else if (filters.status === 'suspended') {
        query = query.eq('is_suspended', true);
      }

      // Appliquer la recherche (display_name, first_name, last_name uniquement)
      // Note: email n'est pas dans profiles, il est dans auth.users
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const search = filters.searchTerm.trim().toLowerCase();
        query = query.or(`display_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      // Appliquer le tri
      query = query.order(sortBy, { ascending: sortDirection === 'asc' });

      // Appliquer la pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Exécuter la requête
      const { data: profilesData, error: profilesError, count } = await query;

      if (profilesError) {
        logger.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      setTotalCount(count || 0);
      logger.log('Profiles fetched:', profilesData?.length, 'Total:', count);

      if (!profilesData || profilesData.length === 0) {
        setUsers([]);
        return;
      }

      // Récupérer les emails pour tous les utilisateurs en une seule requête RPC
      const userIds = profilesData.map(p => p.user_id);
      const { data: emailsData, error: emailsError } = await supabase
        .rpc('get_users_emails', { p_user_ids: userIds });

      if (emailsError) {
        logger.error('Error fetching emails:', emailsError);
      }

      // Créer une map user_id => email pour un accès rapide
      const emailMap = new Map<string, string>();
      if (emailsData) {
        emailsData.forEach((item: any) => {
          emailMap.set(item.user_id, item.email);
        });
      }

      // Récupérer les rôles pour chaque utilisateur
      const usersWithDetails = await Promise.all(
        profilesData.map(async (profile) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .limit(1);

          const userRole = roleData && roleData.length > 0 ? roleData[0].role : 'user';
          const email = emailMap.get(profile.user_id) || profile.display_name || 'Utilisateur';

          return {
            id: profile.id,
            user_id: profile.user_id,
            email: email,
            display_name: profile.display_name,
            first_name: profile.first_name,
            last_name: profile.last_name,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
            role: userRole,
            is_suspended: profile.is_suspended || false,
            suspension_reason: profile.suspension_reason,
          };
        })
      );

      // Appliquer filtre par rôle (côté client car user_roles est une table séparée)
      let filteredUsers = usersWithDetails;
      if (filters.role && filters.role !== 'all') {
        filteredUsers = usersWithDetails.filter(user => user.role === filters.role);
      }

      setUsers(filteredUsers);
      logger.log('Users loaded:', filteredUsers.length);

    } catch (error: any) {
      logger.error('Failed to fetch users:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les utilisateurs",
        variant: "destructive",
      });
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, sortDirection, filters.role, filters.status, filters.searchTerm]);

  return {
    users,
    totalCount,
    loading,
    refetch: fetchUsers,
  };
};
