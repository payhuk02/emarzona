import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
}

export const useReferral = () => {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
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
        .limit(1);

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      const profile = profileData && profileData.length > 0 ? profileData[0] : null;
      if (!profile) {
        throw new Error('Profil non trouvé');
      }

      // Récupérer le nombre de filleuls
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id)
        .eq('status', 'active');

      if (referralsError) throw referralsError;

      const baseUrl = window.location.origin;
      const referralLink = `${baseUrl}/?ref=${profile.referral_code}`;

      setData({
        referralCode: profile.referral_code || '',
        referralLink,
        totalReferrals: referrals?.length || 0,
        totalEarnings: profile.total_referral_earnings || 0,
      });
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
    fetchReferralData();
  }, []);

  return { data, loading, refetch: fetchReferralData };
};
