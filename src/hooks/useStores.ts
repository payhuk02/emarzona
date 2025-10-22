import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  about?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  // Domain management fields
  custom_domain?: string | null;
  domain_status?: 'not_configured' | 'pending' | 'verified' | 'error';
  domain_verification_token?: string | null;
  domain_verified_at?: string | null;
  domain_error_message?: string | null;
  ssl_enabled?: boolean;
  redirect_www?: boolean;
  redirect_https?: boolean;
  dns_records?: any[];
}

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const MAX_STORES_PER_USER = 3;

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Utilisateur non authentifié');
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStores(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du chargement des boutiques:', err.message);
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos boutiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canCreateStore = () => {
    return stores.length < MAX_STORES_PER_USER;
  };

  const getRemainingStores = () => {
    return MAX_STORES_PER_USER - stores.length;
  };

  const createStore = async (storeData: Partial<Store>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      if (!canCreateStore()) {
        throw new Error(`Vous ne pouvez créer que ${MAX_STORES_PER_USER} boutiques maximum`);
      }

      const { data, error } = await supabase
        .from('stores')
        .insert([{
          ...storeData,
          user_id: user.id,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste des boutiques
      await fetchStores();
      
      toast({
        title: "Boutique créée",
        description: "Votre nouvelle boutique a été créée avec succès"
      });

      return data;
    } catch (err: any) {
      console.error('Erreur lors de la création de la boutique:', err.message);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer la boutique",
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', storeId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste des boutiques
      await fetchStores();
      
      toast({
        title: "Boutique mise à jour",
        description: "Les modifications ont été enregistrées"
      });

      return data;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la boutique:', err.message);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la boutique",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste des boutiques
      await fetchStores();
      
      toast({
        title: "Boutique supprimée",
        description: "La boutique a été supprimée avec succès"
      });
    } catch (err: any) {
      console.error('Erreur lors de la suppression de la boutique:', err.message);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la boutique",
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return {
    stores,
    loading,
    error,
    canCreateStore,
    getRemainingStores,
    createStore,
    updateStore,
    deleteStore,
    refetch: fetchStores
  };
};
