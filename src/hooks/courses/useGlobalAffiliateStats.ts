/**
 * Hook pour statistiques globales d'affiliation (tous cours)
 * Vue d'ensemble des performances d'un affilié
 * Date : 27 octobre 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GlobalAffiliateStats {
  total_courses: number;
  total_links: number;
  total_clicks: number;
  total_conversions: number;
  conversion_rate: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
}

interface PromotedCourse {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_price: number;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  total_links: number;
  total_clicks: number;
  total_conversions: number;
  total_commission: number;
}

/**
 * Hook pour récupérer les statistiques globales d'un affilié
 */
export const useGlobalAffiliateStats = () => {
  return useQuery({
    queryKey: ['global-affiliate-stats'],
    queryFn: async (): Promise<GlobalAffiliateStats> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non connecté');
      }

      // Récupérer tous les liens de l'utilisateur
      const { data: links } = await supabase
        .from('affiliate_links')
        .select('id, product_id, conversions_count')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!links || links.length === 0) {
        return {
          total_courses: 0,
          total_links: 0,
          total_clicks: 0,
          total_conversions: 0,
          conversion_rate: 0,
          total_commission: 0,
          pending_commission: 0,
          paid_commission: 0,
        };
      }

      const linkIds = links.map(l => l.id);
      const uniqueProductIds = [...new Set(links.map(l => l.product_id))];

      // Récupérer le total des clics
      const { count: totalClicks } = await supabase
        .from('affiliate_clicks')
        .select('*', { count: 'exact', head: true })
        .in('affiliate_link_id', linkIds);

      // Récupérer les commissions
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount, status')
        .in('affiliate_link_id', linkIds);

      const totalConversions = links.reduce((sum, l) => sum + (l.conversions_count || 0), 0);
      const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const paidCommission = commissions
        ?.filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0) || 0;
      const pendingCommission = totalCommission - paidCommission;

      const conversionRate = totalClicks && totalConversions
        ? (totalConversions / totalClicks) * 100
        : 0;

      return {
        total_courses: uniqueProductIds.length,
        total_links: links.length,
        total_clicks: totalClicks || 0,
        total_conversions: totalConversions,
        conversion_rate: parseFloat(conversionRate.toFixed(2)),
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        paid_commission: paidCommission,
      };
    },
  });
};

/**
 * Hook pour récupérer la liste des cours promus par l'affilié
 */
export const usePromotedCourses = () => {
  return useQuery({
    queryKey: ['promoted-courses'],
    queryFn: async (): Promise<PromotedCourse[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Non connecté');
      }

      // Récupérer tous les liens avec les produits
      const { data: links } = await supabase
        .from('affiliate_links')
        .select(`
          id,
          product_id,
          conversions_count,
          products (
            id,
            name,
            slug,
            price,
            product_type
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('products.product_type', 'course');

      if (!links || links.length === 0) {
        return [];
      }

      // Grouper par produit
      type LinkWithProduct = typeof links[0] & { products?: { id: string; name: string; slug: string; price: number } };
      const productMap = new Map<string, {
        product_id: string;
        product_name: string;
        product_slug: string;
        product_price: number;
        commission_rate: number;
        commission_type: 'percentage' | 'fixed';
        total_links: number;
        total_clicks: number;
        total_conversions: number;
        total_commission: number;
        link_ids: string[];
      }>();

      for (const link of links as LinkWithProduct[]) {
        const product = link.products;
        if (!product) continue;

        if (!productMap.has(product.id)) {
          productMap.set(product.id, {
            product_id: product.id,
            product_name: product.name,
            product_slug: product.slug,
            product_price: product.price,
            commission_rate: 0,
            commission_type: 'percentage' as const,
            total_links: 0,
            total_clicks: 0,
            total_conversions: 0,
            total_commission: 0,
            link_ids: [],
          });
        }

        const courseData = productMap.get(product.id);
        courseData.total_links += 1;
        courseData.total_conversions += link.conversions_count || 0;
        courseData.link_ids.push(link.id);
      }

      // Récupérer les settings d'affiliation et les stats pour chaque cours
      const courses = await Promise.all(
        Array.from(productMap.values()).map(async (course) => {
          // Settings d'affiliation
          const { data: settings } = await supabase
            .from('product_affiliate_settings')
            .select('commission_rate, commission_type')
            .eq('product_id', course.product_id)
            .single();

          if (settings) {
            course.commission_rate = settings.commission_rate;
            course.commission_type = settings.commission_type;
          }

          // Clics totaux
          const { count: clicks } = await supabase
            .from('affiliate_clicks')
            .select('*', { count: 'exact', head: true })
            .in('affiliate_link_id', course.link_ids);

          course.total_clicks = clicks || 0;

          // Commissions totales
          const { data: commissions } = await supabase
            .from('affiliate_commissions')
            .select('amount')
            .in('affiliate_link_id', course.link_ids);

          course.total_commission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;

          // Nettoyer les link_ids (pas besoin de les retourner)
          delete course.link_ids;

          return course;
        })
      );

      // Trier par total_commission décroissant
      return courses.sort((a, b) => b.total_commission - a.total_commission);
    },
  });
};

