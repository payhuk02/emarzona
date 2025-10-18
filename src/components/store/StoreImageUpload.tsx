import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StoreImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  aspectRatio?: "square" | "banner";
  description?: string;
}

const StoreImageUpload = ({ 
  label, 
  value, 
  onChange, 
  disabled = false,
  aspectRatio = "square",
  description
}: StoreImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner une image",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erreur",
          description: "L'image ne doit pas dépasser 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);

      onChange(publicUrl);

      toast({
        title: "Succès",
        description: "Image téléchargée avec succès",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de télécharger l'image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {value ? (
        <div className={`relative w-full rounded-lg overflow-hidden bg-muted ${
          aspectRatio === "banner" ? "aspect-[3/1]" : "aspect-square max-w-xs"
        }`}>
          <img
            src={value}
            alt={label}
            className="h-full w-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
          aspectRatio === "banner" ? "aspect-[3/1]" : "aspect-square max-w-xs"
        }`}>
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (max 5MB)</p>
          </div>
        </div>
      )}

      <div>
        <input
          id={`image-upload-${label}`}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading || disabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`image-upload-${label}`)?.click()}
          disabled={uploading || disabled}
          className="w-full"
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              Téléchargement...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {value ? "Changer l'image" : "Télécharger une image"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StoreImageUpload;
