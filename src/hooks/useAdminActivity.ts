/**
 * LOT 2 Disk I/O: N SELECT profiles → 1 batch .in('user_id', …)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ADMIN_ACTION_FIELDS =
  'id, admin_id, action_type, target_type, target_id, details, created_at';

export interface AdminAction {
  id: string;
  admin_id: string | null | undefined;
  action_type: string | null | undefined;
  target_type: string | null | undefined;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
}

export const useAdminActivity = () => {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select(ADMIN_ACTION_FIELDS)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const rows = data || [];
      const adminIds = [
        ...new Set(
          rows
            .map(a => a.admin_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
        ),
      ];

      const nameByUserId = new Map<string, string>();
      if (adminIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', adminIds);

        for (const p of profilesData || []) {
          if (p.user_id) {
            nameByUserId.set(p.user_id, p.display_name || 'Admin');
          }
        }
      }

      const actionsWithNames = rows.map(action => ({
        ...action,
        admin_name: action.admin_id
          ? nameByUserId.get(action.admin_id) || 'Admin'
          : 'Admin inconnu',
      }));

      setActions(actionsWithNames);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  return { actions, loading, refetch: fetchActions };
};
