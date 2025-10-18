import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateSlug } from "@/lib/store-utils";

export const useProductManagement = (storeId: string) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkSlugAvailability = async (
    slug: string,
    excludeProductId?: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc("is_product_slug_available", {
        check_slug: slug,
        check_store_id: storeId,
        exclude_product_id: excludeProductId || null,
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

  const createProduct = async (productData: {
    name: string;
    slug?: string;
    description?: string;
    price: number;
    currency?: string;
    category?: string;
    product_type?: string;
    image_url?: string;
  }): Promise<boolean> => {
    setLoading(true);
    try {
      const slug = productData.slug || generateSlug(productData.name);

      // Check slug availability
      const isAvailable = await checkSlugAvailability(slug);
      if (!isAvailable) {
        toast({
          title: "Erreur",
          description: "Ce lien est déjà utilisé pour un autre produit",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase.from("products").insert({
        store_id: storeId,
        name: productData.name,
        slug,
        description: productData.description,
        price: productData.price,
        currency: productData.currency || "XOF",
        category: productData.category,
        product_type: productData.product_type,
        image_url: productData.image_url,
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit créé avec succès",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (
    productId: string,
    updates: {
      name?: string;
      slug?: string;
      description?: string;
      price?: number;
      currency?: string;
      category?: string;
      product_type?: string;
      image_url?: string;
      is_active?: boolean;
    }
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // If slug is being updated, check availability
      if (updates.slug) {
        const isAvailable = await checkSlugAvailability(
          updates.slug,
          productId
        );
        if (!isAvailable) {
          toast({
            title: "Erreur",
            description: "Ce lien est déjà utilisé pour un autre produit",
            variant: "destructive",
          });
          return false;
        }
      }

      const { error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit mis à jour",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit supprimé",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    checkSlugAvailability,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
