import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Package, 
  Palette, 
  Ruler, 
  Settings,
  TrendingUp,
  Zap,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VariantCard, ProductVariant } from "./ProductVariantsTab/VariantCard";

/**
 * Interface stricte pour les données du formulaire produit
 */
interface ProductFormData {
  variants?: ProductVariant[];
  
  // Attributs visuels
  color_variants?: boolean;
  pattern_variants?: boolean;
  finish_variants?: boolean;
  
  // Attributs dimensionnels
  size_variants?: boolean;
  dimension_variants?: boolean;
  weight_variants?: boolean;
  
  // Gestion de stock
  centralized_stock?: boolean;
  low_stock_alerts?: boolean;
  preorder_allowed?: boolean;
  hide_when_out_of_stock?: boolean;
  
  // Règles de prix
  different_prices_per_variant?: boolean;
  price_surcharge?: boolean;
  quantity_discounts?: boolean;
}

interface ProductVariantsTabProps {
  formData: ProductFormData;
  updateFormData: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export const ProductVariantsTab = ({ formData, updateFormData }: ProductVariantsTabProps) => {
  const [variants, setVariants] = useState<ProductVariant[]>(formData.variants || []);
  const [editingVariant, setEditingVariant] = useState<number | null>(null);

  /**
   * Ajoute une nouvelle variante avec des valeurs par défaut
   */
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: "",
      sku: "",
      price: 0,
      stock: 0,
      attributes: {},
      image: "",
      is_active: true
    };
    
    const updatedVariants = [...variants, newVariant];
    setVariants(updatedVariants);
    updateFormData("variants", updatedVariants);
    setEditingVariant(updatedVariants.length - 1);
  };

  /**
   * Met à jour un champ d'une variante spécifique
   */
  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
    updateFormData("variants", updatedVariants);
  };

  /**
   * Supprime une variante
   */
  const removeVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    setVariants(updatedVariants);
    updateFormData("variants", updatedVariants);
    if (editingVariant === index) {
      setEditingVariant(null);
    }
  };

  /**
   * Active/désactive une variante
   */
  const toggleVariantActive = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants[index].is_active = !updatedVariants[index].is_active;
    setVariants(updatedVariants);
    updateFormData("variants", updatedVariants);
  };

  const activeVariantsCount = variants.filter(v => v.is_active).length;
  const outOfStockCount = variants.filter(v => v.stock <= 0).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-white">Gestion des variantes</CardTitle>
                <CardDescription className="text-gray-400">
                  Créez différentes versions de votre produit (couleurs, tailles, etc.)
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-400">
                  {variants.length} variante{variants.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {activeVariantsCount} active{activeVariantsCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration des variantes */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Variantes du produit</CardTitle>
              <CardDescription className="text-gray-400">
                {variants.length} variante{variants.length > 1 ? 's' : ''} configurée{variants.length > 1 ? 's' : ''}
                {outOfStockCount > 0 && (
                  <span className="text-red-400 ml-2">
                    • {outOfStockCount} en rupture
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              onClick={addVariant} 
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
              aria-label="Ajouter une nouvelle variante"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une variante
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Aucune variante configurée</p>
              <p className="text-sm mb-4">Créez des variantes pour proposer différentes options (tailles, couleurs, etc.)</p>
              <Button 
                onClick={addVariant}
                className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer la première variante
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  index={index}
                  isEditing={editingVariant === index}
                  onEdit={() => setEditingVariant(editingVariant === index ? null : index)}
                  onDelete={() => removeVariant(index)}
                  onToggleActive={() => toggleVariantActive(index)}
                  onUpdate={(field, value) => updateVariant(index, field, value)}
                  currencySymbol="FCFA"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-gray-700" />

      {/* Configuration des attributs */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Settings className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Configuration des attributs</h3>
            <p className="text-sm text-gray-400">Définissez les types d'attributs disponibles pour vos variantes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Attributs visuels */}
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Palette className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Attributs visuels</CardTitle>
                  <CardDescription className="text-gray-400">
                    Apparence et style du produit
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Label 
                      htmlFor="color_variants"
                      className="text-sm font-medium text-white"
                    >
                      Couleurs
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Différentes couleurs disponibles</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-gray-400">Différentes couleurs disponibles</p>
                </div>
                <Switch
                  id="color_variants"
                  checked={formData.color_variants || false}
                  onCheckedChange={(checked) => updateFormData("color_variants", checked)}
                  aria-label="Activer les variantes de couleurs"
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label 
                    htmlFor="pattern_variants"
                    className="text-sm font-medium text-white"
                  >
                    Motifs
                  </Label>
                  <p className="text-sm text-gray-400">Différents motifs ou designs</p>
                </div>
                <Switch
                  id="pattern_variants"
                  checked={formData.pattern_variants || false}
                  onCheckedChange={(checked) => updateFormData("pattern_variants", checked)}
                  aria-label="Activer les variantes de motifs"
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label 
                    htmlFor="finish_variants"
                    className="text-sm font-medium text-white"
                  >
                    Finitions
                  </Label>
                  <p className="text-sm text-gray-400">Mat, brillant, satiné, etc.</p>
                </div>
                <Switch
                  id="finish_variants"
                  checked={formData.finish_variants || false}
                  onCheckedChange={(checked) => updateFormData("finish_variants", checked)}
                  aria-label="Activer les variantes de finitions"
                  className="touch-manipulation"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attributs dimensionnels */}
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <Ruler className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-white">Attributs dimensionnels</CardTitle>
                  <CardDescription className="text-gray-400">
                    Tailles et dimensions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label 
                    htmlFor="size_variants"
                    className="text-sm font-medium text-white"
                  >
                    Tailles
                  </Label>
                  <p className="text-sm text-gray-400">XS, S, M, L, XL, etc.</p>
                </div>
                <Switch
                  id="size_variants"
                  checked={formData.size_variants || false}
                  onCheckedChange={(checked) => updateFormData("size_variants", checked)}
                  aria-label="Activer les variantes de tailles"
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label 
                    htmlFor="dimension_variants"
                    className="text-sm font-medium text-white"
                  >
                    Dimensions
                  </Label>
                  <p className="text-sm text-gray-400">Longueur, largeur, hauteur</p>
                </div>
                <Switch
                  id="dimension_variants"
                  checked={formData.dimension_variants || false}
                  onCheckedChange={(checked) => updateFormData("dimension_variants", checked)}
                  aria-label="Activer les variantes de dimensions"
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label 
                    htmlFor="weight_variants"
                    className="text-sm font-medium text-white"
                  >
                    Poids
                  </Label>
                  <p className="text-sm text-gray-400">Différents poids disponibles</p>
                </div>
                <Switch
                  id="weight_variants"
                  checked={formData.weight_variants || false}
                  onCheckedChange={(checked) => updateFormData("weight_variants", checked)}
                  aria-label="Activer les variantes de poids"
                  className="touch-manipulation"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Gestion des stocks */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <TrendingUp className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">Gestion des stocks</CardTitle>
              <CardDescription className="text-gray-400">
                Gérez les stocks pour chaque variante
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label 
                htmlFor="centralized_stock"
                className="text-sm font-medium text-white"
              >
                Gestion centralisée des stocks
              </Label>
              <p className="text-sm text-gray-400">Stocks gérés globalement</p>
            </div>
            <Switch
              id="centralized_stock"
              checked={formData.centralized_stock || false}
              onCheckedChange={(checked) => updateFormData("centralized_stock", checked)}
              aria-label="Activer la gestion centralisée des stocks"
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label 
                htmlFor="low_stock_alerts"
                className="text-sm font-medium text-white"
              >
                Alertes de stock bas
              </Label>
              <p className="text-sm text-gray-400">Notifications automatiques</p>
            </div>
            <Switch
              id="low_stock_alerts"
              checked={formData.low_stock_alerts || false}
              onCheckedChange={(checked) => updateFormData("low_stock_alerts", checked)}
              aria-label="Activer les alertes de stock bas"
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label 
                htmlFor="preorder_allowed"
                className="text-sm font-medium text-white"
              >
                Précommande autorisée
              </Label>
              <p className="text-sm text-gray-400">Permettre les commandes sans stock</p>
            </div>
            <Switch
              id="preorder_allowed"
              checked={formData.preorder_allowed || false}
              onCheckedChange={(checked) => updateFormData("preorder_allowed", checked)}
              aria-label="Autoriser les précommandes"
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label 
                htmlFor="hide_when_out_of_stock"
                className="text-sm font-medium text-white"
              >
                Masquer si rupture
              </Label>
              <p className="text-sm text-gray-400">Cacher le produit si plus de stock</p>
            </div>
            <Switch
              id="hide_when_out_of_stock"
              checked={formData.hide_when_out_of_stock || false}
              onCheckedChange={(checked) => updateFormData("hide_when_out_of_stock", checked)}
              aria-label="Masquer le produit en cas de rupture de stock"
              className="touch-manipulation"
            />
          </div>

          {outOfStockCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg" role="alert">
              <AlertCircle className="h-4 w-4 text-red-400" aria-hidden="true" />
              <span className="text-sm text-red-400">
                {outOfStockCount} variante{outOfStockCount > 1 ? 's' : ''} en rupture de stock
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Règles de prix */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">Règles de prix</CardTitle>
              <CardDescription className="text-gray-400">
                Définissez des règles de prix pour les variantes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label 
                htmlFor="different_prices_per_variant"
                className="text-sm font-medium text-white"
              >
                Prix différent par variante
              </Label>
              <p className="text-sm text-gray-400">Chaque variante peut avoir son prix</p>
            </div>
            <Switch
              id="different_prices_per_variant"
              checked={formData.different_prices_per_variant || false}
              onCheckedChange={(checked) => updateFormData("different_prices_per_variant", checked)}
              aria-label="Autoriser les prix différents par variante"
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label 
                htmlFor="price_surcharge"
                className="text-sm font-medium text-white"
              >
                Supplément de prix
              </Label>
              <p className="text-sm text-gray-400">Ajouter un supplément pour certaines variantes</p>
            </div>
            <Switch
              id="price_surcharge"
              checked={formData.price_surcharge || false}
              onCheckedChange={(checked) => updateFormData("price_surcharge", checked)}
              aria-label="Activer les suppléments de prix"
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label 
                htmlFor="quantity_discounts"
                className="text-sm font-medium text-white"
              >
                Remise sur quantité
              </Label>
              <p className="text-sm text-gray-400">Réductions pour achats en gros</p>
            </div>
            <Switch
              id="quantity_discounts"
              checked={formData.quantity_discounts || false}
              onCheckedChange={(checked) => updateFormData("quantity_discounts", checked)}
              aria-label="Activer les remises sur quantité"
              className="touch-manipulation"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
