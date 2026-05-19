import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { uploadCatalogImage } from '@/lib/images/product-image-upload';
import { IMAGE_FILE_LIMITS } from '@/config/image-formats';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const ImageUpload = ({ value, onChange, disabled = false }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!IMAGE_FILE_LIMITS.allowedFormats.includes(file.type)) {
        toast({
          title: "Format d'image non valide",
          description: `Formats acceptés : ${IMAGE_FILE_LIMITS.allowedExtensions.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }

      if (file.size > IMAGE_FILE_LIMITS.maxFileSize) {
        toast({
          title: 'Image trop lourde',
          description: `Maximum ${IMAGE_FILE_LIMITS.maxFileSizeMB} Mo`,
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);

      const result = await uploadCatalogImage(file, 'products', {
        normalizeToCatalogFormat: true,
        filePrefix: 'product',
      });

      if (!result.success || !result.url) {
        throw result.error ?? new Error('Upload échoué');
      }

      onChange(result.url);

      toast({
        title: 'Succès',
        description: 'Image optimisée 1536×1024 et téléchargée',
      });
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      logger.error('Error uploading image', { error: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible de télécharger l'image",
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <Label>Image du produit</Label>

      {value ? (
        <div className="relative aspect-square w-full max-w-sm rounded-lg overflow-hidden bg-muted">
          <img src={value} alt="Aperçu produit" className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Supprimer l'image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Téléchargez une image de produit</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP — recadrage auto 1536×1024
            </p>
          </div>
        </div>
      )}

      <div>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading || disabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('image-upload')?.click()}
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
              {value ? "Changer l'image" : 'Télécharger une image'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ImageUpload;
