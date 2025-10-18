import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  details: any;
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
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Récupérer les noms des admins
      const actionsWithNames = await Promise.all(
        (data || []).map(async (action) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', action.admin_id)
            .single();

          return {
            ...action,
            admin_name: profile?.display_name || 'Admin',
          };
        })
      );

      setActions(actionsWithNames);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
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
