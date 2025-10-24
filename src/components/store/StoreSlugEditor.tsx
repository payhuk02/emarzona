import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Edit, Check, X, Globe, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";

interface StoreSlugEditorProps {
  currentSlug: string;
  onSlugChange: (newSlug: string) => Promise<boolean>;
  onCheckAvailability: (slug: string, excludeStoreId?: string) => Promise<boolean>;
  storeId: string;
}

const StoreSlugEditor = ({ currentSlug, onSlugChange, onCheckAvailability, storeId }: StoreSlugEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newSlug, setNewSlug] = useState(currentSlug);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  // Debounce le slug pour éviter trop d'appels API
  const debouncedSlug = useDebounce(newSlug, 500);

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Vérifier la disponibilité quand le slug debounced change
  useEffect(() => {
    if (debouncedSlug !== currentSlug && debouncedSlug.length > 0) {
      checkAvailability(debouncedSlug);
    } else {
      setIsAvailable(null);
    }
  }, [debouncedSlug]);

  const handleSlugChange = (value: string) => {
    const slug = generateSlug(value);
    setNewSlug(slug);
    // La vérification se fera automatiquement via useEffect + debounce
  };

  const checkAvailability = async (slug: string) => {
    if (slug === currentSlug) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const available = await onCheckAvailability(slug, storeId);
      setIsAvailable(available);
    } catch (error) {
      console.error("Error checking slug availability:", error);
      setIsAvailable(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    if (newSlug === currentSlug) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const success = await onSlugChange(newSlug);
      if (success) {
        setIsEditing(false);
        toast({
          title: "Slug mis à jour",
          description: "Le lien de votre boutique a été mis à jour avec succès."
        });
      }
    } catch (error) {
      console.error("Error updating slug:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le lien de votre boutique.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setNewSlug(currentSlug);
    setIsAvailable(null);
    setIsEditing(false);
  };

  const getStoreUrl = (slug: string) => {
    return `${window.location.origin}/stores/${slug}`;
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(getStoreUrl(currentSlug));
    toast({
      title: "Lien copié !",
      description: "Le lien de votre boutique a été copié dans le presse-papiers."
    });
  };

  const getAvailabilityStatus = () => {
    if (isChecking) return { text: "Vérification...", variant: "secondary" as const };
    if (isAvailable === true) return { text: "Disponible", variant: "default" as const };
    if (isAvailable === false) return { text: "Indisponible", variant: "destructive" as const };
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Lien de votre boutique
            </CardTitle>
            <CardDescription className="text-sm">
              Personnalisez l'URL de votre boutique publique
            </CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slug-input">Nouveau slug</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    id="slug-input"
                    value={newSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="mon-slug-personnalise"
                    disabled={isUpdating}
                  />
                </div>
                {getAvailabilityStatus() && (
                  <Badge variant={getAvailabilityStatus()!.variant} className="px-3 py-1">
                    {getAvailabilityStatus()!.text}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <p>URL complète : <code className="bg-muted px-1 rounded">{getStoreUrl(newSlug)}</code></p>
                <p className="mt-1">
                  Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating || isChecking || !isAvailable || newSlug === currentSlug}
                className="gradient-primary"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="h-3 w-3 mr-1" />
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Input
                value={getStoreUrl(currentSlug)}
                readOnly
                className="font-mono text-xs flex-1"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="Copier le lien"
                  className="h-9 w-9"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(getStoreUrl(currentSlug), '_blank')}
                  title="Ouvrir dans un nouvel onglet"
                  className="h-9 w-9"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Conseils pour votre slug :</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Utilisez des mots-clés liés à votre activité</li>
                    <li>Évitez les caractères spéciaux et les espaces</li>
                    <li>Gardez-le court et mémorable</li>
                    <li>Le slug ne peut pas être modifié après la création</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoreSlugEditor;