import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X, Copy, ExternalLink } from "lucide-react";
import { generateSlug } from "@/lib/store-utils";
import { useToast } from "@/hooks/use-toast";

interface ProductSlugEditorProps {
  productName: string;
  currentSlug: string;
  storeSlug: string;
  onSlugChange: (slug: string) => void;
  onCheckAvailability: (slug: string) => Promise<boolean>;
  disabled?: boolean;
}

const ProductSlugEditor = ({
  productName,
  currentSlug,
  storeSlug,
  onSlugChange,
  onCheckAvailability,
  disabled = false,
}: ProductSlugEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [slug, setSlug] = useState(currentSlug);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentSlug && productName) {
      const autoSlug = generateSlug(productName);
      setSlug(autoSlug);
    }
  }, [productName, currentSlug]);

  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  const checkAvailability = async (slugToCheck: string) => {
    if (!slugToCheck) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    const available = await onCheckAvailability(slugToCheck);
    setIsAvailable(available);
    setIsChecking(false);
  };

  useEffect(() => {
    if (isEditing && slug && slug !== currentSlug) {
      const timer = setTimeout(() => {
        checkAvailability(slug);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slug, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (isAvailable && slug) {
      onSlugChange(slug);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setSlug(currentSlug);
    setIsEditing(false);
    setIsAvailable(null);
  };

  const handleSlugInput = (value: string) => {
    const normalized = generateSlug(value);
    setSlug(normalized);
  };

  const productUrl = `${window.location.origin}/stores/${storeSlug}/products/${slug || currentSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      toast({
        title: "Lien copié",
        description: "Le lien du produit a été copié dans le presse-papiers",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    window.open(productUrl, "_blank");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Lien du produit</label>
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={slug}
            onChange={(e) => handleSlugInput(e.target.value)}
            disabled={!isEditing || disabled}
            placeholder="nom-du-produit"
            className="pr-8"
          />
          {isEditing && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {isChecking ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : isAvailable === true ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : isAvailable === false ? (
                <X className="h-4 w-4 text-destructive" />
              ) : null}
            </div>
          )}
        </div>

        {isEditing ? (
          <>
            <Button
              size="icon"
              variant="default"
              onClick={handleSave}
              disabled={!isAvailable || isChecking || disabled}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCancel}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon"
              variant="outline"
              onClick={handleEdit}
              disabled={disabled}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopyLink}
              disabled={disabled}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={handlePreview}
              disabled={disabled || !currentSlug}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        URL complète : <span className="font-mono">{productUrl}</span>
      </p>

      {isEditing && isAvailable === false && (
        <p className="text-xs text-destructive">
          Ce lien est déjà utilisé. Veuillez en choisir un autre.
        </p>
      )}
    </div>
  );
};

export default ProductSlugEditor;
