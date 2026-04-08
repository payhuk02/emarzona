import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';

export interface CustomDomain {
  id: string;
  store_id: string;
  domain: string;
  status: 'pending' | 'verifying' | 'verified' | 'active' | 'error' | 'removed';
  verification_token: string;
  verification_method: 'dns_txt' | 'dns_cname' | 'file';
  ssl_status: 'pending' | 'provisioning' | 'active' | 'error' | 'expired';
  ssl_expires_at: string | null;
  dns_records: Record<string, unknown>[];
  is_primary: boolean;
  error_message: string | null;
  verified_at: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustomDomains() {
  const { selectedStoreId } = useStoreContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const domainsQuery = useQuery({
    queryKey: ['custom-domains', selectedStoreId],
    queryFn: async () => {
      if (!selectedStoreId) return [];
      const { data, error } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('store_id', selectedStoreId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as CustomDomain[];
    },
    enabled: !!selectedStoreId,
  });

  const addDomain = useMutation({
    mutationFn: async (domain: string) => {
      if (!selectedStoreId) throw new Error('Aucune boutique sélectionnée');

      const cleanDomain = domain.toLowerCase().trim().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '');

      if (!cleanDomain || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleanDomain)) {
        throw new Error('Format de domaine invalide');
      }

      const { data, error } = await supabase
        .from('custom_domains')
        .insert({
          store_id: selectedStoreId,
          domain: cleanDomain,
          status: 'pending',
          verification_method: 'dns_txt',
          ssl_status: 'pending',
          is_primary: false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('Ce domaine est déjà enregistré');
        throw error;
      }
      return data as unknown as CustomDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domains', selectedStoreId] });
      toast({ title: 'Domaine ajouté', description: 'Configurez vos enregistrements DNS pour vérifier la propriété.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey =
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/verify-custom-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify({ domain_id: domainId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la vérification');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-domains', selectedStoreId] });
      if (data.verified) {
        toast({ title: '✅ Domaine vérifié', description: 'Votre domaine a été vérifié avec succès !' });
      } else {
        toast({ title: 'Vérification en cours', description: data.message || 'Les enregistrements DNS n\'ont pas encore été détectés.', variant: 'destructive' });
      }
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur de vérification', description: error.message, variant: 'destructive' });
    },
  });

  const removeDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', domainId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domains', selectedStoreId] });
      toast({ title: 'Domaine supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const setPrimary = useMutation({
    mutationFn: async (domainId: string) => {
      if (!selectedStoreId) throw new Error('Aucune boutique sélectionnée');

      // Reset all domains to non-primary
      await supabase
        .from('custom_domains')
        .update({ is_primary: false })
        .eq('store_id', selectedStoreId);

      // Set selected as primary
      const { error } = await supabase
        .from('custom_domains')
        .update({ is_primary: true })
        .eq('id', domainId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domains', selectedStoreId] });
      toast({ title: 'Domaine principal défini' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return {
    domains: domainsQuery.data || [],
    isLoading: domainsQuery.isLoading,
    isError: domainsQuery.isError,
    addDomain,
    verifyDomain,
    removeDomain,
    setPrimary,
  };
}
