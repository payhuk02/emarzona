/**
 * Service de tracking d'affiliation
 * Gère les cookies d'affiliation et la création de commissions
 */
import { supabase } from "@/integrations/supabase/client";
import { logger } from "./logger";

const AFFILIATE_COOKIE_NAME = 'emarzona_affiliate';
const AFFILIATE_COOKIE_EXPIRY_DAYS = 30; // Par défaut, peut être surchargé par produit

/**
 * Récupère le cookie d'affiliation depuis le navigateur
 */
export const getAffiliateCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === AFFILIATE_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

/**
 * Définit le cookie d'affiliation
 */
export const setAffiliateCookie = (affiliateLinkId: string, expiryDays: number = AFFILIATE_COOKIE_EXPIRY_DAYS) => {
  if (typeof document === 'undefined') return;
  
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  document.cookie = `${AFFILIATE_COOKIE_NAME}=${encodeURIComponent(affiliateLinkId)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
};

/**
 * Track un clic d'affiliation
 */
export const trackAffiliateClick = async (
  affiliateLinkId: string,
  productId: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; tracking_cookie?: string; error?: string }> => {
  try {
    // Récupérer les infos du lien d'affiliation
    const { data: affiliateLink, error: linkError } = await supabase
      .from('affiliate_links')
      .select(`
        id,
        affiliate_id,
        product_id,
        store_id,
        cookie_duration_days:product_affiliate_settings(cookie_duration_days)
      `)
      .eq('id', affiliateLinkId)
      .single();

    if (linkError || !affiliateLink) {
      logger.error('Affiliate link not found', { affiliateLinkId, error: linkError });
      return { success: false, error: 'Lien d\'affiliation introuvable' };
    }

    // Récupérer la durée du cookie depuis les paramètres du produit
    const cookieDurationSettings = affiliateLink.cookie_duration_days as { cookie_duration_days?: number }[] | null;
    const cookieDuration = cookieDurationSettings?.[0]?.cookie_duration_days || AFFILIATE_COOKIE_EXPIRY_DAYS;

    // Créer un enregistrement de clic
    const trackingCookie = `${affiliateLinkId}-${Date.now()}`;
    const cookieExpiresAt = new Date();
    cookieExpiresAt.setDate(cookieExpiresAt.getDate() + cookieDuration);

    const { data: click, error: clickError } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_link_id: affiliateLinkId,
        affiliate_id: affiliateLink.affiliate_id,
        product_id: productId,
        tracking_cookie: trackingCookie,
        cookie_expires_at: cookieExpiresAt.toISOString(),
        converted: false,
        ip_address: metadata?.ip_address as string,
        user_agent: metadata?.user_agent as string,
        referer_url: metadata?.referer_url as string,
      })
      .select()
      .single();

    if (clickError) {
      logger.error('Error tracking affiliate click', { error: clickError });
      return { success: false, error: 'Erreur lors du tracking du clic' };
    }

    // Mettre à jour les stats du lien d'affiliation
    await supabase.rpc('increment_affiliate_link_clicks', {
      p_link_id: affiliateLinkId,
    });

    // Définir le cookie dans le navigateur
    setAffiliateCookie(trackingCookie, cookieDuration);

    logger.log('Affiliate click tracked', { affiliateLinkId, trackingCookie });

    return { success: true, tracking_cookie: trackingCookie };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error in trackAffiliateClick', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};

/**
 * Récupère les informations d'affiliation depuis le cookie
 */
export const getAffiliateInfo = async (): Promise<{
  affiliate_link_id: string | null;
  affiliate_id: string | null;
  product_id: string | null;
  tracking_cookie: string | null;
}> => {
  const trackingCookie = getAffiliateCookie();
  
  if (!trackingCookie) {
    return {
      affiliate_link_id: null,
      affiliate_id: null,
      product_id: null,
      tracking_cookie: null,
    };
  }

  try {
    // Récupérer les infos depuis la base de données
    const { data: click, error } = await supabase
      .from('affiliate_clicks')
      .select('affiliate_link_id, affiliate_id, product_id, cookie_expires_at')
      .eq('tracking_cookie', trackingCookie)
      .gte('cookie_expires_at', new Date().toISOString())
      .eq('converted', false)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !click) {
      logger.warn('Affiliate click not found or expired', { trackingCookie });
      return {
        affiliate_link_id: null,
        affiliate_id: null,
        product_id: null,
        tracking_cookie: null,
      };
    }

    return {
      affiliate_link_id: click.affiliate_link_id,
      affiliate_id: click.affiliate_id,
      product_id: click.product_id,
      tracking_cookie: trackingCookie,
    };
  } catch (error: unknown) {
    logger.error('Error getting affiliate info', { error });
    return {
      affiliate_link_id: null,
      affiliate_id: null,
      product_id: null,
      tracking_cookie: null,
    };
  }
};

/**
 * Crée une commission d'affiliation après une commande réussie
 */
export const createAffiliateCommission = async (
  orderId: string,
  productId: string,
  storeId: string,
  orderTotal: number,
  trackingCookie?: string
): Promise<{ success: boolean; commission_id?: string; error?: string }> => {
  try {
    // Si pas de tracking cookie, essayer de le récupérer depuis le cookie du navigateur
    if (!trackingCookie) {
      const affiliateInfo = await getAffiliateInfo();
      trackingCookie = affiliateInfo.tracking_cookie || undefined;
    }

    if (!trackingCookie) {
      logger.info('No affiliate tracking cookie found', { orderId });
      return { success: false, error: 'Aucun cookie d\'affiliation trouvé' };
    }

    // Récupérer les infos du clic d'affiliation
    const { data: click, error: clickError } = await supabase
      .from('affiliate_clicks')
      .select(`
        id,
        affiliate_link_id,
        affiliate_id,
        product_id,
        affiliate_links!inner(
          product_affiliate_settings!inner(
            commission_rate,
            commission_type,
            fixed_commission_amount,
            min_order_amount
          )
        )
      `)
      .eq('tracking_cookie', trackingCookie)
      .eq('product_id', productId)
      .eq('converted', false)
      .single();

    if (clickError || !click) {
      logger.warn('Affiliate click not found for commission', { trackingCookie, productId });
      return { success: false, error: 'Clic d\'affiliation non trouvé' };
    }

    type AffiliateSettings = {
      commission_rate: number;
      commission_type: 'percentage' | 'fixed';
      fixed_commission_amount?: number | null;
      min_order_amount?: number | null;
    };
    const clickWithLinks = click as { 
      id: string;
      affiliate_link_id: string;
      affiliate_id: string;
      product_id: string;
      affiliate_links?: { product_affiliate_settings?: AffiliateSettings[] } 
    };
    const settings = clickWithLinks.affiliate_links?.product_affiliate_settings?.[0];
    if (!settings) {
      logger.warn('Product affiliate settings not found', { productId });
      return { success: false, error: 'Paramètres d\'affiliation non trouvés' };
    }

    // Vérifier le montant minimum
    if (settings.min_order_amount && orderTotal < settings.min_order_amount) {
      logger.info('Order total below minimum for commission', { orderTotal, minOrderAmount: settings.min_order_amount });
      return { success: false, error: 'Montant de commande insuffisant' };
    }

    // Calculer la commission
    let commissionAmount = 0;
    if (settings.commission_type === 'percentage') {
      commissionAmount = orderTotal * (settings.commission_rate / 100);
    } else if (settings.commission_type === 'fixed') {
      commissionAmount = settings.fixed_commission_amount || 0;
    }

    if (commissionAmount <= 0) {
      logger.warn('Commission amount is zero or negative', { commissionAmount, settings });
      return { success: false, error: 'Montant de commission invalide' };
    }

    // Créer la commission
    const { data: commission, error: commissionError } = await supabase
      .from('affiliate_commissions')
      .insert({
        affiliate_id: click.affiliate_id,
        affiliate_link_id: click.affiliate_link_id,
        product_id: productId,
        store_id: storeId,
        order_id: orderId,
        order_total: orderTotal,
        commission_base: orderTotal,
        commission_rate: settings.commission_rate,
        commission_type: settings.commission_type,
        commission_amount: commissionAmount,
        status: 'pending',
      })
      .select()
      .single();

    if (commissionError) {
      logger.error('Error creating affiliate commission', { error: commissionError });
      return { success: false, error: 'Erreur lors de la création de la commission' };
    }

    // Marquer le clic comme converti
    await supabase
      .from('affiliate_clicks')
      .update({ converted: true, converted_at: new Date().toISOString(), order_id: orderId })
      .eq('id', click.id);

    // Mettre à jour les stats
    await supabase.rpc('increment_affiliate_link_sales', {
      p_link_id: click.affiliate_link_id,
      p_revenue: orderTotal,
      p_commission: commissionAmount,
    });

    logger.log('Affiliate commission created', { commissionId: commission.id, orderId });

    return { success: true, commission_id: commission.id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error in createAffiliateCommission', { error: errorMessage });
    return { success: false, error: errorMessage };
  }
};







