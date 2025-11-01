import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  commissionRate: number;
}

export interface ReferralUser {
  id: string;
  referred_id: string;
  created_at: string;
  status: string;
  user?: {
    email: string;
    name?: string;
  };
  total_orders?: number;
  total_spent?: number;
}

export interface ReferralCommission {
  id: string;
  commission_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
  order?: {
    order_number?: string;
  };
  referred?: {
    email?: string;
  };
}

export const useReferral = () => {
  const [data, setData] = useState<ReferralData | null>(null);
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const { toast } = useToast();

  const fetchReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Récupérer le profil avec le code de parrainage
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code, total_referral_earnings')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        logger.error('Error fetching profile', { error: profileError.message });
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profil non trouvé');
      }

      // Récupérer le taux de commission depuis les paramètres de la plateforme
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('referral_commission_rate')
        .single();
      
      const commissionRate = platformSettings?.referral_commission_rate || 2.00;

      // Récupérer le nombre total de filleuls
      const { data: allReferrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id);

      if (referralsError) {
        logger.error('Error fetching referrals', { error: referralsError.message });
        throw referralsError;
      }

      // Récupérer le nombre de filleuls actifs
      const { data: activeReferrals, error: activeError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('status', 'active');

      if (activeError) {
        logger.error('Error fetching active referrals', { error: activeError.message });
      }

      // Récupérer les statistiques de commissions
      const { data: allCommissions, error: commissionsError } = await supabase
        .from('referral_commissions')
        .select('commission_amount, status')
        .eq('referrer_id', user.id);

      if (commissionsError) {
        logger.error('Error fetching commissions', { error: commissionsError.message });
      }

      // Calculer les gains par statut
      const pendingEarnings = allCommissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0;
      const paidEarnings = allCommissions?.filter(c => c.status === 'paid' || c.status === 'completed').reduce((sum, c) => sum + Number(c.commission_amount || 0), 0) || 0;

      const baseUrl = window.location.origin;
      const referralLink = `${baseUrl}/?ref=${profileData.referral_code || ''}`;

      setData({
        referralCode: profileData.referral_code || '',
        referralLink,
        totalReferrals: allReferrals?.length || 0,
        activeReferrals: activeReferrals?.length || 0,
        totalEarnings: profileData.total_referral_earnings || 0,
        pendingEarnings,
        paidEarnings,
        commissionRate,
      });
    } catch (error: any) {
      logger.error('Error in fetchReferralData', { error: error.message });
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données de parrainage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      setReferralsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Récupérer d'abord la liste des referrals
      const { data: referralsData, error } = await supabase
        .from('referrals')
        .select('id, referred_id, created_at, status')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching referrals list', { error: error.message });
        throw error;
      }

      if (!referralsData || referralsData.length === 0) {
        setReferrals([]);
        return;
      }

      // Récupérer les profils des filleuls
      const referredIds = referralsData.map((r: any) => r.referred_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name')
        .in('user_id', referredIds);

      if (profilesError) {
        logger.error('Error fetching profiles', { error: profilesError.message });
        // Continuer même si erreur sur les profils
      }

      // Créer un map pour accéder rapidement aux profils
      const profilesMap = new Map();
      (profilesData || []).forEach((profile: any) => {
        profilesMap.set(profile.user_id, profile);
      });

      // Récupérer les emails depuis auth.users via une fonction RPC ou directement
      // Pour l'instant, on va utiliser les profils disponibles
      const referralsWithStats = referralsData.map((ref: any) => {
        const profile = profilesMap.get(ref.referred_id);
        const fullName = profile
          ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name
          : undefined;

        return {
          id: ref.id,
          referred_id: ref.referred_id,
          created_at: ref.created_at,
          status: ref.status,
          user: {
            email: '', // Email sera récupéré depuis auth.users si nécessaire
            name: fullName,
          },
          total_orders: 0,
          total_spent: 0,
        };
      });

      // Enrichir avec les emails depuis auth.users (si possible via une vue ou fonction)
      // Pour l'instant, on garde cette structure simple
      setReferrals(referralsWithStats);
    } catch (error: any) {
      logger.error('Error fetching referrals', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des filleuls",
        variant: "destructive",
      });
    } finally {
      setReferralsLoading(false);
    }
  };

  const fetchCommissions = async () => {
    try {
      setCommissionsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: commissionsData, error } = await supabase
        .from('referral_commissions')
        .select(`
          id,
          commission_amount,
          total_amount,
          status,
          created_at,
          paid_at,
          order_id,
          referred_id,
          orders:order_id (
            order_number
          )
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching commissions', { error: error.message });
        throw error;
      }

      // Enrichir avec les données de base (sans email pour l'instant car profiles n'a pas email)
      const enrichedCommissions = (commissionsData || []).map((comm: any) => ({
        id: comm.id,
        commission_amount: comm.commission_amount,
        total_amount: comm.total_amount,
        status: comm.status,
        created_at: comm.created_at,
        paid_at: comm.paid_at,
        order_id: comm.order_id,
        referred_id: comm.referred_id,
        order: {
          order_number: comm.orders?.order_number || undefined,
        },
        referred: {
          email: undefined, // Email non disponible directement depuis profiles
        },
      }));

      setCommissions(enrichedCommissions);
    } catch (error: any) {
      logger.error('Error fetching commissions', { error: error.message });
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des commissions",
        variant: "destructive",
      });
    } finally {
      setCommissionsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  return {
    data,
    referrals,
    commissions,
    loading,
    referralsLoading,
    commissionsLoading,
    refetch: fetchReferralData,
    refetchReferrals: fetchReferrals,
    refetchCommissions: fetchCommissions,
  };
};
