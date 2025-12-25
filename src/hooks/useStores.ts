import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Types pour les horaires d'ouverture
export interface StoreOpeningHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
  timezone: string;
  special_hours?: Array<{
    date: string;
    open: string;
    close: string;
    closed: boolean;
    reason: string;
  }>;
}

// Types pour les pages légales
export interface StoreLegalPages {
  terms_of_service?: string;
  privacy_policy?: string;
  return_policy?: string;
  shipping_policy?: string;
  refund_policy?: string;
  cookie_policy?: string;
  disclaimer?: string;
  faq_content?: string;
}

// Types pour le contenu marketing
export interface StoreMarketingContent {
  welcome_message?: string;
  mission_statement?: string;
  vision_statement?: string;
  values?: string[];
  story?: string;
  team_section?: Array<{
    name: string;
    role: string;
    bio: string;
    photo_url: string;
    social_links?: Record<string, string>;
  }>;
  testimonials?: Array<{
    author: string;
    content: string;
    rating: number;
    photo_url?: string;
    company?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    image_url: string;
    verification_url: string;
    expiry_date?: string;
  }>;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  about?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  linkedin_url?: string | null;
  // Domain management fields
  custom_domain?: string | null;
  domain_status?: 'not_configured' | 'pending' | 'verified' | 'error';
  domain_verification_token?: string | null;
  domain_verified_at?: string | null;
  domain_error_message?: string | null;
  ssl_enabled?: boolean;
  redirect_www?: boolean;
  redirect_https?: boolean;
  dns_records?: Array<Record<string, unknown>>;
  // Phase 1: Thème et couleurs
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  text_secondary_color?: string | null;
  button_primary_color?: string | null;
  button_primary_text?: string | null;
  button_secondary_color?: string | null;
  button_secondary_text?: string | null;
  link_color?: string | null;
  link_hover_color?: string | null;
  border_radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | null;
  shadow_intensity?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | null;
  // Typographie
  heading_font?: string | null;
  body_font?: string | null;
  font_size_base?: string | null;
  heading_size_h1?: string | null;
  heading_size_h2?: string | null;
  heading_size_h3?: string | null;
  line_height?: string | null;
  letter_spacing?: string | null;
  // Layout
  header_style?: 'minimal' | 'standard' | 'extended' | null;
  footer_style?: 'minimal' | 'standard' | 'extended' | null;
  sidebar_enabled?: boolean | null;
  sidebar_position?: 'left' | 'right' | null;
  product_grid_columns?: number | null;
  product_card_style?: 'minimal' | 'standard' | 'detailed' | null;
  navigation_style?: 'horizontal' | 'vertical' | 'mega' | null;
  // Images et médias
  favicon_url?: string | null;
  apple_touch_icon_url?: string | null;
  watermark_url?: string | null;
  placeholder_image_url?: string | null;
  // Localisation
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  opening_hours?: StoreOpeningHours | null;
  // Contacts supplémentaires
  support_email?: string | null;
  sales_email?: string | null;
  press_email?: string | null;
  partnership_email?: string | null;
  support_phone?: string | null;
  sales_phone?: string | null;
  whatsapp_number?: string | null;
  telegram_username?: string | null;
  youtube_url?: string | null;
  tiktok_url?: string | null;
  pinterest_url?: string | null;
  snapchat_url?: string | null;
  discord_url?: string | null;
  twitch_url?: string | null;
  // Pages légales (JSONB)
  legal_pages?: StoreLegalPages | null;
  // Contenu marketing (JSONB)
  marketing_content?: StoreMarketingContent | null;
  // SEO (champs existants mais non utilisés)
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  og_image?: string | null;
  seo_score?: number | null;
  theme_color?: string | null;
  // Phase 2 - Analytics et Tracking
  google_analytics_id?: string | null;
  google_analytics_enabled?: boolean;
  facebook_pixel_id?: string | null;
  facebook_pixel_enabled?: boolean;
  google_tag_manager_id?: string | null;
  google_tag_manager_enabled?: boolean;
  tiktok_pixel_id?: string | null;
  tiktok_pixel_enabled?: boolean;
  custom_tracking_scripts?: string | null;
  custom_scripts_enabled?: boolean;
}

const MAX_STORES_PER_USER = 3;

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Utilisateur non authentifié');
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setStores(data || []);
      setError(null);
    } catch (err: any) {
      logger.error('Erreur lors du chargement des boutiques:', err);
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos boutiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canCreateStore = () => {
    return stores.length < MAX_STORES_PER_USER;
  };

  const getRemainingStores = () => {
    return Math.max(0, MAX_STORES_PER_USER - stores.length);
  };

  const createStore = async (storeData: Partial<Store>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Vérifier la limite de 3 boutiques
      if (!canCreateStore()) {
        throw new Error(`Limite de ${MAX_STORES_PER_USER} boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.`);
      }

      const { data, error } = await supabase
        .from('stores')
        .insert([{
          ...storeData,
          user_id: user.id,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste des boutiques
      await fetchStores();
      
      toast({
        title: "Boutique créée",
        description: "Votre nouvelle boutique a été créée avec succès"
      });

      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Impossible de créer la boutique";
      logger.error('Erreur lors de la création de la boutique:', err);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateStore = async (storeId: string, updates: Partial<Store>) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', storeId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Rafraîchir la liste des boutiques
      await fetchStores();
      
      toast({
        title: "Boutique mise à jour",
        description: "Les modifications ont été enregistrées"
      });

      return data;
    } catch (err: unknown) {
      logger.error('Erreur lors de la mise à jour de la boutique:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la boutique",
        variant: "destructive"
      });
      throw err;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) {
        throw error;
      }

      // Rafraîchir la liste des boutiques
      await fetchStores();
      
      toast({
        title: "Boutique supprimée",
        description: "La boutique a été supprimée avec succès"
      });
    } catch (err: unknown) {
      logger.error('Erreur lors de la suppression de la boutique:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la boutique",
        variant: "destructive"
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchStores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stores,
    loading,
    error,
    createStore,
    updateStore,
    deleteStore,
    refetch: fetchStores,
    canCreateStore,
    getRemainingStores
  };
};
