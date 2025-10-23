import { useState, useCallback, useMemo } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCIES, getCurrencySymbol, type Currency } from "@/lib/currencies";
import { 
  CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Smartphone, 
  Wrench, 
  Info, 
  Zap, 
  Shield, 
  Clock, 
  Users, 
  Target, 
  Globe, 
  Eye, 
  ShoppingCart, 
  AlertCircle,
  DollarSign,
  Percent,
  TrendingUp,
  Lock,
  Unlock,
  Star,
  Heart,
  Download,
  Truck,
  Settings,
  HelpCircle,
  ExternalLink,
  Copy,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/store-utils";
import { useToast } from "@/hooks/use-toast";
import { useSlugAvailability } from "@/hooks/useSlugAvailability";
import { ProductTypeSelector } from "./ProductInfoTab/ProductTypeSelector";
import { ProductPricing } from "./ProductInfoTab/ProductPricing";

/**
 * Interface pour les données du formulaire de produit
 */
interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  product_type: 'digital' | 'physical' | 'service' | '';
  pricing_model: 'one-time' | 'subscription' | 'pay-what-you-want' | 'free' | '';
  price: number;
  promotional_price: number | null;
  currency: string;
  cost_price?: number | null;
  is_active?: boolean;
  is_featured?: boolean;
  hide_from_store?: boolean;
  password_protected?: boolean;
  product_password?: string;
  access_control?: 'public' | 'logged_in' | 'purchasers';
  purchase_limit?: number | null;
  hide_purchase_count?: boolean;
  sale_start_date?: string | null;
  sale_end_date?: string | null;
  created_at?: string;
  updated_at?: string;
  version?: string;
  status?: string;
  [key: string]: any; // Pour les champs additionnels
}

/**
 * Props pour le composant ProductInfoTab
 */
interface ProductInfoTabProps {
  formData: ProductFormData;
  updateFormData: (field: string, value: any) => void;
  storeId: string;
  storeSlug: string;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
  validationErrors?: Record<string, string>;
  storeCurrency?: string;
}

// Constantes pour les choix dynamiques
const DIGITAL_CATEGORIES = [
  { value: "formation", label: "Formation", icon: Users },
  { value: "ebook", label: "Ebook", icon: Package },
  { value: "template", label: "Template", icon: Settings },
  { value: "logiciel", label: "Logiciel", icon: Smartphone },
  { value: "cours", label: "Cours en ligne", icon: Users },
  { value: "guide", label: "Guide", icon: Info },
  { value: "checklist", label: "Checklist", icon: CheckCircle2 },
  { value: "audio", label: "Fichier audio", icon: Download },
  { value: "video", label: "Vidéo", icon: Package },
  { value: "app", label: "Application mobile", icon: Smartphone }
];

const PHYSICAL_CATEGORIES = [
  { value: "vetements", label: "Vêtements", icon: Package },
  { value: "accessoires", label: "Accessoires", icon: Package },
  { value: "artisanat", label: "Artisanat", icon: Package },
  { value: "electronique", label: "Électronique", icon: Smartphone },
  { value: "maison", label: "Maison & Jardin", icon: Package },
  { value: "sport", label: "Sport", icon: Package },
  { value: "beaute", label: "Beauté", icon: Package },
  { value: "livres", label: "Livres", icon: Package },
  { value: "jouets", label: "Jouets", icon: Package },
  { value: "alimentation", label: "Alimentation", icon: Package }
];

const SERVICE_CATEGORIES = [
  { value: "consultation", label: "Consultation", icon: Users },
  { value: "coaching", label: "Coaching", icon: Target },
  { value: "design", label: "Design", icon: Settings },
  { value: "developpement", label: "Développement", icon: Settings },
  { value: "marketing", label: "Marketing", icon: TrendingUp },
  { value: "redaction", label: "Rédaction", icon: Package },
  { value: "traduction", label: "Traduction", icon: Globe },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "formation", label: "Formation", icon: Users },
  { value: "conseil", label: "Conseil", icon: Info }
];

const PRICING_MODELS = [
  { 
    value: "one-time", 
    label: "Paiement unique", 
    description: "Les clients paient une seule fois",
    icon: DollarSign,
    popular: true
  },
  { 
    value: "subscription", 
    label: "Abonnement", 
    description: "Paiement récurrent mensuel/annuel",
    icon: RefreshCw,
    popular: false
  },
  { 
    value: "pay-what-you-want", 
    label: "Prix libre", 
    description: "Le client choisit le montant",
    icon: Percent,
    popular: false
  },
  { 
    value: "free", 
    label: "Gratuit", 
    description: "Produit gratuit",
    icon: Heart,
    popular: false
  },
];

const ACCESS_CONTROLS = [
  { 
    value: "public", 
    label: "Public", 
    description: "Tout le monde peut voir et acheter",
    icon: Globe,
    popular: true
  },
  { 
    value: "logged_in", 
    label: "Utilisateurs connectés", 
    description: "Seuls les utilisateurs connectés",
    icon: Users,
    popular: false
  },
  { 
    value: "purchasers", 
    label: "Acheteurs uniquement", 
    description: "Seuls les acheteurs précédents",
    icon: Lock,
    popular: false
  },
];

// CURRENCIES importé depuis @/lib/currencies pour éviter la duplication

export const ProductInfoTab = ({ formData, updateFormData, storeSlug, checkSlugAvailability, validationErrors = {}, storeCurrency }: ProductInfoTabProps) => {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [lastType, setLastType] = useState<string | null>(formData.product_type || null);
  const [showTypeChangeDialog, setShowTypeChangeDialog] = useState(false);
  const [pendingTypeChange, setPendingTypeChange] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Hook personnalisé pour la vérification de slug
  const { slugAvailable, checkingSlug } = useSlugAvailability(
    formData.slug,
    checkSlugAvailability
  );

  /**
   * Génère automatiquement le slug à partir du nom du produit
   * Le slug est auto-généré uniquement s'il n'a pas été modifié manuellement
   * @param name - Nouveau nom du produit
   */
  const handleNameChange = useCallback((name: string) => {
    updateFormData("name", name);
    if (!formData.slug || formData.slug === generateSlug(formData.name)) {
      updateFormData("slug", generateSlug(name));
    }
  }, [formData.name, formData.slug, updateFormData]);

  // URL du produit
  const productUrl = `${window.location.origin}/${storeSlug}/${formData.slug}`;
  
  // Copie de l'URL du produit
  const copyProductUrl = useCallback(() => {
    navigator.clipboard.writeText(productUrl);
    toast({
      title: "URL copiée",
      description: "L'URL du produit a été copiée dans le presse-papiers",
    });
  }, [productUrl, toast]);

  // Génération d'un nouveau slug
  const regenerateSlug = useCallback(() => {
    const newSlug = generateSlug(formData.name);
    updateFormData("slug", newSlug);
  }, [formData.name, updateFormData]);


  /**
   * Valide que la date de fin de vente est postérieure à la date de début
   * @returns true si les dates sont valides ou non définies, false sinon
   */
  const validateSaleDates = useCallback(() => {
    if (formData.sale_start_date && formData.sale_end_date) {
      const startDate = new Date(formData.sale_start_date);
      const endDate = new Date(formData.sale_end_date);
      return startDate < endDate;
    }
    return true;
  }, [formData.sale_start_date, formData.sale_end_date]);

  /**
   * Obtenir les catégories selon le type de produit
   * Mémorisé pour éviter les recalculs inutiles
   */
  const categories = useMemo(() => {
    switch (formData.product_type) {
      case "digital": return DIGITAL_CATEGORIES;
      case "physical": return PHYSICAL_CATEGORIES;
      case "service": return SERVICE_CATEGORIES;
      default: return [];
    }
  }, [formData.product_type]);

  /**
   * Retourne la couleur associée au type de produit
   * @param type - Type de produit (digital, physical, service)
   * @returns Couleur theme ('blue', 'green', 'purple') ou 'blue' par défaut
   */
  const getProductTypeColor = (type: string) => {
    const productType = PRODUCT_TYPES.find(t => t.value === type);
    return productType?.color || 'blue';
  };

  /**
   * Obtenir l'icône de la catégorie
   * @param categoryValue - Valeur de la catégorie
   * @returns Icône correspondante
   */
  const getCategoryIcon = useCallback((categoryValue: string) => {
    const category = categories.find(c => c.value === categoryValue);
    return category?.icon || Package;
  }, [categories]);

  /**
   * Gère la demande de changement de type de produit
   * Affiche un dialog de confirmation si un type existe déjà
   */
  const handleTypeChangeRequest = useCallback((newType: string) => {
    if (lastType && lastType !== newType) {
      setPendingTypeChange(newType);
      setShowTypeChangeDialog(true);
    } else {
      setLastType(newType);
      updateFormData("product_type", newType);
    }
  }, [lastType, updateFormData]);

  /**
   * Confirme le changement de type de produit
   */
  const confirmTypeChange = useCallback(() => {
    if (pendingTypeChange) {
      setLastType(pendingTypeChange);
      updateFormData("product_type", pendingTypeChange);
      setPendingTypeChange(null);
    }
    setShowTypeChangeDialog(false);
  }, [pendingTypeChange, updateFormData]);

  /**
   * Annule le changement de type de produit
   */
  const cancelTypeChange = useCallback(() => {
    setPendingTypeChange(null);
    setShowTypeChangeDialog(false);
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Sélecteur de type de produit */}
        <ProductTypeSelector
          selectedType={formData.product_type}
          onTypeChange={handleTypeChangeRequest}
          validationError={validationErrors.product_type}
        />

        {/* Informations de base */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Info className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Informations de base</CardTitle>
                  <CardDescription className="text-gray-400">
                    Renseignez les informations essentielles de votre produit
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {storeCurrency && formData.currency && storeCurrency !== formData.currency && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">
                  La devise du produit ({formData.currency}) diffère de celle de la boutique ({storeCurrency}). Vérifiez la cohérence des prix.
                </span>
              </div>
            )}
            {/* Nom du produit */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-white flex items-center gap-2">
                Nom du produit <span className="text-red-400">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Le nom apparaîtra dans votre boutique et sur les pages de produit</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="product-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Guide complet Facebook Ads 2025"
                aria-label="Nom du produit"
                aria-required="true"
                aria-invalid={!!validationErrors.name}
                aria-describedby={validationErrors.name ? "name-error" : undefined}
                className={cn(
                  "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]",
                  validationErrors.name && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                )}
              />
              {validationErrors.name && (
                <div id="name-error" className="flex items-center gap-2 text-red-400 text-sm" role="alert">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  {validationErrors.name}
                </div>
              )}
            </div>

            {/* URL du produit */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-white flex items-center gap-2">
                URL du produit <span className="text-red-400">*</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>L'URL sera générée automatiquement à partir du nom</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="product-slug"
                    value={formData.slug}
                    onChange={(e) => updateFormData("slug", generateSlug(e.target.value))}
                    placeholder="guide-facebook-ads-2025"
                    aria-label="URL du produit (slug)"
                    aria-required="true"
                    aria-invalid={!!validationErrors.slug}
                    aria-describedby={validationErrors.slug ? "slug-error" : "slug-status"}
                    className={cn(
                      "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 pr-10 min-h-[44px]",
                      validationErrors.slug && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingSlug ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                    ) : slugAvailable === true ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : slugAvailable === false ? (
                      <XCircle className="h-4 w-4 text-red-400" />
                    ) : null}
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={regenerateSlug}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Régénérer l'URL</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Indicateur lisible de disponibilité */}
              {slugAvailable !== null && (
                <div id="slug-status" className="flex items-center gap-2" role="status" aria-live="polite">
                  {slugAvailable ? (
                    <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" />
                      Disponible
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                      Déjà utilisé
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">URL complète :</span>
                <code className="text-xs bg-gray-800 px-2 py-1 rounded text-blue-300 font-mono flex-1 truncate">
                  {productUrl}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyProductUrl}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copier l'URL</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {validationErrors.slug && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.slug}
                </div>
              )}
            </div>

            {/* Catégorie et modèle de tarification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white flex items-center gap-2">
                  Catégorie <span className="text-red-400">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choisissez la catégorie qui correspond le mieux à votre produit</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => updateFormData("category", value)}
                >
                  <SelectTrigger 
                    id="product-category"
                    aria-label="Catégorie du produit"
                    aria-required="true"
                    aria-invalid={!!validationErrors.category}
                    className={cn(
                      "bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]",
                      validationErrors.category && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}>
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <SelectItem 
                          key={category.value} 
                          value={category.value} 
                          className="text-white hover:bg-gray-700 focus:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {validationErrors.category && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.category}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white flex items-center gap-2">
                  Modèle de tarification <span className="text-red-400">*</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Définissez comment vos clients paieront pour ce produit</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Select 
                  value={formData.pricing_model} 
                  onValueChange={(value) => updateFormData("pricing_model", value)}
                >
                  <SelectTrigger 
                    id="pricing-model"
                    aria-label="Modèle de tarification"
                    aria-required="true"
                    aria-invalid={!!validationErrors.pricing_model}
                    className={cn(
                      "bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]",
                      validationErrors.pricing_model && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}>
                    <SelectValue placeholder="Sélectionnez un modèle" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {PRICING_MODELS.map((model) => {
                      const Icon = model.icon;
                      return (
                        <SelectItem 
                          key={model.value} 
                          value={model.value} 
                          className="text-white hover:bg-gray-700 focus:bg-gray-700"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{model.label}</div>
                                <div className="text-xs text-gray-400">{model.description}</div>
                              </div>
                            </div>
                            {model.popular && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Populaire
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {validationErrors.pricing_model && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.pricing_model}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prix et tarification */}
        <ProductPricing
          formData={formData}
          updateFormData={updateFormData}
          validationErrors={validationErrors}
          storeCurrency={storeCurrency}
        />

        {/* Visibilité et accès */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Eye className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Visibilité et accès</CardTitle>
                  <CardDescription className="text-gray-400">
                    Contrôlez qui peut voir et acheter votre produit
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Options avancées
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Options de base */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-white">Produit actif</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Rendre le produit visible et achetable</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-gray-400">Rendre le produit visible et achetable</p>
                </div>
                <Switch
                  checked={formData.is_active || false}
                  onCheckedChange={(checked) => updateFormData("is_active", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-white">Mettre en avant</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Afficher ce produit sur la page d'accueil</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-gray-400">Afficher ce produit sur la page d'accueil</p>
                </div>
                <Switch
                  checked={formData.is_featured || false}
                  onCheckedChange={(checked) => updateFormData("is_featured", checked)}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-white">Masquer de la boutique</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Le produit ne sera pas listé publiquement</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-gray-400">Le produit ne sera pas listé publiquement</p>
                </div>
                <Switch
                  checked={formData.hide_from_store || false}
                  onCheckedChange={(checked) => updateFormData("hide_from_store", checked)}
                />
              </div>
            </div>

            {/* Options avancées */}
            {showAdvancedOptions && (
              <div className="space-y-4 pt-4 border-t border-gray-600">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-white">Protéger par mot de passe</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Un mot de passe sera requis pour accéder au produit</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-xs text-gray-400">Un mot de passe sera requis pour accéder au produit</p>
                  </div>
                  <Switch
                    checked={formData.password_protected || false}
                    onCheckedChange={(checked) => updateFormData("password_protected", checked)}
                  />
                </div>
                
                {formData.password_protected && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Mot de passe du produit</Label>
                    <Input
                      type="password"
                      value={formData.product_password || ""}
                      onChange={(e) => updateFormData("product_password", e.target.value)}
                      placeholder="Mot de passe sécurisé"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    Contrôle d'accès
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Définissez qui peut accéder à ce produit</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select 
                    value={formData.access_control || "public"} 
                    onValueChange={(value) => updateFormData("access_control", value)}
                  >
                    <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20">
                      <SelectValue placeholder="Sélectionner le contrôle d'accès" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {ACCESS_CONTROLS.map((control) => {
                        const Icon = control.icon;
                        return (
                          <SelectItem 
                            key={control.value} 
                            value={control.value} 
                            className="text-white hover:bg-gray-700 focus:bg-gray-700"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{control.label}</div>
                                  <div className="text-xs text-gray-400">{control.description}</div>
                                </div>
                              </div>
                              {control.popular && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Populaire
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options d'achat */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <ShoppingCart className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Options d'achat</CardTitle>
                <CardDescription className="text-gray-400">
                  Configurez les règles d'achat pour ce produit
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-white">Limite d'achat par client</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nombre maximum d'achats par client</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-gray-400">Nombre maximum d'achats par client</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={formData.purchase_limit || ""}
                  onChange={(e) => updateFormData("purchase_limit", parseInt(e.target.value) || null)}
                  placeholder="0 = illimité"
                  min="0"
                  className="w-24 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20"
                />
                <span className="text-xs text-gray-400">achats</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-white">Masquer le nombre d'achats</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ne pas afficher le nombre d'achats</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-xs text-gray-400">Ne pas afficher le nombre d'achats</p>
              </div>
              <Switch
                checked={formData.hide_purchase_count || false}
                onCheckedChange={(checked) => updateFormData("hide_purchase_count", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates de vente */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm overflow-visible">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Calendar className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Dates de vente</CardTitle>
                <CardDescription className="text-gray-400">
                  Définissez des périodes spécifiques pour la vente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white flex items-center gap-2">
                  Date de début de vente
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Date à partir de laquelle le produit sera en vente</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700",
                        !formData.sale_start_date && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.sale_start_date ? format(new Date(formData.sale_start_date), "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600 z-50" align="start" sideOffset={5}>
                    <Calendar
                      mode="single"
                      selected={formData.sale_start_date ? new Date(formData.sale_start_date) : undefined}
                      onSelect={(date) => updateFormData("sale_start_date", date?.toISOString() || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white flex items-center gap-2">
                  Date de fin de vente
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Date jusqu'à laquelle le produit sera en vente</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700",
                        !formData.sale_end_date && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.sale_end_date ? format(new Date(formData.sale_end_date), "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-600 z-50" align="start" sideOffset={5}>
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
            
            {/* Validation des dates */}
            {!validateSaleDates() && formData.sale_start_date && formData.sale_end_date && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">
                  La date de fin doit être postérieure à la date de début
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métadonnées techniques */}
        <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/20">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-white">Métadonnées techniques</CardTitle>
                <CardDescription className="text-gray-400">
                  Informations système sur le produit
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Créé le</Label>
                <Input 
                  value={formData.created_at ? format(new Date(formData.created_at), "PPP p", { locale: fr }) : "N/A"} 
                  readOnly 
                  className="bg-gray-700/50 border-gray-600 text-gray-300" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Dernière mise à jour</Label>
                <Input 
                  value={formData.updated_at ? format(new Date(formData.updated_at), "PPP p", { locale: fr }) : "N/A"} 
                  readOnly 
                  className="bg-gray-700/50 border-gray-600 text-gray-300" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Version</Label>
                <Input 
                  value={formData.version || "1.0.0"} 
                  readOnly 
                  className="bg-gray-700/50 border-gray-600 text-gray-300" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Statut</Label>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={formData.status === "published" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {formData.status || "Brouillon"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de confirmation de changement de type */}
        <AlertDialog open={showTypeChangeDialog} onOpenChange={setShowTypeChangeDialog}>
          <AlertDialogContent className="bg-gray-800 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Confirmer le changement de type</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Changer le type de produit peut réinitialiser certains champs incompatibles (comme la catégorie). 
                Êtes-vous sûr de vouloir continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={cancelTypeChange}
                className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmTypeChange}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};