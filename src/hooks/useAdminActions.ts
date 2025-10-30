import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/audit";

export const useAdminActions = () => {
  const { toast } = useToast();

  const logAction = async (
    actionType: string,
    targetType: string,
    targetId: string,
    details?: any
  ) => {
    await logAdminAction({
      action: actionType,
      targetType,
      targetId,
      metadata: details ?? {},
    });
  };

  const suspendUser = async (userId: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspension_reason: reason,
          suspended_at: new Date().toISOString(),
          suspended_by: user.id,
        })
        .eq('user_id', userId);

      if (error) throw error;

      await logAction('SUSPEND_USER', 'user', userId, { reason });

      toast({
        title: "Utilisateur suspendu",
        description: "Le compte a été suspendu avec succès.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const unsuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      await logAction('UNSUSPEND_USER', 'user', userId);

      toast({
        title: "Utilisateur réactivé",
        description: "Le compte a été réactivé avec succès.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await logAction('DELETE_USER', 'user', userId);

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Utilisateur supprimé",
        description: "Le compte a été supprimé avec succès.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      await logAction('DELETE_STORE', 'store', storeId);

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      toast({
        title: "Boutique supprimée",
        description: "La boutique a été supprimée avec succès.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const setUserRole = async (userId: string, role: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Optional: ensure caller is super admin
      const { data: me } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!me?.is_super_admin) throw new Error('Action réservée au super administrateur');

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('user_id', userId);
      if (error) throw error;

      await logAction('SET_USER_ROLE', 'user', userId, { role });

      toast({ title: 'Rôle mis à jour', description: `Nouveau rôle: ${role}` });
      return true;
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const promoteToAdmin = async (email: string, role: string = 'admin') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check super admin
      const { data: me } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!me?.is_super_admin) throw new Error('Action réservée au super administrateur');

      // Find target profile by email
      const { data: target } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      if (!target?.user_id) throw new Error('Utilisateur introuvable');

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('user_id', target.user_id);
      if (error) throw error;

      await logAction('PROMOTE_ADMIN', 'user', target.user_id, { email, role });

      toast({ title: 'Administrateur ajouté', description: `${email} → ${role}` });
      return true;
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await logAction('DELETE_PRODUCT', 'product', productId);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Produit supprimé",
        description: "Le produit a été supprimé avec succès.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);

      if (error) throw error;

      await logAction(
        isActive ? 'DEACTIVATE_PRODUCT' : 'ACTIVATE_PRODUCT',
        'product',
        productId
      );

      toast({
        title: isActive ? "Produit désactivé" : "Produit activé",
        description: "Le statut du produit a été mis à jour.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      await logAction('CANCEL_ORDER', 'order', orderId);

      toast({
        title: "Commande annulée",
        description: "La commande a été annulée avec succès.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    suspendUser,
    unsuspendUser,
    deleteUser,
    deleteStore,
    deleteProduct,
    toggleProductStatus,
    cancelOrder,
    setUserRole,
    promoteToAdmin,
  };
};
