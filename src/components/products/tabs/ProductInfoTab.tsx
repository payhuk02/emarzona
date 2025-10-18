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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, CheckCircle2, XCircle, Package, Smartphone, Wrench, Info, Zap, Shield, Clock, Users, Target, Globe, Eye, ShoppingCart } from "lucide-react";
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
    <div className="saas-space-y-6">
      {/* Sélecteur de type de produit */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="saas-section-title">Type de produit</h3>
        </div>
        <p className="saas-section-description">
          Choisissez le type de produit que vous souhaitez vendre
        </p>
        
        <div className="saas-grid saas-grid-cols-3">
          <div
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
              formData.product_type === "digital" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-blue-300"
            )}
            onClick={() => updateFormData("product_type", "digital")}
          >
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold saas-text-primary">Produit Digital</h3>
            </div>
            <p className="saas-label-description mb-3">
              Ebooks, formations, logiciels, templates, fichiers téléchargeables
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="saas-badge">Téléchargement instantané</span>
              <span className="saas-badge">Pas de stock</span>
              <span className="saas-badge">Livraison automatique</span>
            </div>
          </div>

          <div
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
              formData.product_type === "physical" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-blue-300"
            )}
            onClick={() => updateFormData("product_type", "physical")}
          >
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold saas-text-primary">Produit Physique</h3>
            </div>
            <p className="saas-label-description mb-3">
              Vêtements, accessoires, objets artisanaux, produits manufacturés
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="saas-badge">Livraison requise</span>
              <span className="saas-badge">Gestion stock</span>
              <span className="saas-badge">Adresse client</span>
            </div>
          </div>

          <div
            className={cn(
              "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
              formData.product_type === "service" 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-200 hover:border-blue-300"
            )}
            onClick={() => updateFormData("product_type", "service")}
          >
            <div className="flex items-center gap-3 mb-2">
              <Wrench className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold saas-text-primary">Service</h3>
            </div>
            <p className="saas-label-description mb-3">
              Consultations, coaching, design, développement, maintenance
            </p>
            <div className="flex flex-wrap gap-1">
              <span className="saas-badge">Rendez-vous</span>
              <span className="saas-badge">Prestation</span>
              <span className="saas-badge">Sur mesure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations de base */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Informations de base</h3>
        </div>
        <p className="saas-section-description">
          Renseignez les informations essentielles de votre produit
        </p>
        
        <div className="saas-space-y-4">
          <div>
            <label className="saas-label">Nom du produit *</label>
            <Input
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="Ex: Guide complet Facebook Ads 2025"
              className="saas-input"
            />
          </div>

          <div>
            <label className="saas-label">URL du produit *</label>
            <div className="saas-space-y-2">
              <div className="flex gap-2">
                <Input
                  value={formData.slug}
                  onChange={(e) => updateFormData("slug", generateSlug(e.target.value))}
                  placeholder="guide-facebook-ads-2025"
                  className="saas-input flex-1"
                />
                {checkingSlug ? (
                  <div className="flex items-center text-gray-500">
                    <span className="text-sm">Vérification...</span>
                  </div>
                ) : slugAvailable === true ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : slugAvailable === false ? (
                  <div className="flex items-center text-red-600">
                    <XCircle className="h-5 w-5" />
                  </div>
                ) : null}
              </div>
              <p className="text-sm saas-text-secondary break-all">{productUrl}</p>
            </div>
          </div>

          <div className="saas-grid saas-grid-cols-2">
            <div>
              <label className="saas-label">Catégorie *</label>
              <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
                <SelectTrigger className="saas-input">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {formData.product_type === "digital" && (
                    <>
                      <SelectItem value="Formation">Formation</SelectItem>
                      <SelectItem value="Ebook">Ebook</SelectItem>
                      <SelectItem value="Template">Template</SelectItem>
                      <SelectItem value="Logiciel">Logiciel</SelectItem>
                      <SelectItem value="Cours en ligne">Cours en ligne</SelectItem>
                      <SelectItem value="Guide">Guide</SelectItem>
                      <SelectItem value="Checklist">Checklist</SelectItem>
                      <SelectItem value="Fichier audio">Fichier audio</SelectItem>
                      <SelectItem value="Vidéo">Vidéo</SelectItem>
                    </>
                  )}
                  {formData.product_type === "physical" && (
                    <>
                      <SelectItem value="Vêtements">Vêtements</SelectItem>
                      <SelectItem value="Accessoires">Accessoires</SelectItem>
                      <SelectItem value="Artisanat">Artisanat</SelectItem>
                      <SelectItem value="Électronique">Électronique</SelectItem>
                      <SelectItem value="Maison & Jardin">Maison & Jardin</SelectItem>
                      <SelectItem value="Sport">Sport</SelectItem>
                      <SelectItem value="Beauté">Beauté</SelectItem>
                      <SelectItem value="Livres">Livres</SelectItem>
                      <SelectItem value="Jouets">Jouets</SelectItem>
                    </>
                  )}
                  {formData.product_type === "service" && (
                    <>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Coaching">Coaching</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Développement">Développement</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Rédaction">Rédaction</SelectItem>
                      <SelectItem value="Traduction">Traduction</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Formation">Formation</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="saas-label">Modèle de tarification *</label>
              <Select value={formData.pricing_model} onValueChange={(value) => updateFormData("pricing_model", value)}>
                <SelectTrigger className="saas-input">
                  <SelectValue placeholder="Sélectionnez un modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">Paiement unique</SelectItem>
                  <SelectItem value="subscription">Abonnement</SelectItem>
                  <SelectItem value="pay-what-you-want">Prix libre</SelectItem>
                  <SelectItem value="free">Gratuit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Prix et tarification */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Prix et tarification</h3>
        </div>
        <p className="saas-section-description">
          Configurez le prix et le modèle de tarification de votre produit
        </p>
        
        <div className="saas-space-y-4">
          <div className="saas-grid saas-grid-cols-2">
            <div>
              <label className="saas-label">Prix *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="saas-input"
              />
            </div>
            <div>
              <label className="saas-label">Devise *</label>
              <CurrencySelect
                value={formData.currency}
                onValueChange={(value) => updateFormData("currency", value)}
                className="saas-input"
              />
            </div>
          </div>

          <div>
            <label className="saas-label">Prix promotionnel</label>
            <Input
              type="number"
              value={formData.promotional_price || ""}
              onChange={(e) => updateFormData("promotional_price", e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0"
              className="saas-input"
            />
          </div>
        </div>
      </div>

      {/* Visibilité et accès */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Visibilité et accès</h3>
        </div>
        <p className="saas-section-description">
          Contrôlez qui peut voir et acheter votre produit
        </p>
        
        <div className="saas-space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Produit actif</label>
              <p className="saas-label-description">Rendre le produit visible et achetable</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => updateFormData("is_active", checked)}
              className="saas-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Mettre en avant</label>
              <p className="saas-label-description">Afficher ce produit sur la page d'accueil</p>
            </div>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(checked) => updateFormData("is_featured", checked)}
              className="saas-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Masquer de la boutique</label>
              <p className="saas-label-description">Le produit ne sera pas listé publiquement</p>
            </div>
            <Switch
              checked={formData.hide_from_store}
              onCheckedChange={(checked) => updateFormData("hide_from_store", checked)}
              className="saas-switch"
            />
          </div>
        </div>
      </div>

      {/* Options d'achat */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Options d'achat</h3>
        </div>
        <p className="saas-section-description">
          Configurez les règles d'achat pour ce produit
        </p>
        
        <div className="saas-space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Limite d'achat par client</label>
              <p className="saas-label-description">Nombre maximum d'achats par client</p>
            </div>
            <Input
              type="number"
              value={formData.purchase_limit || ""}
              onChange={(e) => updateFormData("purchase_limit", parseInt(e.target.value) || null)}
              placeholder="0 = illimité"
              className="saas-input w-24"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Masquer le nombre d'achats</label>
              <p className="saas-label-description">Ne pas afficher le nombre d'achats</p>
            </div>
            <Switch
              checked={formData.hide_purchase_count}
              onCheckedChange={(checked) => updateFormData("hide_purchase_count", checked)}
              className="saas-switch"
            />
          </div>
        </div>
      </div>

      {/* Dates de vente */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Dates de vente</h3>
        </div>
        <p className="saas-section-description">
          Définissez des périodes spécifiques pour la vente
        </p>
        
        <div className="saas-grid saas-grid-cols-2">
          <div>
            <label className="saas-label">Date de début de vente</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal saas-input",
                    !formData.sale_start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sale_start_date ? format(new Date(formData.sale_start_date), "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 saas-popover">
                <Calendar
                  mode="single"
                  selected={formData.sale_start_date ? new Date(formData.sale_start_date) : undefined}
                  onSelect={(date) => updateFormData("sale_start_date", date?.toISOString() || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="saas-label">Date de fin de vente</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal saas-input",
                    !formData.sale_end_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sale_end_date ? format(new Date(formData.sale_end_date), "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 saas-popover">
                <Calendar
                  mode="single"
                  selected={formData.sale_end_date ? new Date(formData.sale_end_date) : undefined}
                  onSelect={(date) => updateFormData("sale_end_date", date?.toISOString() || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Métadonnées techniques */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Métadonnées techniques</h3>
        </div>
        <p className="saas-section-description">
          Informations système sur le produit
        </p>
        
        <div className="saas-grid saas-grid-cols-2">
          <div>
            <label className="saas-label">Créé le</label>
            <Input 
              value={formData.created_at ? format(new Date(formData.created_at), "PPP p") : "N/A"} 
              readOnly 
              className="saas-input" 
            />
          </div>
          <div>
            <label className="saas-label">Dernière mise à jour</label>
            <Input 
              value={formData.updated_at ? format(new Date(formData.updated_at), "PPP p") : "N/A"} 
              readOnly 
              className="saas-input" 
            />
          </div>
          <div>
            <label className="saas-label">Version</label>
            <Input 
              value={formData.version || "1.0.0"} 
              readOnly 
              className="saas-input" 
            />
          </div>
          <div>
            <label className="saas-label">Statut</label>
            <Input 
              value={formData.status || "Brouillon"} 
              readOnly 
              className="saas-input" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};