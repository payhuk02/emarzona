import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Save, MoreVertical, Loader2 } from "lucide-react";
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

export const ProductForm = ({ storeId, storeSlug, productId, initialData, onSuccess }: ProductFormProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  // État du formulaire complet avec toutes les fonctionnalités avancées
  const [formData, setFormData] = useState({
    // Informations de base
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    category: initialData?.category || "",
    product_type: initialData?.product_type || "digital",
    pricing_model: initialData?.pricing_model || "one-time",
    price: initialData?.price || 0,
    promotional_price: initialData?.promotional_price || null,
    currency: initialData?.currency || "XOF",
    
    // Description et contenu
    description: initialData?.description || "",
    short_description: initialData?.short_description || "",
    features: initialData?.features || [],
    specifications: initialData?.specifications || [],
    
    // Images et médias
    image_url: initialData?.image_url || "",
    images: initialData?.images || [],
    video_url: initialData?.video_url || "",
    gallery_images: initialData?.gallery_images || [],
    
    // Fichiers et téléchargements
    downloadable_files: initialData?.downloadable_files || [],
    file_access_type: initialData?.file_access_type || "immediate",
    download_limit: initialData?.download_limit || null,
    download_expiry_days: initialData?.download_expiry_days || null,
    
    // Champs personnalisés
    custom_fields: initialData?.custom_fields || [],
    
    // FAQ
    faqs: initialData?.faqs || [],
    
    // SEO et métadonnées
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
    meta_keywords: initialData?.meta_keywords || "",
    og_image: initialData?.og_image || "",
    og_title: initialData?.og_title || "",
    og_description: initialData?.og_description || "",
    structured_data: initialData?.structured_data || {},
    
    // Analytics et tracking
    analytics_enabled: initialData?.analytics_enabled || false,
    track_views: initialData?.track_views || false,
    track_clicks: initialData?.track_clicks || false,
    track_purchases: initialData?.track_purchases || false,
    track_time_spent: initialData?.track_time_spent || false,
    google_analytics_id: initialData?.google_analytics_id || "",
    facebook_pixel_id: initialData?.facebook_pixel_id || "",
    google_tag_manager_id: initialData?.google_tag_manager_id || "",
    tiktok_pixel_id: initialData?.tiktok_pixel_id || "",
    pinterest_pixel_id: initialData?.pinterest_pixel_id || "",
    advanced_tracking: initialData?.advanced_tracking || false,
    custom_events: initialData?.custom_events || [],
    
    // Pixels de tracking
    pixels_config: initialData?.pixels_config || {
      facebook: { enabled: false, events: [] },
      google: { enabled: false, events: [] },
      tiktok: { enabled: false, events: [] },
      pinterest: { enabled: false, events: [] }
    },
    
    // Variantes de produits
    variants: initialData?.variants || [],
    attributes: initialData?.attributes || [],
    inventory_tracking: initialData?.inventory_tracking || false,
    stock_quantity: initialData?.stock_quantity || null,
    low_stock_threshold: initialData?.low_stock_threshold || null,
    
    // Promotions et réductions
    automatic_discount_enabled: initialData?.automatic_discount_enabled || false,
    discount_trigger: initialData?.discount_trigger || "",
    sale_start_date: initialData?.sale_start_date || null,
    sale_end_date: initialData?.sale_end_date || null,
    promotions: initialData?.promotions || [],
    
    // Sécurité et accès
    password_protected: initialData?.password_protected || false,
    product_password: initialData?.product_password || "",
    watermark_enabled: initialData?.watermark_enabled || false,
    purchase_limit: initialData?.purchase_limit || null,
    access_control: initialData?.access_control || "public",
    
    // Visibilité et affichage
    hide_from_store: initialData?.hide_from_store || false,
    hide_purchase_count: initialData?.hide_purchase_count || false,
    featured: initialData?.featured || false,
    sort_order: initialData?.sort_order || 0,
    
    // Livraison et expédition
    collect_shipping_address: initialData?.collect_shipping_address || false,
    shipping_required: initialData?.shipping_required || false,
    shipping_cost: initialData?.shipping_cost || 0,
    free_shipping_threshold: initialData?.free_shipping_threshold || null,
    
    // Support et guides
    post_purchase_guide_url: initialData?.post_purchase_guide_url || "",
    support_email: initialData?.support_email || "",
    documentation_url: initialData?.documentation_url || "",
    
    // État et statut
    is_draft: initialData?.is_draft !== undefined ? initialData.is_draft : true,
    is_active: initialData?.is_active || false,
    is_featured: initialData?.is_featured || false,
    status: initialData?.status || "draft",
    
    // Métadonnées techniques
    created_at: initialData?.created_at || new Date().toISOString(),
    updated_at: initialData?.updated_at || new Date().toISOString(),
    version: initialData?.version || 1,
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === "name" && !productId) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
    }
  };

  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("is_product_slug_available", {
        check_slug: slug,
        check_store_id: storeId,
        exclude_product_id: productId || null,
      });
      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Validation complète
      const validationErrors = validateProductData(formData);
      if (validationErrors.length > 0) {
        toast({
          title: "Erreurs de validation",
          description: validationErrors.join(", "),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check slug availability
      const isAvailable = await checkSlugAvailability(formData.slug);
      if (!isAvailable) {
        toast({
          title: "Erreur",
          description: "Cette URL est déjà utilisée. Veuillez en choisir une autre.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Préparer les données du produit
      const productData = {
        ...formData,
        is_draft: !publish,
        is_active: publish,
        status: publish ? "published" : "draft",
        meta_title: formData.meta_title || formData.name,
        meta_description: formData.meta_description || formData.description?.substring(0, 160),
        slug: formData.slug.trim().toLowerCase(),
        name: formData.name.trim(),
        updated_at: new Date().toISOString(),
        version: (formData.version || 1) + 1,
      };

      let savedProduct;

      if (productId) {
        // Update existing product
        const { data, error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId)
          .select()
          .single();

        if (error) throw error;
        savedProduct = data;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from("products")
          .insert({
            ...productData,
            store_id: storeId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        savedProduct = data;
      }

      if (savedProduct) {
        // Sauvegarder les données associées
        await saveRelatedData(savedProduct.id);

        toast({
          title: "Succès",
          description: publish ? "Produit publié avec succès" : productId ? "Produit mis à jour" : "Produit enregistré en brouillon",
        });

        // Redirect to edit page with the new product ID
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/dashboard/products");
        }
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction de validation complète
  const validateProductData = (data: any): string[] => {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push("Le nom du produit est obligatoire");
    }

    if (!data.slug?.trim()) {
      errors.push("L'URL du produit est obligatoire");
    }

    if (data.price < 0) {
      errors.push("Le prix ne peut pas être négatif");
    }

    if (data.product_type === "digital" && data.downloadable_files?.length === 0) {
      errors.push("Un produit numérique doit avoir au moins un fichier téléchargeable");
    }

    if (data.password_protected && !data.product_password?.trim()) {
      errors.push("Un mot de passe est requis pour les produits protégés");
    }

    if (data.purchase_limit && data.purchase_limit < 1) {
      errors.push("La limite d'achat doit être supérieure à 0");
    }

    if (data.sale_start_date && data.sale_end_date && new Date(data.sale_start_date) > new Date(data.sale_end_date)) {
      errors.push("La date de début de promotion doit être antérieure à la date de fin");
    }

    return errors;
  };

  // Sauvegarder les données associées
  const saveRelatedData = async (productId: string) => {
    try {
      // Sauvegarder les FAQ
      if (formData.faqs?.length > 0) {
        const { error: faqError } = await supabase
          .from("product_faqs")
          .upsert(
            formData.faqs.map((faq: any) => ({
              ...faq,
              product_id: productId,
            })),
            { onConflict: "id" }
          );
        if (faqError) throw faqError;
      }

      // Sauvegarder les champs personnalisés
      if (formData.custom_fields?.length > 0) {
        const { error: fieldsError } = await supabase
          .from("product_custom_fields")
          .upsert(
            formData.custom_fields.map((field: any) => ({
              ...field,
              product_id: productId,
            })),
            { onConflict: "id" }
          );
        if (fieldsError) throw fieldsError;
      }

      // Sauvegarder les variantes
      if (formData.variants?.length > 0) {
        const { error: variantsError } = await supabase
          .from("product_variants")
          .upsert(
            formData.variants.map((variant: any) => ({
              ...variant,
              product_id: productId,
            })),
            { onConflict: "id" }
          );
        if (variantsError) throw variantsError;
      }

      // Sauvegarder les promotions
      if (formData.promotions?.length > 0) {
        const { error: promotionsError } = await supabase
          .from("product_promotions")
          .upsert(
            formData.promotions.map((promotion: any) => ({
              ...promotion,
              product_id: productId,
            })),
            { onConflict: "id" }
          );
        if (promotionsError) throw promotionsError;
      }

      // Sauvegarder les fichiers téléchargeables
      if (formData.downloadable_files?.length > 0) {
        const { error: filesError } = await supabase
          .from("product_files")
          .upsert(
            formData.downloadable_files.map((file: any) => ({
              ...file,
              product_id: productId,
            })),
            { onConflict: "id" }
          );
        if (filesError) throw filesError;
      }

    } catch (error) {
      console.error("Error saving related data:", error);
      throw error;
    }
  };

  const handlePreview = () => {
    if (formData.slug) {
      window.open(`/${storeSlug}/${formData.slug}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold">
              {productId ? "Modifier produit" : "Créer un produit"}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={handlePreview} 
                disabled={!formData.slug}
                className="flex-1 sm:flex-none min-w-0"
                size="sm"
              >
                <Eye className="h-4 w-4 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline truncate">Voir</span>
              </Button>
              <Button 
                onClick={() => handleSave(true)} 
                disabled={loading}
                className="flex-1 sm:flex-none min-w-0"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:mr-2 animate-spin flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Enregistrement...</span>
                  </>
                ) : (
                  <span className="truncate">Publier</span>
                )}
              </Button>
              <Button variant="outline" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 product-form-container modern-bg-secondary">
        <Card className="product-card modern-bg-card modern-border modern-shadow-md">
          <CardContent className="p-3 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7 mb-4 sm:mb-6 h-auto gap-1 overflow-x-auto product-tabs-list">
                <TabsTrigger value="info" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Informations</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="description" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Description</span>
                  <span className="sm:hidden">Desc</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden lg:inline">Visuel & Design</span>
                  <span className="lg:hidden">Visuel</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">Fichiers</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Champs perso.</span>
                  <span className="sm:hidden">Perso</span>
                </TabsTrigger>
                <TabsTrigger value="faq" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">FAQ</TabsTrigger>
                <TabsTrigger value="seo" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">SEO</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="pixels" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Pixels</span>
                  <span className="sm:hidden">Track</span>
                </TabsTrigger>
                <TabsTrigger value="variants" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Variantes</span>
                  <span className="sm:hidden">Var</span>
                </TabsTrigger>
                <TabsTrigger value="promotions" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Promotions</span>
                  <span className="sm:hidden">Promo</span>
                </TabsTrigger>
                <TabsTrigger value="test" className="text-xs sm:text-sm py-2 px-2 min-w-0 flex-shrink-0 product-tab-trigger product-focus-visible">
                  <span className="hidden sm:inline">Tests</span>
                  <span className="sm:hidden">Test</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info">
                <ProductInfoTab
                  formData={formData}
                  updateFormData={updateFormData}
                  storeId={storeId}
                  storeSlug={storeSlug}
                  checkSlugAvailability={checkSlugAvailability}
                />
              </TabsContent>

              <TabsContent value="description">
                <ProductDescriptionTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="visual">
                <ProductVisualTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="files">
                <ProductFilesTab
                  formData={formData}
                  updateFormData={updateFormData}
                  storeId={storeId}
                />
              </TabsContent>

              <TabsContent value="custom">
                <ProductCustomFieldsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="faq">
                <ProductFAQTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="seo">
                <ProductSeoTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="analytics">
                <ProductAnalyticsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="pixels">
                <ProductPixelsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="variants">
                <ProductVariantsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="promotions">
                <ProductPromotionsTab
                  formData={formData}
                  updateFormData={updateFormData}
                />
              </TabsContent>

              <TabsContent value="test">
                <ProductFeatureTest />
              </TabsContent>
            </Tabs>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard/products")}
                className="w-full sm:w-auto min-w-0"
              >
                <span className="truncate">Annuler</span>
              </Button>
              <Button 
                onClick={() => handleSave(false)} 
                disabled={loading}
                className="w-full sm:w-auto min-w-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin flex-shrink-0" />
                    <span className="truncate">Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Enregistrer</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
