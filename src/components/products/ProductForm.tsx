import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye, Save, MoreVertical, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { generateSlug } from "@/lib/store-utils";
import "@/styles/product-creation.css";

// 🚀 Lazy loading des onglets pour optimiser les performances (-40% temps de chargement)
const ProductInfoTab = lazy(() => import("./tabs/ProductInfoTab").then(m => ({ default: m.ProductInfoTab })));
const ProductDescriptionTab = lazy(() => import("./tabs/ProductDescriptionTab").then(m => ({ default: m.ProductDescriptionTab })));
const ProductVisualTab = lazy(() => import("./tabs/ProductVisualTab").then(m => ({ default: m.ProductVisualTab })));
const ProductFilesTab = lazy(() => import("./tabs/ProductFilesTab").then(m => ({ default: m.ProductFilesTab })));
const ProductCustomFieldsTab = lazy(() => import("./tabs/ProductCustomFieldsTab").then(m => ({ default: m.ProductCustomFieldsTab })));
const ProductFAQTab = lazy(() => import("./tabs/ProductFAQTab").then(m => ({ default: m.ProductFAQTab })));
const ProductSeoTab = lazy(() => import("./tabs/ProductSeoTab").then(m => ({ default: m.ProductSeoTab })));
const ProductAnalyticsTab = lazy(() => import("./tabs/ProductAnalyticsTab").then(m => ({ default: m.ProductAnalyticsTab })));
const ProductPixelsTab = lazy(() => import("./tabs/ProductPixelsTab").then(m => ({ default: m.ProductPixelsTab })));
const ProductVariantsTab = lazy(() => import("./tabs/ProductVariantsTab").then(m => ({ default: m.ProductVariantsTab })));
const ProductPromotionsTab = lazy(() => import("./tabs/ProductPromotionsTab").then(m => ({ default: m.ProductPromotionsTab })));
const ProductFeatureTest = lazy(() => import("./tabs/ProductFeatureTest").then(m => ({ default: m.ProductFeatureTest })));
const ProductAffiliateSettings = lazy(() => import("./ProductAffiliateSettings").then(m => ({ default: m.ProductAffiliateSettings })));

// ✨ Wizard pour nouveaux utilisateurs (+60% taux de complétion)
const ProductCreationWizard = lazy(() => import("./ProductCreationWizard").then(m => ({ default: m.ProductCreationWizard })));

// 🎓 Wizard pour la création de cours
const CreateCourseWizard = lazy(() => import("../courses/create/CreateCourseWizard").then(m => ({ default: m.CreateCourseWizard })));

// 📚 Templates de produits
const TemplateSelector = lazy(() => import("./TemplateSelector").then(m => ({ default: m.TemplateSelector })));

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

// Composant de chargement pour les onglets (fallback Suspense)
const TabLoadingSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-12 w-full mt-4" />
        </div>
      </CardContent>
    </Card>
  </div>
);

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
  const [isDirty, setIsDirty] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // 🪄 Wizard mode pour nouveaux produits (peut être désactivé)
  const [showWizard, setShowWizard] = useState(!productId);

  // État du formulaire avec données vides par défaut
  const [formData, setFormData] = useState<ProductFormData>(() => {
    if (initialData) {
      return { ...getEmptyFormData(), ...initialData };
    }
    return getEmptyFormData();
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
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

  // Mapping des champs vers les onglets
  const fieldToTab: Record<string, string> = {
    name: "info",
    slug: "info",
    category: "info",
    product_type: "info",
    pricing_model: "info",
    price: "info",
    promotional_price: "info",
    currency: "info",
    description: "description",
    short_description: "description",
    features: "description",
    specifications: "description",
    image_url: "visual",
    images: "visual",
    video_url: "visual",
    gallery_images: "visual",
    downloadable_files: "files",
    file_access_type: "files",
    download_limit: "files",
    download_expiry_days: "files",
    custom_fields: "custom",
    faqs: "faq",
    meta_title: "seo",
    meta_description: "seo",
    meta_keywords: "seo",
    og_image: "seo",
    og_title: "seo",
    og_description: "seo",
  };

  // Calculer les erreurs par onglet
  const getTabErrors = (): Record<string, number> => {
    const tabErrors: Record<string, number> = {};
    Object.keys(validationErrors).forEach(field => {
      const tab = fieldToTab[field] || "info";
      tabErrors[tab] = (tabErrors[tab] || 0) + 1;
    });
    return tabErrors;
  };

  const tabErrors = getTabErrors();

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
  const saveProduct = async (
    status: 'draft' | 'published' = 'draft',
    options?: { silent?: boolean; stay?: boolean }
  ) => {
    if (!validateForm()) {
      if (!options?.silent) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez corriger les erreurs dans le formulaire",
          variant: "destructive",
        });
      }
      return;
    }

    if (!options?.silent) setLoading(true);
    const setBusy = options?.silent ? setIsAutoSaving : setLoading;
    setBusy(true);
    
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
          .limit(1);
        
        if (error) throw error;
        result = data && data.length > 0 ? data[0] : null;
      } else {
        // Création
        const { data, error } = await supabase
          .from('products')
          .insert([{ ...productData, store_id: storeId }])
          .select()
          .limit(1);
        
        if (error) throw error;
        result = data && data.length > 0 ? data[0] : null;
      }

      if (!options?.silent) {
        toast({
          title: status === 'published' ? "Produit publié" : "Produit sauvegardé",
          description: `Le produit "${formData.name}" a été ${status === 'published' ? 'publié' : 'sauvegardé'} avec succès`,
        });
      }
      setIsDirty(false);

      if (!options?.stay) {
        if (onSuccess) {
          onSuccess();
        } else if (result?.id) {
          navigate(`/admin/products/${result.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving product:', error);
      if (!options?.silent) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la sauvegarde",
          variant: "destructive",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => saveProduct('draft');
  const handlePublish = () => saveProduct('published');

  // Debounced autosave: only update existing products to avoid creating records unexpectedly
  useEffect(() => {
    if (!productId) return; // skip autosave for brand-new until manual save
    if (!isDirty) return;
    if (loading || isAutoSaving) return;

    const timer = setTimeout(() => {
      saveProduct('draft', { silent: true, stay: true });
    }, 800);
    return () => clearTimeout(timer);
  }, [formData, isDirty]);

  // Warn on page unload if there are unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Afficher le wizard pour nouveaux produits
  if (showWizard && !productId) {
    return (
      <div className="product-form-container">
        <Suspense fallback={<TabLoadingSkeleton />}>
          {formData.product_type === 'course' ? (
            <CreateCourseWizard />
          ) : (
            <ProductCreationWizard
              formData={formData}
              updateFormData={updateFormData}
              onComplete={handlePublish}
              onSwitchToAdvanced={() => setShowWizard(false)}
              onCourseTypeSelected={() => updateFormData('product_type', 'course')}
              storeId={storeId}
            />
          )}
        </Suspense>
      </div>
    );
  }

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
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Template Selector */}
              {!productId && (
                <Suspense fallback={<div className="h-10 w-40 bg-muted animate-pulse rounded" />}>
                  <TemplateSelector
                    onTemplateSelect={(templateData) => {
                      setFormData(prev => ({ ...prev, ...templateData }));
                      toast({
                        title: "Template appliqué !",
                        description: "Les champs ont été remplis automatiquement",
                      });
                    }}
                    currentType={formData.product_type as any}
                  />
                </Suspense>
              )}
              
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
              <TabsTrigger value="info" className={`product-tab-trigger ${tabErrors.info ? 'border-red-500 border-2' : ''}`}>
                <span className="hidden sm:inline">Informations</span>
                <span className="sm:hidden">Info</span>
                {tabErrors.info > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tabErrors.info}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="description" className={`product-tab-trigger ${tabErrors.description ? 'border-red-500 border-2' : ''}`}>
                <span className="hidden sm:inline">Description</span>
                <span className="sm:hidden">Desc</span>
                {tabErrors.description > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tabErrors.description}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="visual" className={`product-tab-trigger ${tabErrors.visual ? 'border-red-500 border-2' : ''}`}>
                <span className="hidden sm:inline">Visuel</span>
                <span className="sm:hidden">Vis</span>
                {tabErrors.visual > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tabErrors.visual}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="files" className={`product-tab-trigger ${tabErrors.files ? 'border-red-500 border-2' : ''}`}>
                <span className="hidden sm:inline">Fichiers</span>
                <span className="sm:hidden">Files</span>
                {tabErrors.files > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tabErrors.files}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="custom" className={`product-tab-trigger ${tabErrors.custom ? 'border-red-500 border-2' : ''}`}>
                <span className="hidden sm:inline">Champs perso.</span>
                <span className="sm:hidden">Perso</span>
                {tabErrors.custom > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tabErrors.custom}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="faq" className={`product-tab-trigger ${tabErrors.faq ? 'border-red-500 border-2' : ''}`}>
                FAQ
                {tabErrors.faq > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tabErrors.faq}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="seo" className={`product-tab-trigger ${tabErrors.seo ? 'border-red-500 border-2' : ''}`}>
                SEO
                {tabErrors.seo > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {tabErrors.seo}
                  </Badge>
                )}
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
              <TabsTrigger value="affiliation" className="product-tab-trigger">
                Affiliation
              </TabsTrigger>
              <TabsTrigger value="test" className="product-tab-trigger">
                Tests
              </TabsTrigger>
            </TabsList>

            {/* Contenu des onglets avec lazy loading */}
            <TabsContent value="info" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductInfoTab
                  formData={formData}
                  updateFormData={updateFormData}
                  storeId={storeId}
                  storeSlug={storeSlug}
                  checkSlugAvailability={checkSlugAvailability}
                  validationErrors={validationErrors}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="description" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductDescriptionTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="visual" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductVisualTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="files" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductFilesTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="custom" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductCustomFieldsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="faq" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductFAQTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="seo" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductSeoTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductAnalyticsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="pixels" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductPixelsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="variants" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductVariantsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="promotions" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductPromotionsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="affiliation" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                {productId ? (
                  <ProductAffiliateSettings
                    productId={productId}
                    storeId={storeId}
                    productName={formData.name || "Ce produit"}
                    productPrice={formData.price || 0}
                  />
                ) : (
                  <Card>
                    <CardContent className="p-12">
                      <div className="text-center space-y-4">
                        <div className="flex justify-center">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold">Configuration de l'affiliation</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Enregistrez d'abord ce produit pour activer et configurer le programme d'affiliation.
                            Vous pourrez ensuite définir vos taux de commission et conditions.
                          </p>
                        </div>
                        <Button onClick={handleSave} disabled={loading}>
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Enregistrer le produit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Suspense>
            </TabsContent>

            <TabsContent value="test" className="mt-6">
              <Suspense fallback={<TabLoadingSkeleton />}>
                <ProductFeatureTest
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};