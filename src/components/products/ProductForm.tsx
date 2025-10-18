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

  // État du formulaire
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    category: initialData?.category || "",
    pricing_model: initialData?.pricing_model || "one-time",
    price: initialData?.price || 0,
    promotional_price: initialData?.promotional_price || null,
    currency: initialData?.currency || "XOF",
    description: initialData?.description || "",
    image_url: initialData?.image_url || "",
    images: initialData?.images || [],
    downloadable_files: initialData?.downloadable_files || [],
    custom_fields: initialData?.custom_fields || [],
    faqs: initialData?.faqs || [],
    automatic_discount_enabled: initialData?.automatic_discount_enabled || false,
    discount_trigger: initialData?.discount_trigger || "",
    sale_start_date: initialData?.sale_start_date || null,
    sale_end_date: initialData?.sale_end_date || null,
    post_purchase_guide_url: initialData?.post_purchase_guide_url || "",
    password_protected: initialData?.password_protected || false,
    product_password: initialData?.product_password || "",
    watermark_enabled: initialData?.watermark_enabled || false,
    purchase_limit: initialData?.purchase_limit || null,
    hide_from_store: initialData?.hide_from_store || false,
    hide_purchase_count: initialData?.hide_purchase_count || false,
    collect_shipping_address: initialData?.collect_shipping_address || false,
    meta_title: initialData?.meta_title || "",
    meta_description: initialData?.meta_description || "",
    og_image: initialData?.og_image || "",
    is_draft: initialData?.is_draft !== undefined ? initialData.is_draft : true,
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
      // Validation
      if (!formData.name.trim()) {
        toast({
          title: "Erreur",
          description: "Le nom du produit est obligatoire",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!formData.slug.trim()) {
        toast({
          title: "Erreur",
          description: "L'URL du produit est obligatoire",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (formData.price < 0) {
        toast({
          title: "Erreur",
          description: "Le prix ne peut pas être négatif",
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

      const productData = {
        ...formData,
        is_draft: !publish,
        is_active: publish,
        meta_title: formData.meta_title || formData.name,
        meta_description: formData.meta_description || formData.description?.substring(0, 160),
        slug: formData.slug.trim().toLowerCase(),
        name: formData.name.trim(),
      };

      if (productId) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", productId);

        if (error) throw error;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from("products")
          .insert({
            ...productData,
            store_id: storeId,
          })
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          toast({
            title: "Succès",
            description: publish ? "Produit publié avec succès" : "Produit enregistré en brouillon",
          });

          // Redirect to edit page with the new product ID
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/dashboard/products");
          }
        }
      }

      if (productId) {
        toast({
          title: "Succès",
          description: publish ? "Produit publié avec succès" : "Produit mis à jour",
        });

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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-4 sm:mb-6 h-auto gap-1 overflow-x-auto">
                <TabsTrigger value="info" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden sm:inline">Informations</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger value="description" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden sm:inline">Description</span>
                  <span className="sm:hidden">Desc</span>
                </TabsTrigger>
                <TabsTrigger value="visual" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden lg:inline">Visuel & Design</span>
                  <span className="lg:hidden">Visuel</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="text-xs sm:text-sm py-2 min-w-0">Fichiers</TabsTrigger>
                <TabsTrigger value="custom" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden sm:inline">Champs perso.</span>
                  <span className="sm:hidden">Perso</span>
                </TabsTrigger>
                <TabsTrigger value="faq" className="text-xs sm:text-sm py-2 min-w-0">FAQ</TabsTrigger>
                <TabsTrigger value="seo" className="text-xs sm:text-sm py-2 min-w-0">SEO</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="pixels" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden sm:inline">Pixels</span>
                  <span className="sm:hidden">Track</span>
                </TabsTrigger>
                <TabsTrigger value="variants" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden sm:inline">Variantes</span>
                  <span className="sm:hidden">Var</span>
                </TabsTrigger>
                <TabsTrigger value="promotions" className="text-xs sm:text-sm py-2 min-w-0">
                  <span className="hidden sm:inline">Promotions</span>
                  <span className="sm:hidden">Promo</span>
                </TabsTrigger>
                <TabsTrigger value="test" className="text-xs sm:text-sm py-2 min-w-0">
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
