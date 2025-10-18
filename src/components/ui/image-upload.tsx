import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Download, 
  Eye, 
  Trash2,
  RotateCw,
  Crop,
  Palette,
  FileImage,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // en MB
  acceptedFormats?: string[];
  storeId: string;
  className?: string;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export const ImageUpload = ({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  storeId,
  className,
  disabled = false
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [previewImages, setPreviewImages] = useState<UploadedFile[]>([]);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `stores/${storeId}/products/${fileName}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }, [storeId]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validation des fichiers
    for (const file of fileArray) {
      if (!acceptedFormats.includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: `Le fichier ${file.name} n'est pas dans un format supporté.`,
          variant: "destructive",
        });
        return;
      }

      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `Le fichier ${file.name} dépasse la taille maximale de ${maxSize}MB.`,
          variant: "destructive",
        });
        return;
      }
    }

    if (!multiple && fileArray.length > 1) {
      toast({
        title: "Trop de fichiers",
        description: "Vous ne pouvez sélectionner qu'un seul fichier.",
        variant: "destructive",
      });
      return;
    }

    if (multiple && fileArray.length + (Array.isArray(value) ? value.length : (value ? 1 : 0)) > maxFiles) {
      toast({
        title: "Limite de fichiers atteinte",
        description: `Vous ne pouvez pas télécharger plus de ${maxFiles} fichiers.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const url = await uploadFile(file);
        uploadedUrls.push(url);
        
        // Mettre à jour le progrès
        setUploadProgress(((i + 1) / fileArray.length) * 100);
        
        // Ajouter à la prévisualisation
        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        };
        
        setPreviewImages(prev => [...prev, uploadedFile]);
      }

      // Mettre à jour la valeur
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
        onChange([...currentValues, ...uploadedUrls]);
      } else {
        onChange(uploadedUrls[0]);
      }

      toast({
        title: "Succès",
        description: `${fileArray.length} fichier(s) téléchargé(s) avec succès.`,
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Une erreur est survenue lors du téléchargement.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    if (multiple && Array.isArray(value)) {
      const newValues = value.filter((_, i) => i !== index);
      onChange(newValues);
    } else {
      onChange("");
    }
    
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImagePreview = () => {
    if (multiple && Array.isArray(value)) {
      return value;
    } else if (value && !Array.isArray(value)) {
      return [value];
    }
    return [];
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone de téléchargement */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors",
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-medium">
                {multiple ? "Téléchargez vos images" : "Téléchargez une image"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Téléchargement..." : "Sélectionner des fichiers"}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || uploading}
                className="flex items-center gap-2"
              >
                <FileImage className="h-4 w-4" />
                Depuis l'URL
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              <p>Formats acceptés: {acceptedFormats.map(f => f.split('/')[1]).join(', ')}</p>
              <p>Taille maximale: {maxSize}MB par fichier</p>
              {multiple && <p>Maximum: {maxFiles} fichiers</p>}
            </div>
          </div>

          {/* Barre de progression */}
          {uploading && (
            <div className="mt-4">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center mt-2">
                Téléchargement en cours... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />

      {/* Prévisualisation des images */}
      {getImagePreview().length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Images téléchargées</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getImagePreview().map((url, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative group">
                    <img
                      src={url}
                      alt={`Prévisualisation ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Overlay avec actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Badge de statut */}
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Téléchargé
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">
                      Image {index + 1}
                    </p>
                    <p className="text-xs text-gray-500">
                      {previewImages[index]?.name || `Image ${index + 1}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Input pour URL d'image */}
      <div className="space-y-2">
        <Label htmlFor="image-url">Ou ajoutez une image depuis une URL</Label>
        <div className="flex gap-2">
          <Input
            id="image-url"
            placeholder="https://example.com/image.jpg"
            className="flex-1"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const url = e.currentTarget.value.trim();
                if (url) {
                  if (multiple) {
                    const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
                    onChange([...currentValues, url]);
                  } else {
                    onChange(url);
                  }
                  e.currentTarget.value = '';
                }
              }
            }}
          />
          <Button
            variant="outline"
            disabled={disabled}
            onClick={() => {
              const input = document.getElementById('image-url') as HTMLInputElement;
              const url = input.value.trim();
              if (url) {
                if (multiple) {
                  const currentValues = Array.isArray(value) ? value : (value ? [value] : []);
                  onChange([...currentValues, url]);
                } else {
                  onChange(url);
                }
                input.value = '';
              }
            }}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
};
