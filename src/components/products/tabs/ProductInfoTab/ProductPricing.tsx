import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CURRENCIES, getCurrencySymbol } from "@/lib/currencies";
import { useProductPricing } from "@/hooks/useProductPricing";
import {
  DollarSign,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

/**
 * Configuration pour l'affichage de l'historique
 */
const PRICE_HISTORY_DISPLAY_COUNT = 3;
const MAX_DISCOUNT_PERCENT = 95;

/**
 * Interface pour les données de tarification du produit
 */
interface ProductPricingData {
  price: number;
  promotional_price: number | null;
  cost_price?: number | null;
  currency: string;
  slug?: string;
}

/**
 * Props pour le composant ProductPricing
 */
interface ProductPricingProps {
  /** Données du formulaire */
  formData: ProductPricingData;
  /** Fonction pour mettre à jour les données */
  updateFormData: (field: string, value: any) => void;
  /** Erreurs de validation */
  validationErrors?: Record<string, string>;
  /** Devise de la boutique (pour comparaison) */
  storeCurrency?: string;
}

/**
 * Composant de gestion de la tarification des produits
 * 
 * Gère :
 * - Prix principal et devise
 * - Coût d'achat
 * - Prix promotionnel
 * - Calcul automatique de réduction (%)
 * - Calcul de marge brute
 * - Historique des prix avec persistance
 * 
 * @example
 * ```tsx
 * <ProductPricing
 *   formData={formData}
 *   updateFormData={updateFormData}
 *   validationErrors={validationErrors}
 *   storeCurrency="XOF"
 * />
 * ```
 */
export const ProductPricing = ({
  formData,
  updateFormData,
  validationErrors = {},
  storeCurrency,
}: ProductPricingProps) => {
  // Utiliser le hook custom pour la logique métier
  const {
    priceHistory,
    getDiscountPercentage,
    setDiscountFromPercent,
    addPriceToHistory,
    calculateMargin,
    calculateSavings,
  } = useProductPricing(formData, updateFormData);

  return (
    <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <DollarSign className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">
                Prix et tarification
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configurez le prix et le modèle de tarification de votre produit
              </CardDescription>
            </div>
          </div>
          {getDiscountPercentage() > 0 && (
            <Badge variant="destructive" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              -{getDiscountPercentage()}% de réduction
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Prix principal et devise */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Prix principal */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white flex items-center gap-2">
              Prix <span className="text-red-400">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Prix de vente principal du produit</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="relative">
              <Input
                id="product-price"
                type="number"
                value={formData.price || ""}
                onChange={(e) => {
                  const price = parseFloat(e.target.value) || 0;
                  updateFormData("price", price);
                  addPriceToHistory(price, formData.promotional_price || undefined);
                }}
                placeholder="0"
                min="0"
                step="0.01"
                aria-label="Prix du produit"
                aria-required="true"
                aria-invalid={!!validationErrors.price}
                aria-describedby={validationErrors.price ? "price-error" : undefined}
                className={cn(
                  "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px] pr-20",
                  validationErrors.price && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {getCurrencySymbol(formData.currency)}
              </div>
            </div>
            {validationErrors.price && (
              <div id="price-error" className="flex items-center gap-2 text-red-400 text-sm" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {validationErrors.price}
              </div>
            )}
          </div>

          {/* Devise */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white flex items-center gap-2">
              Devise <span className="text-red-400">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Devise de vente du produit</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select
              value={formData.currency || "XOF"}
              onValueChange={(value) => updateFormData("currency", value)}
            >
              <SelectTrigger
                id="product-currency"
                aria-label="Devise du produit"
                aria-required="true"
                className="bg-gray-700/50 border-gray-600 text-white focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px]"
              >
                <SelectValue placeholder="Sélectionnez une devise" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {CURRENCIES.map((currency) => (
                  <SelectItem
                    key={currency.code}
                    value={currency.code}
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <span>{currency.flag}</span>
                      <span>{currency.name}</span>
                      <span className="text-gray-400">({currency.symbol})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Coût d'achat */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white flex items-center gap-2">
              Coût d'achat (optionnel)
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Utilisé pour estimer la marge brute</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={formData.cost_price || ""}
                onChange={(e) =>
                  updateFormData("cost_price", e.target.value ? parseFloat(e.target.value) : null)
                }
                placeholder="0"
                min="0"
                step="0.01"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px] pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                {getCurrencySymbol(formData.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Prix promotionnel */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-white flex items-center gap-2">
            Prix promotionnel
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Prix réduit pour les promotions et offres spéciales</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="relative">
            <Input
              type="number"
              value={formData.promotional_price || ""}
              onChange={(e) => {
                const promotionalPrice = e.target.value ? parseFloat(e.target.value) : null;
                updateFormData("promotional_price", promotionalPrice);
                if (promotionalPrice) {
                  addPriceToHistory(formData.price, promotionalPrice);
                }
              }}
              placeholder="0"
              min="0"
              step="0.01"
              className={cn(
                "bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 min-h-[44px] pr-20",
                validationErrors.promotional_price && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              {getCurrencySymbol(formData.currency)}
            </div>
          </div>

          {/* Lien pourcentage <-> prix promo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Label className="text-xs text-gray-400">Ou définir une remise (%)</Label>
            <div className="relative w-full sm:w-28">
              <Input
                type="number"
                value={getDiscountPercentage() || ""}
                onChange={(e) => setDiscountFromPercent(parseFloat(e.target.value), MAX_DISCOUNT_PERCENT)}
                placeholder="0"
                min="0"
                max={MAX_DISCOUNT_PERCENT}
                step="1"
                className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/20 pr-8"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
            </div>
          </div>

          {/* Affichage de la réduction */}
          {getDiscountPercentage() > 0 && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">
                Réduction de {getDiscountPercentage()}% - Économie de{" "}
                {calculateSavings().toLocaleString()} {getCurrencySymbol(formData.currency)}
              </span>
            </div>
          )}

          {/* Affichage de la marge */}
          {formData.price && (formData.cost_price || formData.cost_price === 0) && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-blue-300">
                Marge estimée: {calculateMargin().marginValue.toLocaleString()}{" "}
                {getCurrencySymbol(formData.currency)}
                {formData.cost_price ? ` (${calculateMargin().marginPercent}%)` : ""}
              </span>
            </div>
          )}

          {validationErrors.promotional_price && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              {validationErrors.promotional_price}
            </div>
          )}
        </div>

        {/* Historique des prix */}
        {priceHistory.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Historique des prix</Label>
            <div className="space-y-2">
              {priceHistory.slice(0, PRICE_HISTORY_DISPLAY_COUNT).map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-700/30 rounded border border-gray-600"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {format(new Date(entry.date), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">
                      {entry.price.toLocaleString()} {getCurrencySymbol(formData.currency)}
                    </span>
                    {entry.promotional_price && (
                      <span className="text-sm text-green-400">
                        → {entry.promotional_price.toLocaleString()}{" "}
                        {getCurrencySymbol(formData.currency)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

