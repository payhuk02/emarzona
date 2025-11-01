import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Crée une relation de parrainage entre un parrain et un filleul
 */
export const createReferralRelation = async (
  referrerId: string,
  referredId: string,
  referralCode: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Vérifier que le code de parrainage existe et appartient au referrer
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, referral_code')
      .eq('referral_code', referralCode)
      .single();

    if (profileError || !profileData) {
      logger.error('Referral code not found', { code: referralCode, error: profileError?.message });
      return { success: false, error: 'Code de parrainage invalide' };
    }

    if (profileData.user_id !== referrerId) {
      logger.warn('Referral code mismatch', { code: referralCode, referrerId, profileUserId: profileData.user_id });
      return { success: false, error: 'Code de parrainage invalide' };
    }

    // Vérifier que la relation n'existe pas déjà
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrerId)
      .eq('referred_id', referredId)
      .single();

    if (existingReferral) {
      logger.info('Referral relation already exists', { referrerId, referredId });
      return { success: true }; // Déjà créé, c'est OK
    }

    // Créer la relation de parrainage
    const { error: insertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        referral_code: referralCode,
        status: 'active',
      });

    if (insertError) {
      logger.error('Error creating referral relation', { error: insertError.message });
      return { success: false, error: insertError.message };
    }

    // Mettre à jour le profil du filleul avec referred_by
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ referred_by: referrerId })
      .eq('user_id', referredId);

    if (updateError) {
      logger.error('Error updating profile referred_by', { error: updateError.message });
      // On ne retourne pas d'erreur car la relation est créée
    }

    logger.info('Referral relation created successfully', { referrerId, referredId, referralCode });
    return { success: true };
  } catch (error: any) {
    logger.error('Unexpected error creating referral relation', { error: error.message });
    return { success: false, error: error.message };
  }
};

