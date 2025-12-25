import { useState, useEffect, useCallback } from "react";
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

      // Si le code de parrainage est manquant, le générer via RPC
      if (!profileData.referral_code) {
        logger.warn('Referral code missing, generating one', { userId: user.id });
        
        // Générer un code via la fonction Supabase
        const { data: newCode, error: generateError } = await supabase
          .rpc('generate_referral_code');

        if (!generateError && newCode) {
          // Mettre à jour le profil avec le nouveau code
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ referral_code: newCode })
            .eq('user_id', user.id);

          if (!updateError) {
            profileData.referral_code = newCode;
            logger.info('Referral code generated and saved', { userId: user.id, code: newCode });
          } else {
            logger.error('Error updating profile with referral code', { error: updateError.message });
          }
        } else {
          // Fallback : générer un code côté client si la fonction RPC échoue
          const fallbackCode = `REF${user.id.substring(0, 8).toUpperCase()}`;
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ referral_code: fallbackCode })
            .eq('user_id', user.id);

          if (!updateError) {
            profileData.referral_code = fallbackCode;
            logger.info('Fallback referral code generated', { userId: user.id, code: fallbackCode });
          }
        }
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Error in fetchReferralData', { error: errorMessage });
      toast({
        title: "Erreur",
        description: errorMessage || "Impossible de charger les données de parrainage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReferrals = useCallback(async () => {
    try {
      setReferralsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setReferrals([]);
        setReferralsLoading(false);
        return;
      }

      logger.info('Fetching referrals', { referrerId: user.id });

      // Option 1: Récupérer depuis referrals table
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('id, referred_id, created_at, status, referral_code')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        logger.error('Error fetching referrals list', { error: referralsError.message });
        throw referralsError;
      }

      logger.info('Referrals fetched', { count: referralsData?.length || 0 });

      // Si pas de données, retourner tableau vide
      if (!referralsData || referralsData.length === 0) {
        logger.info('No referrals found for user', { userId: user.id });
        setReferrals([]);
        setReferralsLoading(false);
        return;
      }

      // Option 2: Utiliser la colonne referred_by dans profiles (alternative)
      // C'est plus direct car profiles.referred_by = referrer_id
      const { data: referredProfilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, first_name, last_name, created_at')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      if (profilesError) {
        logger.error('Error fetching referred profiles', { error: profilesError.message });
        // Continuer avec les données de referrals si profiles échoue
      }

      logger.info('Referred profiles fetched', { count: referredProfilesData?.length || 0 });

      // Combiner les données : utiliser referredProfilesData comme source principale
      // car elle contient directement les profils parrainés
      const referralsList: ReferralUser[] = [];

      // Récupérer les emails via RPC si disponible
      const referredIds = referredProfilesData && referredProfilesData.length > 0
        ? referredProfilesData.map((p: { user_id: string }) => p.user_id)
        : referralsData.map((r: { referred_id: string }) => r.referred_id);

      const emailsMap = new Map<string, string>();
      
      if (referredIds.length > 0) {
        try {
          const { data: emailsData, error: emailsError } = await supabase
            .rpc('get_users_emails', { p_user_ids: referredIds });

          if (!emailsError && emailsData) {
            emailsData.forEach((item: { user_id: string; email: string }) => {
              if (item.user_id && item.email) {
                emailsMap.set(item.user_id, item.email);
              }
            });
            logger.info('Emails fetched via RPC', { count: emailsMap.size });
          }
        } catch (rpcError: unknown) {
          const errorMessage = rpcError instanceof Error ? rpcError.message : 'Erreur inconnue';
          logger.debug('RPC get_users_emails not available or failed', { error: errorMessage });
        }
      }

      // Récupérer les statistiques des commandes pour chaque filleul
      // OPTIMISATION: Utiliser une seule requête au lieu de N requêtes (N+1)
      const ordersStatsMap = new Map<string, { orders: number; spent: number }>();

      if (referredIds.length > 0) {
        try {
          // Récupérer tous les customers correspondants en une seule requête
          const emails = Array.from(emailsMap.values());
          if (emails.length > 0) {
            const { data: customersData } = await supabase
              .from('customers')
              .select('id, email')
              .in('email', emails)
              .catch(() => ({ data: [] }));

            if (customersData && customersData.length > 0) {
              // Créer un map email -> customer_id
              const emailToCustomerMap = new Map<string, string>();
              customersData.forEach((c: { id: string; email: string }) => {
                emailToCustomerMap.set(c.email, c.id);
              });

              // Récupérer toutes les commandes en une seule requête
              const customerIds = Array.from(emailToCustomerMap.values());
              if (customerIds.length > 0) {
                const { data: allOrdersData } = await supabase
                  .from('orders')
                  .select('id, customer_id, total_amount, status')
                  .in('customer_id', customerIds)
                  .catch(() => ({ data: [] }));

                if (allOrdersData && allOrdersData.length > 0) {
                  // Grouper les commandes par customer_id
                  const ordersByCustomer = new Map<string, typeof allOrdersData>();
                  allOrdersData.forEach((order: { customer_id: string; total_amount?: number | null; status: string }) => {
                    if (!ordersByCustomer.has(order.customer_id)) {
                      ordersByCustomer.set(order.customer_id, []);
                    }
                    ordersByCustomer.get(order.customer_id)!.push(order);
                  });

                  // Calculer les stats pour chaque userId
                  referredIds.forEach((userId: string) => {
                    const email = emailsMap.get(userId);
                    if (email) {
                      const customerId = emailToCustomerMap.get(email);
                      if (customerId) {
                        const customerOrders = ordersByCustomer.get(customerId) || [];
                        const completedOrders = customerOrders.filter((o: { status: string }) => 
                          o.status === 'completed' || o.status === 'delivered'
                        );
                        const totalSpent = completedOrders.reduce(
                          (sum: number, o: { total_amount?: number | null }) => sum + Number(o.total_amount || 0), 
                          0
                        );
                        ordersStatsMap.set(userId, {
                          orders: completedOrders.length,
                          spent: totalSpent,
                        });
                      }
                    }
                  });
                }
              }
            }
          }
        } catch (ordersError: unknown) {
          const errorMessage = ordersError instanceof Error ? ordersError.message : 'Erreur inconnue';
          logger.debug('Could not fetch orders stats', { error: errorMessage });
        }
      }

      // Si on a des profils via referred_by, les utiliser (source principale)
      if (referredProfilesData && referredProfilesData.length > 0) {
        // Trouver la correspondance dans referrals pour chaque profil
        for (const profile of referredProfilesData) {
          const referral = referralsData.find((r: { referred_id: string }) => r.referred_id === profile.user_id);
          
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(' ') || profile.display_name || undefined;

          const stats = ordersStatsMap.get(profile.user_id) || { orders: 0, spent: 0 };
          const email = emailsMap.get(profile.user_id) || '';

          referralsList.push({
            id: referral?.id || `temp-${profile.user_id}`,
            referred_id: profile.user_id,
            created_at: referral?.created_at || profile.created_at || new Date().toISOString(),
            status: referral?.status || 'active',
            user: {
              email,
              name: fullName,
            },
            total_orders: stats.orders,
            total_spent: stats.spent,
          });
        }
      } else if (referralsData && referralsData.length > 0) {
        // Fallback : utiliser les données de referrals directement
        // Récupérer les profils correspondants
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, first_name, last_name')
          .in('user_id', referredIds)
          .catch(() => ({ data: [] }));

        const profilesMap = new Map<string, { user_id: string; display_name?: string; first_name?: string; last_name?: string }>();
        (profilesData || []).forEach((profile: { user_id: string; display_name?: string; first_name?: string; last_name?: string }) => {
          profilesMap.set(profile.user_id, profile);
        });

        for (const ref of referralsData) {
          const profile = profilesMap.get(ref.referred_id);
          const fullName = profile
            ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.display_name
            : undefined;

          const stats = ordersStatsMap.get(ref.referred_id) || { orders: 0, spent: 0 };
          const email = emailsMap.get(ref.referred_id) || '';

          referralsList.push({
            id: ref.id,
            referred_id: ref.referred_id,
            created_at: ref.created_at,
            status: ref.status,
            user: {
              email,
              name: fullName || `Utilisateur ${ref.referred_id.substring(0, 8)}`,
            },
            total_orders: stats.orders,
            total_spent: stats.spent,
          });
        }
      }

      logger.info('Referrals list prepared', { count: referralsList.length });
      setReferrals(referralsList);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error fetching referrals', { 
        error: errorMessage,
        stack: errorStack 
      });
      toast({
        title: "Erreur",
        description: errorMessage || "Impossible de charger la liste des filleuls",
        variant: "destructive",
      });
      setReferrals([]); // Assurer que l'état est défini même en cas d'erreur
    } finally {
      setReferralsLoading(false);
    }
  }, []);

  const fetchCommissions = useCallback(async () => {
    try {
      setCommissionsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCommissions([]);
        setCommissionsLoading(false);
        return;
      }

      logger.info('Fetching referral commissions', { userId: user.id });

      // Récupérer les commissions de base
      const { data: commissionsData, error } = await supabase
        .from('referral_commissions')
        .select('id, commission_amount, total_amount, status, created_at, paid_at, order_id, referred_id, commission_rate')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching commissions', { 
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Vérifier si c'est une erreur de permission (RLS)
        const isPermissionError = 
          error.message?.toLowerCase().includes('permission') ||
          error.message?.toLowerCase().includes('policy') ||
          error.message?.toLowerCase().includes('row-level security') ||
          error.code === '42501' || // insufficient_privilege
          error.code === 'PGRST301'; // PostgREST not found/access denied
        
        if (isPermissionError) {
          // Erreur de permission - silencieuse, juste logger
          logger.warn('Permission error fetching commissions (likely RLS)', { 
            error: error.message,
            userId: user.id 
          });
          setCommissions([]);
          setCommissionsLoading(false);
          return;
        }
        
        throw error;
      }

      // Si pas de données, retourner tableau vide
      if (!commissionsData || commissionsData.length === 0) {
        setCommissions([]);
        return;
      }

      // Enrichir avec les numéros de commande si disponibles (non-bloquant)
      const orderIds = commissionsData
        .map((comm: { order_id?: string | null }) => comm.order_id)
        .filter((id: string | null | undefined): id is string => id !== null && id !== undefined);

      const ordersMap = new Map<string, { id: string; order_number?: string }>();
      if (orderIds.length > 0) {
        try {
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, order_number')
            .in('id', orderIds);

          if (ordersError) {
            logger.debug('Error fetching orders for commissions', { error: ordersError.message });
          } else if (ordersData) {
            ordersData.forEach((order: { id: string; order_number?: string }) => {
              ordersMap.set(order.id, order);
            });
          }
        } catch (ordersError: unknown) {
          // Erreur silencieuse - on continue sans les numéros de commande
          const errorMessage = ordersError instanceof Error ? ordersError.message : String(ordersError);
          logger.debug('Could not fetch orders for commissions', { error: errorMessage });
        }
      }

      // Enrichir avec les emails des filleuls (non-bloquant)
      const referredIds = commissionsData
        .map((comm: { referred_id?: string | null }) => comm.referred_id)
        .filter((id: string | null | undefined): id is string => id !== null && id !== undefined);

      const emailsMap = new Map<string, string>();
      if (referredIds.length > 0) {
        try {
          const { data: emailsData, error: emailsError } = await supabase
            .rpc('get_users_emails', { p_user_ids: referredIds });

          if (emailsError) {
            // Erreur silencieuse - on continue sans les emails
            logger.debug('RPC get_users_emails error for commissions', { error: emailsError.message });
          } else if (emailsData) {
            emailsData.forEach((item: { user_id: string; email: string }) => {
              if (item.user_id && item.email) {
                emailsMap.set(item.user_id, item.email);
              }
            });
          }
        } catch (rpcError: unknown) {
          // Erreur silencieuse - on continue sans les emails
          const errorMessage = rpcError instanceof Error ? rpcError.message : String(rpcError);
          logger.debug('RPC get_users_emails exception for commissions', { error: errorMessage });
        }
      }

      // Construire les commissions enrichies
      const enrichedCommissions = commissionsData.map((comm: { 
        id: string; 
        commission_amount?: number | string | null; 
        total_amount?: number | string | null; 
        status: string; 
        created_at: string; 
        paid_at?: string | null; 
        order_id?: string | null; 
        referred_id?: string | null;
      }) => {
        const order = ordersMap.get(comm.order_id);
        const email = emailsMap.get(comm.referred_id) || '';

        return {
          id: comm.id,
          commission_amount: Number(comm.commission_amount || 0),
          total_amount: Number(comm.total_amount || 0),
          status: comm.status,
          created_at: comm.created_at,
          paid_at: comm.paid_at,
          order_id: comm.order_id,
          referred_id: comm.referred_id,
          order: {
            order_number: order?.order_number || undefined,
          },
          referred: {
            email: email,
          },
        };
      });

      logger.info('Commissions fetched and enriched', { count: enrichedCommissions.length });
      setCommissions(enrichedCommissions);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error fetching commissions', { 
        error: errorMessage,
        code: errorCode,
        stack: errorStack 
      });
      
      // Ne JAMAIS afficher le toast d'erreur pour les commissions
      // Car même si la requête échoue, on peut avoir des commissions vides
      // et l'utilisateur verra "Aucune commission" ce qui est acceptable
      // Le toast d'erreur n'apporte rien et crée de la confusion
      
      // Toujours définir un tableau vide en cas d'erreur pour éviter les états indéterminés
      setCommissions([]);
    } finally {
      setCommissionsLoading(false);
    }
  }, []);

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
