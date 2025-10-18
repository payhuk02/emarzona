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
import { CalendarIcon, CheckCircle2, XCircle, Package, Smartphone, Wrench, Info, Zap, Shield, Clock, Users, Target, Globe, Eye, ShoppingCart, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/store-utils";

interface ProductInfoTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
  storeId: string;
  storeSlug: string;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
  validationErrors?: Record<string, string>;
}

// Constantes pour les choix dynamiques
const PRODUCT_TYPES = [
  { value: "digital", label: "Produit Digital", icon: Smartphone, description: "Ebooks, formations, logiciels, templates, fichiers téléchargeables" },
  { value: "physical", label: "Produit Physique", icon: Package, description: "Vêtements, accessoires, objets artisanaux, produits manufacturés" },
  { value: "service", label: "Service", icon: Wrench, description: "Consultations, coaching, design, développement, maintenance" },
];

const DIGITAL_CATEGORIES = [
  "Formation", "Ebook", "Template", "Logiciel", "Cours en ligne", 
  "Guide", "Checklist", "Fichier audio", "Vidéo", "Application mobile"
];

const PHYSICAL_CATEGORIES = [
  "Vêtements", "Accessoires", "Artisanat", "Électronique", "Maison & Jardin",
  "Sport", "Beauté", "Livres", "Jouets", "Alimentation"
];

const SERVICE_CATEGORIES = [
  "Consultation", "Coaching", "Design", "Développement", "Marketing",
  "Rédaction", "Traduction", "Maintenance", "Formation", "Conseil"
];

const PRICING_MODELS = [
  { value: "one-time", label: "Paiement unique", description: "Les clients paient une seule fois" },
  { value: "subscription", label: "Abonnement", description: "Paiement récurrent mensuel/annuel" },
  { value: "pay-what-you-want", label: "Prix libre", description: "Le client choisit le montant" },
  { value: "free", label: "Gratuit", description: "Produit gratuit" },
];

const ACCESS_CONTROLS = [
  { value: "public", label: "Public", description: "Tout le monde peut voir et acheter" },
  { value: "logged_in", label: "Utilisateurs connectés", description: "Seuls les utilisateurs connectés" },
  { value: "purchasers", label: "Acheteurs uniquement", description: "Seuls les acheteurs précédents" },
];

export const ProductInfoTab = ({ formData, updateFormData, storeSlug, checkSlugAvailability, validationErrors = {} }: ProductInfoTabProps) => {
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

  // Obtenir les catégories selon le type de produit
  const getCategories = () => {
    switch (formData.product_type) {
      case "digital": return DIGITAL_CATEGORIES;
      case "physical": return PHYSICAL_CATEGORIES;
      case "service": return SERVICE_CATEGORIES;
      default: return [];
    }
  };

  return (
    <div className="theme-space-y-6">
      {/* Sélecteur de type de produit */}
      <div className="theme-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-5 w-5 text-blue-400" />
          <h3 className="theme-section-title">Type de produit</h3>
        </div>
        <p className="theme-section-description">
          Choisissez le type de produit que vous souhaitez vendre
        </p>
        
        <div className="theme-grid theme-grid-cols-3">
          {PRODUCT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.value}
                className={cn(
                  "p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md",
                  formData.product_type === type.value 
                    ? "border-blue-400 bg-blue-400/10" 
                    : "border-gray-600 hover:border-blue-400"
                )}
                onClick={() => updateFormData("product_type", type.value)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-6 w-6 text-blue-400" />
                  <h3 className="font-semibold text-white">{type.label}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">
                  {type.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {type.value === "digital" && (
                    <>
                      <span className="theme-badge">Téléchargement instantané</span>
                      <span className="theme-badge">Pas de stock</span>
                      <span className="theme-badge">Livraison automatique</span>
                    </>
                  )}
                  {type.value === "physical" && (
                    <>
                      <span className="theme-badge">Livraison requise</span>
                      <span className="theme-badge">Gestion stock</span>
                      <span className="theme-badge">Adresse client</span>
                    </>
                  )}
                  {type.value === "service" && (
                    <>
                      <span className="theme-badge">Rendez-vous</span>
                      <span className="theme-badge">Prestation</span>
                      <span className="theme-badge">Sur mesure</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {validationErrors.product_type && (
          <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {validationErrors.product_type}
          </p>
        )}
      </div>

      {/* Informations de base */}
      <div className="theme-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-gray-400" />
          <h3 className="theme-section-title">Informations de base</h3>
        </div>
        <p className="theme-section-description">
          Renseignez les informations essentielles de votre produit
        </p>
        
        <div className="theme-space-y-4">
          <div>
            <label className="theme-label">Nom du produit *</label>
            <Input
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
              placeholder="Ex: Guide complet Facebook Ads 2025"
              className={cn("theme-input", validationErrors.name && "border-red-500")}
            />
            {validationErrors.name && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {validationErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="theme-label">URL du produit *</label>
            <div className="theme-space-y-2">
              <div className="flex gap-2">
                <Input
                  value={formData.slug}
                  onChange={(e) => updateFormData("slug", generateSlug(e.target.value))}
                  placeholder="guide-facebook-ads-2025"
                  className={cn("theme-input flex-1", validationErrors.slug && "border-red-500")}
                />
                {checkingSlug ? (
                  <div className="flex items-center text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  </div>
                ) : slugAvailable === true ? (
                  <div className="flex items-center text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : slugAvailable === false ? (
                  <div className="flex items-center text-red-400">
                    <XCircle className="h-5 w-5" />
                  </div>
                ) : null}
              </div>
              <p className="text-sm text-gray-400 break-all">
                URL complète : <span className="font-mono bg-gray-700 px-2 py-1 rounded text-xs">{productUrl}</span>
              </p>
              {validationErrors.slug && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.slug}
                </p>
              )}
            </div>
          </div>

          <div className="theme-grid theme-grid-cols-2">
            <div>
              <label className="theme-label">Catégorie *</label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => updateFormData("category", value)}
              >
                <SelectTrigger className={cn("theme-input", validationErrors.category && "border-red-500")}>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {getCategories().map((category) => (
                    <SelectItem key={category} value={category} className="text-white hover:bg-gray-700">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.category && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.category}
                </p>
              )}
            </div>
            <div>
              <label className="theme-label">Modèle de tarification *</label>
              <Select 
                value={formData.pricing_model} 
                onValueChange={(value) => updateFormData("pricing_model", value)}
              >
                <SelectTrigger className={cn("theme-input", validationErrors.pricing_model && "border-red-500")}>
                  <SelectValue placeholder="Sélectionnez un modèle" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {PRICING_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="text-white hover:bg-gray-700">
                      <div>
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-gray-400">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.pricing_model && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.pricing_model}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prix et tarification */}
      <div className="theme-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-gray-400" />
          <h3 className="theme-section-title">Prix et tarification</h3>
        </div>
        <p className="theme-section-description">
          Configurez le prix et le modèle de tarification de votre produit
        </p>
        
        <div className="theme-space-y-4">
          <div className="theme-grid theme-grid-cols-2">
            <div>
              <label className="theme-label">Prix *</label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
                placeholder="0"
                className={cn("theme-input", validationErrors.price && "border-red-500")}
              />
              {validationErrors.price && (
                <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.price}
                </p>
              )}
            </div>
            <div>
              <label className="theme-label">Devise *</label>
              <CurrencySelect
                value={formData.currency}
                onValueChange={(value) => updateFormData("currency", value)}
                className="theme-input"
              />
            </div>
          </div>

          <div>
            <label className="theme-label">Prix promotionnel</label>
            <Input
              type="number"
              value={formData.promotional_price || ""}
              onChange={(e) => updateFormData("promotional_price", e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0"
              className={cn("theme-input", validationErrors.promotional_price && "border-red-500")}
            />
            {validationErrors.promotional_price && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {validationErrors.promotional_price}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Visibilité et accès */}
      <div className="theme-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-5 w-5 text-gray-400" />
          <h3 className="theme-section-title">Visibilité et accès</h3>
        </div>
        <p className="theme-section-description">
          Contrôlez qui peut voir et acheter votre produit
        </p>
        
        <div className="theme-space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="theme-label">Produit actif</label>
              <p className="theme-label-description">Rendre le produit visible et achetable</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => updateFormData("is_active", checked)}
              className="theme-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="theme-label">Mettre en avant</label>
              <p className="theme-label-description">Afficher ce produit sur la page d'accueil</p>
            </div>
            <Switch
              checked={formData.is_featured}
              onCheckedChange={(checked) => updateFormData("is_featured", checked)}
              className="theme-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="theme-label">Masquer de la boutique</label>
              <p className="theme-label-description">Le produit ne sera pas listé publiquement</p>
            </div>
            <Switch
              checked={formData.hide_from_store}
              onCheckedChange={(checked) => updateFormData("hide_from_store", checked)}
              className="theme-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="theme-label">Protéger par mot de passe</label>
              <p className="theme-label-description">Un mot de passe sera requis pour accéder au produit</p>
            </div>
            <Switch
              checked={formData.password_protected}
              onCheckedChange={(checked) => updateFormData("password_protected", checked)}
              className="theme-switch"
            />
          </div>
          
          {formData.password_protected && (
            <div>
              <label className="theme-label">Mot de passe du produit</label>
              <Input
                type="password"
                value={formData.product_password}
                onChange={(e) => updateFormData("product_password", e.target.value)}
                placeholder="Mot de passe sécurisé"
                className="theme-input"
              />
            </div>
          )}

          <div>
            <label className="theme-label">Contrôle d'accès</label>
            <Select 
              value={formData.access_control} 
              onValueChange={(value) => updateFormData("access_control", value)}
            >
              <SelectTrigger className="theme-input">
                <SelectValue placeholder="Sélectionner le contrôle d'accès" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {ACCESS_CONTROLS.map((control) => (
                  <SelectItem key={control.value} value={control.value} className="text-white hover:bg-gray-700">
                    <div>
                      <div className="font-medium">{control.label}</div>
                      <div className="text-xs text-gray-400">{control.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Options d'achat */}
      <div className="theme-section-card">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingCart className="h-5 w-5 text-gray-400" />
          <h3 className="theme-section-title">Options d'achat</h3>
        </div>
        <p className="theme-section-description">
          Configurez les règles d'achat pour ce produit
        </p>
        
        <div className="theme-space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="theme-label">Limite d'achat par client</label>
              <p className="theme-label-description">Nombre maximum d'achats par client</p>
            </div>
            <Input
              type="number"
              value={formData.purchase_limit || ""}
              onChange={(e) => updateFormData("purchase_limit", parseInt(e.target.value) || null)}
              placeholder="0 = illimité"
              className="theme-input w-24"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="theme-label">Masquer le nombre d'achats</label>
              <p className="theme-label-description">Ne pas afficher le nombre d'achats</p>
            </div>
            <Switch
              checked={formData.hide_purchase_count}
              onCheckedChange={(checked) => updateFormData("hide_purchase_count", checked)}
              className="theme-switch"
            />
          </div>
        </div>
      </div>

      {/* Dates de vente */}
      <div className="theme-section-card">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <h3 className="theme-section-title">Dates de vente</h3>
        </div>
        <p className="theme-section-description">
          Définissez des périodes spécifiques pour la vente
        </p>
        
        <div className="theme-grid theme-grid-cols-2">
          <div>
            <label className="theme-label">Date de début de vente</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal theme-input",
                    !formData.sale_start_date && "text-gray-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sale_start_date ? format(new Date(formData.sale_start_date), "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                <Calendar
                  mode="single"
                  selected={formData.sale_start_date ? new Date(formData.sale_start_date) : undefined}
                  onSelect={(date) => updateFormData("sale_start_date", date?.toISOString() || null)}
                  initialFocus
                  className="bg-gray-800 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="theme-label">Date de fin de vente</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal theme-input",
                    !formData.sale_end_date && "text-gray-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sale_end_date ? format(new Date(formData.sale_end_date), "PPP") : <span>Sélectionner une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600">
                <Calendar
                  mode="single"
                  selected={formData.sale_end_date ? new Date(formData.sale_end_date) : undefined}
                  onSelect={(date) => updateFormData("sale_end_date", date?.toISOString() || null)}
                  initialFocus
                  className="bg-gray-800 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Métadonnées techniques */}
      <div className="theme-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-gray-400" />
          <h3 className="theme-section-title">Métadonnées techniques</h3>
        </div>
        <p className="theme-section-description">
          Informations système sur le produit
        </p>
        
        <div className="theme-grid theme-grid-cols-2">
          <div>
            <label className="theme-label">Créé le</label>
            <Input 
              value={formData.created_at ? format(new Date(formData.created_at), "PPP p") : "N/A"} 
              readOnly 
              className="theme-input bg-gray-700" 
            />
          </div>
          <div>
            <label className="theme-label">Dernière mise à jour</label>
            <Input 
              value={formData.updated_at ? format(new Date(formData.updated_at), "PPP p") : "N/A"} 
              readOnly 
              className="theme-input bg-gray-700" 
            />
          </div>
          <div>
            <label className="theme-label">Version</label>
            <Input 
              value={formData.version || "1.0.0"} 
              readOnly 
              className="theme-input bg-gray-700" 
            />
          </div>
          <div>
            <label className="theme-label">Statut</label>
            <Input 
              value={formData.status || "Brouillon"} 
              readOnly 
              className="theme-input bg-gray-700" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};