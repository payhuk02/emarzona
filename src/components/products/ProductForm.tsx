import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Save, MoreVertical, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { ProductInfoTab } from "./tabs/ProductInfoTab";
import { ProductDescriptionTab } from "./tabs/ProductDescriptionTab";
import { ProductVisualTab } from "./tabs/ProductVisualTab";
import { ProductFilesTab } from "./tabs/ProductFilesTab";
import { ProductCustomFieldsTab } from "./tabs/ProductCustomFieldsTab";
import { ProductFAQTab } from "./tabs/ProductFAQTab";
import { ProductSeoTab } from "./tabs/ProductSeoTab";
import { ProductAnalyticsTab } from "./tabs/ProductAnalyticsTab";
import { ProductPixelsTab } from "./tabs/ProductPixelsTab";
import { ProductVariantsTab } from "./tabs/ProductVariantsTab";
import { ProductPromotionsTab } from "./tabs/ProductPromotionsTab";
import { ProductFeatureTest } from "./tabs/ProductFeatureTest";
import { generateSlug } from "@/lib/store-utils";
import "@/styles/product-creation.css";

interface ProductFormProps {
  storeId: string;
  storeSlug: string;
  productId?: string;
  initialData?: any;
  onSuccess?: () => void;
}

// Types pour les données du formulaire
interface ProductFormData {
  // Informations de base
  name: string;
  slug: string;
  category: string;
  product_type: string;
  pricing_model: string;
  price: number;
  promotional_price: number | null;
  currency: string;
  
  // Description et contenu
  description: string;
  short_description: string;
  features: string[];
  specifications: any[];
  
  // Images et médias
  image_url: string;
  images: string[];
  video_url: string;
  gallery_images: string[];
  
  // Fichiers et téléchargements
  downloadable_files: any[];
  file_access_type: string;
  download_limit: number | null;
  download_expiry_days: number | null;
  
  // Champs personnalisés
  custom_fields: any[];
  
  // FAQ
  faqs: any[];
  
  // SEO et métadonnées
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image: string;
  og_title: string;
  og_description: string;
  
  // Analytics et tracking
  analytics_enabled: boolean;
  track_views: boolean;
  track_clicks: boolean;
  track_purchases: boolean;
  track_time_spent: boolean;
  google_analytics_id: string;
  facebook_pixel_id: string;
  google_tag_manager_id: string;
  tiktok_pixel_id: string;
  pinterest_pixel_id: string;
  advanced_tracking: boolean;
  custom_events: string[];
  
  // Pixels et tracking
  pixels_enabled: boolean;
  conversion_pixels: any[];
  retargeting_pixels: any[];
  
  // Variantes et attributs
  variants: any[];
  color_variants: boolean;
  size_variants: boolean;
  pattern_variants: boolean;
  finish_variants: boolean;
  dimension_variants: boolean;
  weight_variants: boolean;
  centralized_stock: boolean;
  low_stock_alerts: boolean;
  preorder_allowed: boolean;
  hide_when_out_of_stock: boolean;
  different_prices_per_variant: boolean;
  price_surcharge: boolean;
  quantity_discounts: boolean;
  
  // Promotions
  promotions_enabled: boolean;
  discount_percentage: boolean;
  discount_fixed: boolean;
  buy_one_get_one: boolean;
  family_pack: boolean;
  flash_sale: boolean;
  first_order_discount: boolean;
  loyalty_discount: boolean;
  birthday_discount: boolean;
  advanced_promotions: boolean;
  cumulative_promotions: boolean;
  automatic_promotions: boolean;
  promotion_notifications: boolean;
  geolocated_promotions: boolean;
  
  // Visibilité et accès
  is_active: boolean;
  is_featured: boolean;
  hide_from_store: boolean;
  password_protected: boolean;
  product_password: string;
  purchase_limit: number | null;
  hide_purchase_count: boolean;
  access_control: string;
  
  // Dates de vente
  sale_start_date: string | null;
  sale_end_date: string | null;
  
  // Livraison et expédition
  collect_shipping_address: boolean;
  shipping_required: boolean;
  shipping_cost: number;
  free_shipping_threshold: number | null;
  
  // Support et guides
  post_purchase_guide_url: string;
  support_email: string;
  documentation_url: string;
  
  // État et statut
  is_draft: boolean;
  status: string;
  
  // Métadonnées techniques
  created_at: string;
  updated_at: string;
  version: number;
}

// Données par défaut vides pour création d'un nouveau produit
const getEmptyFormData = (): ProductFormData => ({
  // Informations de base
  name: "",
  slug: "",
  category: "",
  product_type: "",
  pricing_model: "",
  price: 0,
  promotional_price: null,
  currency: "XOF",
  
  // Description et contenu
  description: "",
  short_description: "",
  features: [],
  specifications: [],
  
  // Images et médias
  image_url: "",
  images: [],
  video_url: "",
  gallery_images: [],
  
  // Fichiers et téléchargements
  downloadable_files: [],
  file_access_type: "immediate",
  download_limit: null,
  download_expiry_days: null,
  
  // Champs personnalisés
  custom_fields: [],
  
  // FAQ
  faqs: [],
  
  // SEO et métadonnées
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
  og_image: "",
  og_title: "",
  og_description: "",
  
  // Analytics et tracking
  analytics_enabled: false,
  track_views: false,
  track_clicks: false,
  track_purchases: false,
  track_time_spent: false,
  google_analytics_id: "",
  facebook_pixel_id: "",
  google_tag_manager_id: "",
  tiktok_pixel_id: "",
  pinterest_pixel_id: "",
  advanced_tracking: false,
  custom_events: [],
  
  // Pixels et tracking
  pixels_enabled: false,
  conversion_pixels: [],
  retargeting_pixels: [],
  
  // Variantes et attributs
  variants: [],
  color_variants: false,
  size_variants: false,
  pattern_variants: false,
  finish_variants: false,
  dimension_variants: false,
  weight_variants: false,
  centralized_stock: false,
  low_stock_alerts: false,
  preorder_allowed: false,
  hide_when_out_of_stock: false,
  different_prices_per_variant: false,
  price_surcharge: false,
  quantity_discounts: false,
  
  // Promotions
  promotions_enabled: false,
  discount_percentage: false,
  discount_fixed: false,
  buy_one_get_one: false,
  family_pack: false,
  flash_sale: false,
  first_order_discount: false,
  loyalty_discount: false,
  birthday_discount: false,
  advanced_promotions: false,
  cumulative_promotions: false,
  automatic_promotions: false,
  promotion_notifications: false,
  geolocated_promotions: false,
  
  // Visibilité et accès
  is_active: false,
  is_featured: false,
  hide_from_store: false,
  password_protected: false,
  product_password: "",
  purchase_limit: null,
  hide_purchase_count: false,
  access_control: "public",
  
  // Dates de vente
  sale_start_date: null,
  sale_end_date: null,
  
  // Livraison et expédition
  collect_shipping_address: false,
  shipping_required: false,
  shipping_cost: 0,
  free_shipping_threshold: null,
  
  // Support et guides
  post_purchase_guide_url: "",
  support_email: "",
  documentation_url: "",
  
  // État et statut
  is_draft: true,
  status: "draft",
  
  // Métadonnées techniques
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 1,
});

export const ProductForm = ({ storeId, storeSlug, productId, initialData, onSuccess }: ProductFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // État du formulaire avec données vides par défaut
  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      return { ...getEmptyFormData(), ...initialData };
    }
    return getEmptyFormData();
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === "name" && !productId) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (!slug) return false;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .eq('store_id', storeId)
        .neq('id', productId || '');
      
      if (error) throw error;
      return data.length === 0;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  };

  // Validation des champs requis
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Le nom du produit est requis";
    }
    
    if (!formData.slug.trim()) {
      errors.slug = "L'URL du produit est requise";
    }
    
    if (!formData.category) {
      errors.category = "La catégorie est requise";
    }
    
    if (!formData.product_type) {
      errors.product_type = "Le type de produit est requis";
    }
    
    if (!formData.pricing_model) {
      errors.pricing_model = "Le modèle de tarification est requis";
    }
    
    if (formData.price < 0) {
      errors.price = "Le prix doit être positif";
    }
    
    if (formData.promotional_price && formData.promotional_price < 0) {
      errors.promotional_price = "Le prix promotionnel doit être positif";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Sauvegarde du produit
  const saveProduct = async (status: 'draft' | 'published' = 'draft') => {
    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const productData = {
        ...formData,
        status: status,
        is_draft: status === 'draft',
        is_active: status === 'published',
        updated_at: new Date().toISOString(),
      };

      let result;
      if (productId) {
        // Mise à jour
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Création
        const { data, error } = await supabase
          .from('products')
          .insert([{ ...productData, store_id: storeId }])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      toast({
        title: status === 'published' ? "Produit publié" : "Produit sauvegardé",
        description: `Le produit "${formData.name}" a été ${status === 'published' ? 'publié' : 'sauvegardé'} avec succès`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate(`/admin/products/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => saveProduct('draft');
  const handlePublish = () => saveProduct('published');

  return (
    <div className="product-form-container">
      <Card className="product-card">
        <CardContent className="p-6">
          {/* En-tête avec titre et boutons d'action */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="theme-section-title text-2xl">
                {productId ? "Modifier le produit" : "Créer un produit"}
              </h1>
              <p className="theme-section-description">
                {productId ? "Modifiez les informations de votre produit" : "Remplissez les informations pour créer un nouveau produit"}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="theme-button-outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={loading}
                className="theme-button-outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Enregistrer
              </Button>
              
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="theme-button"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Publier
              </Button>
              
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Indicateur de validation */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Erreurs de validation</span>
              </div>
              <ul className="text-sm text-red-400 space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Onglets */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="product-tabs-list grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 mb-6 h-auto gap-1 overflow-x-auto">
              <TabsTrigger value="info" className="product-tab-trigger">
                <span className="hidden sm:inline">Informations</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger value="description" className="product-tab-trigger">
                <span className="hidden sm:inline">Description</span>
                <span className="sm:hidden">Desc</span>
              </TabsTrigger>
              <TabsTrigger value="visual" className="product-tab-trigger">
                <span className="hidden sm:inline">Visuel</span>
                <span className="sm:hidden">Vis</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="product-tab-trigger">
                <span className="hidden sm:inline">Fichiers</span>
                <span className="sm:hidden">Files</span>
              </TabsTrigger>
              <TabsTrigger value="custom" className="product-tab-trigger">
                <span className="hidden sm:inline">Champs perso.</span>
                <span className="sm:hidden">Perso</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="product-tab-trigger">
                FAQ
              </TabsTrigger>
              <TabsTrigger value="seo" className="product-tab-trigger">
                SEO
              </TabsTrigger>
              <TabsTrigger value="analytics" className="product-tab-trigger">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="pixels" className="product-tab-trigger">
                Pixels
              </TabsTrigger>
              <TabsTrigger value="variants" className="product-tab-trigger">
                Variantes
              </TabsTrigger>
              <TabsTrigger value="promotions" className="product-tab-trigger">
                Promotions
              </TabsTrigger>
              <TabsTrigger value="test" className="product-tab-trigger">
                Tests
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets */}
            <TabsContent value="info" className="mt-6">
              <ProductInfoTab
                formData={formData}
                updateFormData={updateFormData}
                storeId={storeId}
                storeSlug={storeSlug}
                checkSlugAvailability={checkSlugAvailability}
                validationErrors={validationErrors}
              />
            </TabsContent>

            <TabsContent value="description" className="mt-6">
              <ProductDescriptionTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="visual" className="mt-6">
              <ProductVisualTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <ProductFilesTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="custom" className="mt-6">
              <ProductCustomFieldsTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="faq" className="mt-6">
              <ProductFAQTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="seo" className="mt-6">
              <ProductSeoTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <ProductAnalyticsTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="pixels" className="mt-6">
              <ProductPixelsTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="variants" className="mt-6">
              <ProductVariantsTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="promotions" className="mt-6">
              <ProductPromotionsTab
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>

            <TabsContent value="test" className="mt-6">
              <ProductFeatureTest
                formData={formData}
                updateFormData={updateFormData}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};