/**
 * Cours vendeur — produits type "course" de la boutique active.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SELLER_COURSE_FIELDS = `
  id,
  name,
  slug,
  price,
  currency,
  promotional_price,
  image_url,
  is_active,
  is_draft,
  created_at,
  updated_at,
  courses (
    id,
    level,
    language,
    total_lessons,
    total_duration_minutes,
    certificate_enabled
  )
`;

export interface SellerCourseProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  promotional_price: number | null;
  image_url: string | null;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  courses: Array<{
    id: string;
    level: string | null;
    language: string | null;
    total_lessons: number | null;
    total_duration_minutes: number | null;
    certificate_enabled: boolean | null;
  }> | null;
}

export function useSellerCourseProducts(storeId?: string) {
  return useQuery({
    queryKey: ['seller-course-products', storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(SELLER_COURSE_FIELDS)
        .eq('store_id', storeId!)
        .eq('product_type', 'course')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as SellerCourseProduct[];
    },
    staleTime: 60_000,
  });
}
