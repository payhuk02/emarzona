import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencySelect } from "@/components/ui/currency-select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateSlug } from "@/lib/store-utils";
import { Loader2, Check, X } from "lucide-react";

interface StoreFormProps {
  onSuccess: () => void;
  initialData?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    default_currency?: string;
  };
}

const StoreForm = ({ onSuccess, initialData }: StoreFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [defaultCurrency, setDefaultCurrency] = useState(initialData?.default_currency || "XOF");
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNameChange = (value: string) => {
    setName(value);
    const generatedSlug = generateSlug(value);
    setSlug(generatedSlug);
    if (generatedSlug) {
      checkSlugAvailability(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    const cleanSlug = generateSlug(value);
    setSlug(cleanSlug);
    if (cleanSlug) {
      checkSlugAvailability(cleanSlug);
    }
  };

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    try {
      const { data, error } = await supabase.rpc('is_store_slug_available', {
        check_slug: slugToCheck,
        exclude_store_id: initialData?.id || null,
      });

      if (error) throw error;
      setSlugAvailable(data);
    } catch (error: any) {
      console.error("Error checking slug:", error);
      setSlugAvailable(null);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !slug) {
      toast({
        title: "Erreur",
        description: "Le nom et le slug sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (slugAvailable === false) {
      toast({
        title: "Erreur",
        description: "Ce nom de boutique est déjà utilisé",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Vous devez être connecté");
      }

      if (initialData) {
        // Update existing store
        const { error } = await supabase
          .from('stores')
          .update({
            name,
            slug,
            description: description || null,
            default_currency: defaultCurrency,
          })
          .eq('id', initialData.id);

        if (error) throw error;

        toast({
          title: "Boutique mise à jour",
          description: "Votre boutique a été mise à jour avec succès",
        });
      } else {
        // Create new store
        const { error } = await supabase
          .from('stores')
          .insert({
            user_id: user.id,
            name,
            slug,
            description: description || null,
            default_currency: defaultCurrency,
          });

        if (error) throw error;

        toast({
          title: "Boutique créée",
          description: "Votre boutique a été créée avec succès",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Modifier la boutique" : "Créer votre boutique"}
        </CardTitle>
        <CardDescription>
          {initialData 
            ? "Mettez à jour les informations de votre boutique" 
            : "Configurez votre boutique en ligne"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la boutique *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ma Boutique Pro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Nom d'URL (slug) *
              {isCheckingSlug && (
                <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />
              )}
              {!isCheckingSlug && slugAvailable === true && (
                <Check className="inline-block ml-2 h-4 w-4 text-accent" />
              )}
              {!isCheckingSlug && slugAvailable === false && (
                <X className="inline-block ml-2 h-4 w-4 text-destructive" />
              )}
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="ma-boutique-pro"
              required
            />
            {slug && (
              <p className="text-sm text-muted-foreground">
                Votre boutique sera accessible à : 
                <span className="font-mono ml-1">https://{slug}.lovableproject.com</span>
              </p>
            )}
            {slugAvailable === false && (
              <p className="text-sm text-destructive">
                Ce nom de boutique est déjà pris. Veuillez en choisir un autre.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre boutique..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Devise par défaut</Label>
            <CurrencySelect
              value={defaultCurrency}
              onValueChange={setDefaultCurrency}
            />
            <p className="text-sm text-muted-foreground">
              Cette devise sera utilisée par défaut pour vos nouveaux produits
            </p>
          </div>

          <Button
            type="submit" 
            className="w-full"
            disabled={isSubmitting || slugAvailable === false}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {initialData ? "Mise à jour..." : "Création..."}
              </>
            ) : (
              initialData ? "Mettre à jour" : "Créer ma boutique"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default StoreForm;
