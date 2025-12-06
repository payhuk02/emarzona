import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BottomSheet,
  BottomSheetContent,
} from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MobileFormField } from "@/components/ui/mobile-form-field";
import ProductSlugEditor from "./ProductSlugEditor";
import ImageUpload from "./ImageUpload";
import { Info } from '@/components/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProductManagement } from "@/hooks/useProductManagement";
import { Product } from "@/hooks/useProducts";
import { useSpaceInputFix } from "@/hooks/useSpaceInputFix";
import { useResponsiveModal } from "@/hooks/use-responsive-modal";

interface EditProductDialogProps {
  product: Product;
  storeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

const EditProductDialogComponent = ({
  product,
  storeSlug,
  open,
  onOpenChange,
  onProductUpdated,
}: EditProductDialogProps) => {
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price.toString());
  const [category, setCategory] = useState(product.category || "");
  const [productType, setProductType] = useState(product.product_type || "");
  const [imageUrl, setImageUrl] = useState(product.image_url || "");
  const [isActive, setIsActive] = useState(product.is_active);

  const { updateProduct, checkSlugAvailability, loading } =
    useProductManagement(product.store_id);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const { useBottomSheet } = useResponsiveModal();

  useEffect(() => {
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description || "");
    setPrice(product.price.toString());
    setCategory(product.category || "");
    setProductType(product.product_type || "");
    setImageUrl(product.image_url || "");
    setIsActive(product.is_active);
  }, [product]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await updateProduct(product.id, {
      name,
      slug,
      description,
      price: parseFloat(price) || 0,
      category,
      product_type: productType,
      image_url: imageUrl,
      is_active: isActive,
    });

    if (success) {
      onOpenChange(false);
      onProductUpdated();
    }
  }, [product.id, name, slug, description, price, category, productType, imageUrl, isActive, updateProduct, onOpenChange, onProductUpdated]);

  const handleCheckAvailability = useCallback(async (slugToCheck: string) => {
    return await checkSlugAvailability(slugToCheck, product.id);
  }, [checkSlugAvailability, product.id]);

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="isActive">Produit actif</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <MobileFormField
        label="Nom du produit"
        name="name"
        type="text"
        value={name}
        onChange={setName}
        required
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: "Formation Excel complète",
        }}
      />

      <ProductSlugEditor
        productName={name}
        currentSlug={slug}
        storeSlug={storeSlug}
        onSlugChange={setSlug}
        onCheckAvailability={handleCheckAvailability}
      />

      <MobileFormField
        label="Prix (XOF)"
        name="price"
        type="number"
        value={price}
        onChange={setPrice}
        required
        fieldProps={{
          placeholder: "5000",
          min: "0",
          step: "1",
        }}
      />

      <MobileFormField
        label="Catégorie"
        name="category"
        type="text"
        value={category}
        onChange={setCategory}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: "Formation",
        }}
      />

      <MobileFormField
        label="Type de produit"
        name="productType"
        type="text"
        value={productType}
        onChange={setProductType}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: "Produit numérique",
        }}
      />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Recommandé: 1280×720 (16:9), WebP/JPEG</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Guidelines Médias" className="text-gray-500 hover:text-gray-700">
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent align="end">
                  <div className="max-w-[260px] text-xs">
                    Utilisez 1280×720 (ratio 16:9) pour un rendu optimal.
                    <a
                      href="https://github.com/payhuk02/emarzona/blob/main/docs/MEDIA_GUIDELINES.md"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline ml-1"
                    >Voir Médias</a>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
            />
            <p className="text-xs text-gray-500">Astuce: respectez 1280×720 (16:9) pour les cartes Marketplace et la boutique.</p>
          </div>

      <MobileFormField
        label="Description"
        name="description"
        type="textarea"
        value={description}
        onChange={setDescription}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: "Décrivez votre produit...",
          rows: 4,
        }}
      />

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title="Modifier le produit"
            description="Modifiez les informations de votre produit"
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier le produit</DialogTitle>
              <DialogDescription>
                Modifiez les informations de votre produit
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

EditProductDialogComponent.displayName = 'EditProductDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
const EditProductDialog = React.memo(EditProductDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onProductUpdated === nextProps.onProductUpdated &&
    prevProps.storeSlug === nextProps.storeSlug &&
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.product?.name === nextProps.product?.name &&
    prevProps.product?.price === nextProps.product?.price &&
    prevProps.product?.is_active === nextProps.product?.is_active
  );
});

EditProductDialog.displayName = 'EditProductDialog';

export default EditProductDialog;
