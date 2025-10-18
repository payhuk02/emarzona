import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ProductSlugEditor from "./ProductSlugEditor";
import ImageUpload from "./ImageUpload";
import { useProductManagement } from "@/hooks/useProductManagement";
import { Product } from "@/hooks/useProducts";

interface EditProductDialogProps {
  product: Product;
  storeSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated: () => void;
}

const EditProductDialog = ({
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

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const handleCheckAvailability = async (slugToCheck: string) => {
    return await checkSlugAvailability(slugToCheck, product.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le produit</DialogTitle>
          <DialogDescription>
            Modifiez les informations de votre produit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Produit actif</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div>
            <Label htmlFor="name">Nom du produit *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Formation Excel complète"
              required
            />
          </div>

          <ProductSlugEditor
            productName={name}
            currentSlug={slug}
            storeSlug={storeSlug}
            onSlugChange={setSlug}
            onCheckAvailability={handleCheckAvailability}
          />

          <div>
            <Label htmlFor="price">Prix (XOF) *</Label>
            <Input
              id="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="5000"
              required
              min="0"
              step="1"
            />
          </div>

          <div>
            <Label htmlFor="category">Catégorie</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Formation"
            />
          </div>

          <div>
            <Label htmlFor="productType">Type de produit</Label>
            <Input
              id="productType"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="Produit numérique"
            />
          </div>

          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
          />

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre produit..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
