import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/products/RichTextEditor";

interface ProductDescriptionTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductDescriptionTab = ({ formData, updateFormData }: ProductDescriptionTabProps) => {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="description">Description complète</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Décrivez votre produit en détail pour convaincre vos clients
        </p>
        <RichTextEditor
          content={formData.description || ''}
          onChange={(content) => updateFormData("description", content)}
          placeholder="Décrivez votre produit..."
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">SEO & Partage sur les réseaux sociaux</h3>
        
        <div>
          <Label htmlFor="meta_title">Titre SEO</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Optimisez votre référencement (60 caractères max)
          </p>
          <Input
            id="meta_title"
            value={formData.meta_title}
            onChange={(e) => updateFormData("meta_title", e.target.value)}
            placeholder={formData.name || "Titre pour les moteurs de recherche"}
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.meta_title.length}/60 caractères
          </p>
        </div>

        <div>
          <Label htmlFor="meta_description">Description SEO</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Description pour les moteurs de recherche (160 caractères max)
          </p>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) => updateFormData("meta_description", e.target.value)}
            placeholder="Description courte pour Google et les réseaux sociaux"
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {formData.meta_description.length}/160 caractères
          </p>
        </div>

        <div>
          <Label htmlFor="og_image">Image Open Graph</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Image affichée lors du partage sur les réseaux sociaux (1200x630px recommandé)
          </p>
          <Input
            id="og_image"
            value={formData.og_image}
            onChange={(e) => updateFormData("og_image", e.target.value)}
            placeholder="URL de l'image"
          />
        </div>
      </div>
    </div>
  );
};
