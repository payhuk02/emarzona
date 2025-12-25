import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminAction {
  id: string;
  admin_id: string | null | undefined;
  action_type: string | null | undefined;
  target_type: string | null | undefined;
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
          // Vérifier que admin_id existe avant de faire la requête
          if (!action.admin_id) {
            return {
              ...action,
              admin_name: 'Admin inconnu',
            };
          }

          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', action.admin_id)
            .limit(1);

          return {
            ...action,
            admin_name: profileData && profileData.length > 0 ? profileData[0].display_name || 'Admin' : 'Admin',
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
