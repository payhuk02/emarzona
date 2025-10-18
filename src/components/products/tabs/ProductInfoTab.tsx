import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencySelect } from "@/components/ui/currency-select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/store-utils";

interface ProductInfoTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  storeId: string;
  storeSlug: string;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
}

export const ProductInfoTab = ({ formData, updateFormData, storeSlug, checkSlugAvailability }: ProductInfoTabProps) => {
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  useEffect(() => {
    const checkSlug = async () => {
      if (formData.slug) {
        setCheckingSlug(true);
        const available = await checkSlugAvailability(formData.slug);
        setSlugAvailable(available);
        setCheckingSlug(false);
      }
    };
    const timeout = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeout);
  }, [formData.slug]);

  const productUrl = `${window.location.origin}/${storeSlug}/${formData.slug}`;

  return (
    <div className="space-y-6">
      {/* Champs obligatoires */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nom du produit *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateFormData("name", e.target.value)}
            placeholder="Ex: Guide complet Facebook Ads 2025"
          />
        </div>

        <div>
          <Label htmlFor="slug">URL du produit *</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateFormData("slug", generateSlug(e.target.value))}
                placeholder="guide-facebook-ads-2025"
              />
              {checkingSlug ? (
                <div className="flex items-center text-muted-foreground">
                  <span className="text-sm">Vérification...</span>
                </div>
              ) : slugAvailable === true ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : slugAvailable === false ? (
                <div className="flex items-center text-destructive">
                  <XCircle className="h-5 w-5" />
                </div>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground break-all">{productUrl}</p>
          </div>
        </div>

        <div>
          <Label htmlFor="category">Catégorie *</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => updateFormData("category", e.target.value)}
            placeholder="Ex: Technologie, Marketing, Formation..."
          />
        </div>

        <div>
          <Label htmlFor="pricing_model">Modèle de tarification *</Label>
          <Select value={formData.pricing_model} onValueChange={(value) => updateFormData("pricing_model", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">Paiement unique</SelectItem>
              <SelectItem value="subscription">Abonnement</SelectItem>
              <SelectItem value="pay-what-you-want">Prix libre</SelectItem>
              <SelectItem value="free">Gratuit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Prix *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="currency">Devise *</Label>
            <CurrencySelect
              value={formData.currency}
              onValueChange={(value) => updateFormData("currency", value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="promotional_price">Prix promotionnel</Label>
          <Input
            id="promotional_price"
            type="number"
            value={formData.promotional_price || ""}
            onChange={(e) => updateFormData("promotional_price", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="0"
          />
        </div>
      </div>

      <Separator />

      {/* Options avancées */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Options avancées</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Réduction automatique</Label>
            <p className="text-sm text-muted-foreground">Offres automatiques aux clients lors du 3ème rappel d'abandon</p>
          </div>
          <Switch
            checked={formData.automatic_discount_enabled}
            onCheckedChange={(checked) => updateFormData("automatic_discount_enabled", checked)}
          />
        </div>

        {formData.automatic_discount_enabled && (
          <div>
            <Label htmlFor="discount_trigger">Déclencheur de réduction</Label>
            <Input
              id="discount_trigger"
              value={formData.discount_trigger}
              onChange={(e) => updateFormData("discount_trigger", e.target.value)}
              placeholder="Ex: 3ème rappel d'abandon"
            />
          </div>
        )}

        <div>
          <Label>Période de validité du prix de vente</Label>
          <p className="text-sm text-muted-foreground mb-2">Créez l'urgence avec des offres limitées dans le temps</p>
          <div className="grid grid-cols-2 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.sale_start_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sale_start_date ? format(new Date(formData.sale_start_date), "PPP") : "Date de début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.sale_start_date ? new Date(formData.sale_start_date) : undefined}
                  onSelect={(date) => updateFormData("sale_start_date", date?.toISOString())}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.sale_end_date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sale_end_date ? format(new Date(formData.sale_end_date), "PPP") : "Date de fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.sale_end_date ? new Date(formData.sale_end_date) : undefined}
                  onSelect={(date) => updateFormData("sale_end_date", date?.toISOString())}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <Label htmlFor="post_purchase_guide_url">Guide après-achat</Label>
          <p className="text-sm text-muted-foreground mb-2">Guidez vos nouveaux clients pour maximiser leur satisfaction</p>
          <Input
            id="post_purchase_guide_url"
            value={formData.post_purchase_guide_url}
            onChange={(e) => updateFormData("post_purchase_guide_url", e.target.value)}
            placeholder="URL du guide"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Protégez vos fichiers avec un mot de passe</Label>
            <p className="text-sm text-muted-foreground">Sécurisez votre contenu premium avec protection par mot de passe</p>
          </div>
          <Switch
            checked={formData.password_protected}
            onCheckedChange={(checked) => updateFormData("password_protected", checked)}
          />
        </div>

        {formData.password_protected && (
          <div>
            <Label htmlFor="product_password">Mot de passe</Label>
            <Input
              id="product_password"
              type="password"
              value={formData.product_password}
              onChange={(e) => updateFormData("product_password", e.target.value)}
              placeholder="Entrez le mot de passe"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Ajoutez des filigranes à vos fichiers</Label>
            <p className="text-sm text-muted-foreground">Protection automatique contre le partage non autorisé</p>
          </div>
          <Switch
            checked={formData.watermark_enabled}
            onCheckedChange={(checked) => updateFormData("watermark_enabled", checked)}
          />
        </div>

        <div>
          <Label htmlFor="purchase_limit">Définir une limite d'achat</Label>
          <p className="text-sm text-muted-foreground mb-2">Créez la rareté en limitant le nombre de ventes</p>
          <Input
            id="purchase_limit"
            type="number"
            value={formData.purchase_limit || ""}
            onChange={(e) => updateFormData("purchase_limit", e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Nombre maximum de ventes"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Masquer sur la boutique</Label>
            <p className="text-sm text-muted-foreground">Gardez ce produit privé : uniquement accessible avec un lien direct</p>
          </div>
          <Switch
            checked={formData.hide_from_store}
            onCheckedChange={(checked) => updateFormData("hide_from_store", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Masquer le nombre d'achats</Label>
            <p className="text-sm text-muted-foreground">Gardez vos statistiques de vente confidentielles</p>
          </div>
          <Switch
            checked={formData.hide_purchase_count}
            onCheckedChange={(checked) => updateFormData("hide_purchase_count", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Collecter les adresses de livraison</Label>
            <p className="text-sm text-muted-foreground">Récupérez les adresses clients pour vos produits physiques</p>
          </div>
          <Switch
            checked={formData.collect_shipping_address}
            onCheckedChange={(checked) => updateFormData("collect_shipping_address", checked)}
          />
        </div>
      </div>
    </div>
  );
};
