import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, AlertCircle, Check, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadImage, validateImageFile, replaceImage, ImageType } from "@/lib/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StoreImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  aspectRatio?: "square" | "banner" | "free";
  description?: string;
  maxSize?: number; // en MB
  acceptedFormats?: string[];
  imageType?: ImageType; // Type d'image pour le storage
}

const StoreImageUpload = ({
  label,
  value,
  onChange,
  disabled = false,
  aspectRatio = "free",
  description,
  maxSize = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  imageType = "store-logo"
}: StoreImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Récupérer l'ID utilisateur au montage
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

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

  const handleImageUpload = async (file: File): Promise<string | null> => {
    if (!userId) {
      throw new Error("Utilisateur non authentifié");
    }

    // Si une image existe déjà, on utilise replaceImage
    if (value) {
      const result = await replaceImage(value, file, imageType, userId);
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'upload");
      }
      return result.url || null;
    }

    // Sinon, upload simple
    const result = await uploadImage({
      file,
      type: imageType,
      userId,
      maxSizeMB: maxSize,
      acceptedFormats
    });

    if (!result.success) {
      throw new Error(result.error || "Erreur lors de l'upload");
    }

    return result.url || null;
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    
    // Validation du fichier
    const validation = validateImageFile(file, maxSize, acceptedFormats);
    if (!validation.valid) {
      setError(validation.error || "Fichier invalide");
      toast({
        title: "Erreur de fichier",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    // Vérifier que l'utilisateur est authentifié
    if (!userId) {
      setError("Vous devez être connecté pour uploader une image");
      toast({
        title: "Authentification requise",
        description: "Veuillez vous connecter pour uploader une image.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const url = await handleImageUpload(file);
      if (url) {
        onChange(url);
        toast({
          title: "Image uploadée",
          description: "L'image a été uploadée avec succès."
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "Impossible d'uploader l'image. Réessayez.";
      setError(errorMessage);
      toast({
        title: "Erreur d'upload",
        description: errorMessage,
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
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Guidelines Médias" className="text-gray-500 hover:text-gray-700">
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent align="start">
            <div className="max-w-[260px] text-xs">
              {aspectRatio === 'banner' ? 'Recommandé: 1280×720 (16:9) – WebP/JPEG' : aspectRatio === 'square' ? 'Recommandé: 500×500 (carré) – WebP/PNG' : 'Utilisez des images optimisées (WebP)'}
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
                    aria-label={`Remplacer ${label.toLowerCase()}`}
                  >
                    <Upload className="h-4 w-4 mr-1" aria-hidden="true" />
                    Remplacer
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    disabled={disabled || isUploading}
                    aria-label={`Supprimer ${label.toLowerCase()}`}
                  >
                    <X className="h-4 w-4 mr-1" aria-hidden="true" />
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
          role="button"
          tabIndex={disabled || isUploading ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled && !isUploading) {
                fileInputRef.current?.click();
              }
            }
          }}
          aria-label={`Glissez-déposez ou cliquez pour uploader ${label.toLowerCase()}`}
          aria-disabled={disabled || isUploading}
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
      {!description && (
        <p className="text-xs text-muted-foreground">
          {aspectRatio === 'banner' ? 'Format recommandé: 1280×720 (16:9) – idéal pour les bannières.' : aspectRatio === 'square' ? 'Format recommandé: 500×500 (ratio 1:1) pour les logos.' : 'Préférez des images en WebP, taille ≤ ' + maxSize + 'MB.'}
        </p>
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