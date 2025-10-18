import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { generateSlug } from "@/lib/store-utils";

interface StoreSlugEditorProps {
  currentSlug: string;
  onSlugChange: (slug: string) => Promise<boolean>;
  onCheckAvailability: (slug: string, excludeId?: string) => Promise<boolean>;
  storeId: string;
  disabled?: boolean;
}

const StoreSlugEditor = ({
  currentSlug,
  onSlugChange,
  onCheckAvailability,
  storeId,
  disabled = false,
}: StoreSlugEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [slug, setSlug] = useState(currentSlug);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setSlug(currentSlug);
  }, [currentSlug]);

  useEffect(() => {
    if (isEditing && slug && slug !== currentSlug) {
      const timer = setTimeout(async () => {
        setIsChecking(true);
        const available = await onCheckAvailability(slug, storeId);
        setIsAvailable(available);
        setIsChecking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [slug, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isAvailable && slug) {
      const success = await onSlugChange(slug);
      if (success) {
        setIsEditing(false);
        setIsAvailable(null);
      }
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

  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">Slug (URL)</label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={slug}
            onChange={(e) => handleSlugInput(e.target.value)}
            disabled={!isEditing || disabled}
            className="font-mono text-sm pr-8"
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
          <Button
            size="icon"
            variant="outline"
            onClick={handleEdit}
            disabled={disabled}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isEditing && isAvailable === false && (
        <p className="text-xs text-destructive">
          Ce slug est déjà utilisé. Veuillez en choisir un autre.
        </p>
      )}
    </div>
  );
};

export default StoreSlugEditor;
