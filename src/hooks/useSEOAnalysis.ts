import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSEO, SEOAnalysis } from "@/lib/seo-analyzer";

export interface SEOPageData {
  id: string;
  type: 'product' | 'store';
  name: string;
  url: string;
  analysis: SEOAnalysis;
  lastAnalyzed: Date;
}

export const useSEOAnalysis = (userId?: string) => {
  return useQuery({
    queryKey: ['seo-analysis', userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID required");

      const results: SEOPageData[] = [];

      // Fetch user's stores
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', userId);

      if (storesError) throw storesError;

      // Analyze each store
      if (stores) {
        for (const store of stores) {
          const analysis = analyzeSEO({
            name: store.name,
            description: store.description || store.about,
            meta_title: store.meta_title,
            meta_description: store.meta_description,
            meta_keywords: store.meta_keywords,
            image_url: store.logo_url,
            slug: store.slug
          });

          results.push({
            id: store.id,
            type: 'store',
            name: store.name,
            url: `/stores/${store.slug}`,
            analysis,
            lastAnalyzed: new Date()
          });

          // Update SEO score in database
          await supabase
            .from('stores')
            .update({ seo_score: analysis.score.overall })
            .eq('id', store.id);
        }
      }

      // Fetch user's products through stores
      if (stores && stores.length > 0) {
        const storeIds = stores.map(s => s.id);
        
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('store_id', storeIds);

        if (productsError) throw productsError;

        // Analyze each product
        if (products) {
          for (const product of products) {
            const store = stores.find(s => s.id === product.store_id);
            
            const analysis = analyzeSEO({
              name: product.name,
              description: product.description,
              meta_title: product.meta_title,
              meta_description: product.meta_description,
              meta_keywords: product.meta_keywords,
              image_url: product.image_url,
              images: Array.isArray(product.images) ? product.images : [],
              slug: product.slug
            });

            results.push({
              id: product.id,
              type: 'product',
              name: product.name,
              url: store ? `/stores/${store.slug}/products/${product.slug}` : '#',
              analysis,
              lastAnalyzed: new Date()
            });

            // Update SEO score in database
            await supabase
              .from('seo_pages')
              .upsert({
                page_type: 'product',
                page_id: product.id,
                title: product.name,
                description: product.description,
                url: store ? `/stores/${store.slug}/products/${product.slug}` : '#',
                seo_score: analysis.score.overall,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'page_id'
              });
          }
        }
      }

      return results;
    },
    enabled: !!userId
  });
};

export const useAverageSEOScore = (data: SEOPageData[] | undefined) => {
  if (!data || data.length === 0) return 0;
  
  const totalScore = data.reduce((sum, page) => sum + page.analysis.score.overall, 0);
  return Math.round(totalScore / data.length);
};

export const useOptimizedPagesCount = (data: SEOPageData[] | undefined) => {
  if (!data) return 0;
  return data.filter(page => page.analysis.score.overall >= 80).length;
};

export const usePagesToFixCount = (data: SEOPageData[] | undefined) => {
  if (!data) return 0;
  return data.filter(page => page.analysis.score.overall < 70).length;
};
