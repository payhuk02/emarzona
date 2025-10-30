import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Info } from "lucide-react";
import ProductSlugEditor from "./ProductSlugEditor";
import ImageUpload from "./ImageUpload";
import { useProductManagement } from "@/hooks/useProductManagement";
import { generateSlug } from "@/lib/store-utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CreateProductDialogProps {
  storeId: string;
  storeSlug: string;
  onProductCreated: () => void;
}

const CreateProductDialog = ({
  storeId,
  storeSlug,
  onProductCreated,
}: CreateProductDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [productType, setProductType] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const { createProduct, checkSlugAvailability, loading } =
    useProductManagement(storeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await createProduct({
      name,
      slug: slug || generateSlug(name),
      description,
      price: parseFloat(price) || 0,
      category,
      product_type: productType,
      image_url: imageUrl,
    });

    if (success) {
      setOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      setPrice("");
      setCategory("");
      setProductType("");
      setImageUrl("");
      onProductCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau produit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un produit</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau produit à votre boutique
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            onCheckAvailability={checkSlugAvailability}
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
                      href="https://github.com/payhuk02/payhula/blob/main/docs/MEDIA_GUIDELINES.md"
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
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Création..." : "Créer le produit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductDialog;
