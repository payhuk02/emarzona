import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StoreImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  aspectRatio?: "square" | "banner" | "free";
  description?: string;
  maxSize?: number; // en MB
  acceptedFormats?: string[];
}

const StoreImageUpload = ({
  label,
  value,
  onChange,
  disabled = false,
  aspectRatio = "free",
  description,
  maxSize = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"]
}: StoreImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "banner":
        return "aspect-[3/1]";
      default:
        return "aspect-auto";
    }
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedFormats.includes(file.type)) {
      return `Format non supporté. Formats acceptés : ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `Fichier trop volumineux. Taille maximale : ${maxSize}MB`;
    }
    
    return null;
  };

  const uploadImage = async (file: File): Promise<string> => {
    // Simulation d'upload - remplacer par votre logique d'upload réelle
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Ici vous devriez uploader vers votre service de stockage (Supabase Storage, Cloudinary, etc.)
        // Pour l'instant, on utilise l'URL data pour la démo
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast({
        title: "Erreur de fichier",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast({
        title: "Image uploadée",
        description: "L'image a été uploadée avec succès."
      });
    } catch (error) {
      console.error("Upload error:", error);
      setError("Erreur lors de l'upload de l'image");
      toast({
        title: "Erreur d'upload",
        description: "Impossible d'uploader l'image. Réessayez.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || isUploading) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = () => {
    onChange("");
    setError(null);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      
      {value ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative group">
              <div className={`${getAspectRatioClass()} overflow-hidden`}>
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Remplacer
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    disabled={disabled || isUploading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Upload en cours...</p>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Cliquez ou glissez-déposez une image</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formats acceptés : JPG, PNG, WebP, GIF (max {maxSize}MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
};

export default StoreImageUpload;