import { useId, useRef, useState } from 'react';
import { RefreshCw, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { uploadPlatformBlogImage } from '@/lib/admin/platformBlogImageUpload';
import { cn } from '@/lib/utils';

interface PlatformBlogImageFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  slug?: string;
  purpose: 'featured' | 'og';
  className?: string;
}

export function PlatformBlogImageField({
  label,
  value,
  onChange,
  slug,
  purpose,
  className,
}: PlatformBlogImageFieldProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadPlatformBlogImage(file, { slug, purpose });
      onChange(url);
      toast({ title: 'Image uploadée' });
    } catch (e) {
      toast({
        title: "Échec de l'upload",
        description: e instanceof Error ? e.message : 'Réessayez.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      {value ? (
        <div className="relative w-full max-w-xs aspect-video rounded-lg border overflow-hidden bg-muted">
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
            aria-label="Supprimer l'image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {value ? 'Remplacer' : 'Uploader une image'}
            </>
          )}
        </Button>
      </div>
      <Input
        placeholder="Ou coller une URL d'image"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
