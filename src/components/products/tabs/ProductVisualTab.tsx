import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ImageUpload from "../ImageUpload";
import { X } from "lucide-react";

interface ProductVisualTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductVisualTab = ({ formData, updateFormData }: ProductVisualTabProps) => {
  const handleMainImageChange = (url: string) => {
    updateFormData("image_url", url);
  };

  const handleAddImage = (url: string) => {
    const currentImages = formData.images || [];
    updateFormData("images", [...currentImages, url]);
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = [...(formData.images || [])];
    currentImages.splice(index, 1);
    updateFormData("images", currentImages);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Image principale du produit</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Cette image sera affichée en premier sur la page du produit
        </p>
        <ImageUpload
          value={formData.image_url}
          onChange={handleMainImageChange}
        />
      </div>

      <div>
        <Label>Galerie d'images</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Ajoutez plusieurs images pour présenter votre produit sous différents angles
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {formData.images?.map((url: string, index: number) => (
            <div key={index} className="relative group aspect-square rounded-lg border overflow-hidden">
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <ImageUpload
          value=""
          onChange={handleAddImage}
        />
      </div>
    </div>
  );
};
