import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreContext } from '@/contexts/StoreContext';
import {
  cancelSponsorship,
  checkoutPaidSponsorship,
  createPaidSponsorship,
  createPlanSponsorship,
  fetchPlanSponsorQuota,
  fetchSponsorshipSkus,
  fetchStoreSponsorships,
  type SponsorshipSku,
} from '@/lib/sponsorship/marketplace-sponsorship';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const SKUS_KEY = ['marketplace-sponsorship-skus'] as const;

export function useSponsorshipSkus() {
  return useQuery({
    queryKey: SKUS_KEY,
    queryFn: fetchSponsorshipSkus,
    staleTime: 60_000,
  });
}

export function useStoreSponsorships() {
  const { selectedStore } = useStoreContext();
  const storeId = selectedStore?.id;

  return useQuery({
    queryKey: ['marketplace-sponsorships', storeId],
    queryFn: () => fetchStoreSponsorships(storeId!),
    enabled: Boolean(storeId),
  });
}

export function usePlanSponsorQuota() {
  const { selectedStore } = useStoreContext();
  const storeId = selectedStore?.id;

  return useQuery({
    queryKey: ['marketplace-sponsor-quota', storeId],
    queryFn: () => fetchPlanSponsorQuota(storeId!),
    enabled: Boolean(storeId),
  });
}

export function useCreatePlanSponsorship() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { selectedStore } = useStoreContext();

  return useMutation({
    mutationFn: (productId: string) => createPlanSponsorship(productId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['marketplace-sponsorships', selectedStore?.id] });
      toast({ title: 'Produit sponsorisé', description: 'Quota plan utilisé avec succès.' });
    },
    onError: (error: Error) => {
      logger.error('createPlanSponsorship failed', { error });
      toast({
        title: 'Impossible de sponsoriser',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCheckoutPaidSponsorship() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedStore } = useStoreContext();

  return useMutation({
    mutationFn: async ({ productId, sku }: { productId: string; sku: SponsorshipSku }) => {
      if (!selectedStore?.id) throw new Error('Boutique introuvable');
      if (!user?.email) throw new Error('Email utilisateur requis pour le paiement');

      const sponsorship = await createPaidSponsorship(productId, sku.slug);
      const checkoutUrl = await checkoutPaidSponsorship({
        storeId: selectedStore.id,
        sponsorship,
        sku,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name as string | undefined,
      });
      return checkoutUrl;
    },
    onSuccess: checkoutUrl => {
      void qc.invalidateQueries({ queryKey: ['marketplace-sponsorships', selectedStore?.id] });
      window.location.href = checkoutUrl;
    },
    onError: (error: Error) => {
      logger.error('checkoutPaidSponsorship failed', { error });
      toast({
        title: 'Paiement impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelSponsorship() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { selectedStore } = useStoreContext();

  return useMutation({
    mutationFn: (sponsorshipId: string) => cancelSponsorship(sponsorshipId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['marketplace-sponsorships', selectedStore?.id] });
      toast({ title: 'Campagne annulée' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Annulation impossible',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
