import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Percent, 
  Target, 
  Gift,
  Users,
  Zap,
  Settings,
  TrendingUp,
  HelpCircle
} from "lucide-react";
import { PromotionCard, Promotion } from "./ProductPromotionsTab/PromotionCard";

/**
 * Interface stricte pour les données du formulaire produit
 */
interface ProductFormData {
  promotions?: Promotion[];
  
  // Réductions
  launch_discount?: boolean;
  seasonal_discount?: boolean;
  clearance_discount?: boolean;
  
  // Offres spéciales
  buy_2_get_1?: boolean;
  family_pack?: boolean;
  flash_offer?: boolean;
  
  // Promotions clients
  first_order_discount?: boolean;
  loyalty_discount?: boolean;
  birthday_discount?: boolean;
  
  // Configuration avancée
  stackable_promotions?: boolean;
  automatic_promotions?: boolean;
  promotion_notifications?: boolean;
  geo_promotions?: boolean;
}

interface ProductPromotionsTabProps {
  formData: ProductFormData;
  updateFormData: <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => void;
}

export const ProductPromotionsTab = ({ formData, updateFormData }: ProductPromotionsTabProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>(formData.promotions || []);
  const [editingPromotion, setEditingPromotion] = useState<number | null>(null);

  const addPromotion = () => {
    const newPromotion: Promotion = {
      id: Date.now().toString(),
      name: "",
      type: "percentage",
      value: 0,
      start_date: null,
      end_date: null,
      min_quantity: 1,
      max_uses: null,
      customer_limit: null,
      is_active: true
    };
    
    const updatedPromotions = [...promotions, newPromotion];
    setPromotions(updatedPromotions);
    updateFormData("promotions", updatedPromotions);
    setEditingPromotion(updatedPromotions.length - 1);
  };

  const updatePromotion = (index: number, field: keyof Promotion, value: any) => {
    const updatedPromotions = [...promotions];
    updatedPromotions[index] = { ...updatedPromotions[index], [field]: value };
    setPromotions(updatedPromotions);
    updateFormData("promotions", updatedPromotions);
  };

  const removePromotion = (index: number) => {
    const updatedPromotions = promotions.filter((_, i) => i !== index);
    setPromotions(updatedPromotions);
    updateFormData("promotions", updatedPromotions);
  };

  const activePromotionsCount = promotions.filter(p => p.is_active).length;
  const percentageCount = promotions.filter(p => p.type === "percentage").length;
  const fixedCount = promotions.filter(p => p.type === "fixed").length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Percent className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-white">Gestion des promotions</CardTitle>
                <CardDescription className="text-gray-400">
                  Créez des promotions et réductions pour booster vos ventes
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration des promotions */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold text-white">Promotions actives</CardTitle>
              <CardDescription className="text-gray-400">
                {promotions.length} promotion{promotions.length > 1 ? 's' : ''} configurée{promotions.length > 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button 
              onClick={addPromotion} 
              className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]"
            >
              <Gift className="h-4 w-4 mr-2" />
              Ajouter une promotion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Gift className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Aucune promotion configurée</p>
              <p className="text-sm mb-4">Créez des promotions pour attirer plus de clients</p>
              <Button onClick={addPromotion} className="bg-blue-600 hover:bg-blue-700 text-white min-h-[44px]">
                <Gift className="h-4 w-4 mr-2" />
                Créer la première promotion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promotion, index) => (
                <PromotionCard
                  key={promotion.id}
                  promotion={promotion}
                  index={index}
                  isEditing={editingPromotion === index}
                  onEdit={() => setEditingPromotion(editingPromotion === index ? null : index)}
                  onDelete={() => removePromotion(index)}
                  onToggleActive={() => updatePromotion(index, "is_active", !promotion.is_active)}
                  onUpdate={(field, value) => updatePromotion(index, field, value)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="bg-gray-700" />

      {/* Types de promotions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Target className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Types de promotions</h3>
            <p className="text-sm text-gray-400">Activez différents types de promotions pour votre boutique</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Réductions */}
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Percent className="h-5 w-5 text-green-400" />
                </div>
                <CardTitle className="text-base font-semibold text-white">Réductions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="launch_discount" className="text-sm font-medium text-white">
                    Réduction de lancement
                  </Label>
                  <p className="text-xs text-gray-400">Promotion pour nouveaux produits</p>
                </div>
                <Switch
                  id="launch_discount"
                  checked={formData.launch_discount || false}
                  onCheckedChange={(checked) => updateFormData("launch_discount", checked)}
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="seasonal_discount" className="text-sm font-medium text-white">
                    Réduction saisonnière
                  </Label>
                  <p className="text-xs text-gray-400">Promotions selon les saisons</p>
                </div>
                <Switch
                  id="seasonal_discount"
                  checked={formData.seasonal_discount || false}
                  onCheckedChange={(checked) => updateFormData("seasonal_discount", checked)}
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="clearance_discount" className="text-sm font-medium text-white">
                    Réduction de stock
                  </Label>
                  <p className="text-xs text-gray-400">Liquidation des stocks</p>
                </div>
                <Switch
                  id="clearance_discount"
                  checked={formData.clearance_discount || false}
                  onCheckedChange={(checked) => updateFormData("clearance_discount", checked)}
                  className="touch-manipulation"
                />
              </div>
            </CardContent>
          </Card>

          {/* Offres spéciales */}
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20">
                  <Gift className="h-5 w-5 text-indigo-400" />
                </div>
                <CardTitle className="text-base font-semibold text-white">Offres spéciales</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="buy_2_get_1" className="text-sm font-medium text-white">
                    Acheter 2, obtenir 1 gratuit
                  </Label>
                  <p className="text-xs text-gray-400">Offre B2G1</p>
                </div>
                <Switch
                  id="buy_2_get_1"
                  checked={formData.buy_2_get_1 || false}
                  onCheckedChange={(checked) => updateFormData("buy_2_get_1", checked)}
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="family_pack" className="text-sm font-medium text-white">
                    Pack famille
                  </Label>
                  <p className="text-xs text-gray-400">Réduction sur les packs</p>
                </div>
                <Switch
                  id="family_pack"
                  checked={formData.family_pack || false}
                  onCheckedChange={(checked) => updateFormData("family_pack", checked)}
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="flash_offer" className="text-sm font-medium text-white">
                    Offre flash
                  </Label>
                  <p className="text-xs text-gray-400">Promotions limitées dans le temps</p>
                </div>
                <Switch
                  id="flash_offer"
                  checked={formData.flash_offer || false}
                  onCheckedChange={(checked) => updateFormData("flash_offer", checked)}
                  className="touch-manipulation"
                />
              </div>
            </CardContent>
          </Card>

          {/* Promotions clients */}
          <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Users className="h-5 w-5 text-orange-400" />
                </div>
                <CardTitle className="text-base font-semibold text-white">Promotions clients</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="first_order_discount" className="text-sm font-medium text-white">
                    Première commande
                  </Label>
                  <p className="text-xs text-gray-400">Réduction pour nouveaux clients</p>
                </div>
                <Switch
                  id="first_order_discount"
                  checked={formData.first_order_discount || false}
                  onCheckedChange={(checked) => updateFormData("first_order_discount", checked)}
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="loyalty_discount" className="text-sm font-medium text-white">
                    Fidélité
                  </Label>
                  <p className="text-xs text-gray-400">Réduction pour clients fidèles</p>
                </div>
                <Switch
                  id="loyalty_discount"
                  checked={formData.loyalty_discount || false}
                  onCheckedChange={(checked) => updateFormData("loyalty_discount", checked)}
                  className="touch-manipulation"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="birthday_discount" className="text-sm font-medium text-white">
                    Anniversaire
                  </Label>
                  <p className="text-xs text-gray-400">Promotion d'anniversaire</p>
                </div>
                <Switch
                  id="birthday_discount"
                  checked={formData.birthday_discount || false}
                  onCheckedChange={(checked) => updateFormData("birthday_discount", checked)}
                  className="touch-manipulation"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Configuration avancée */}
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">Configuration avancée</CardTitle>
              <CardDescription className="text-gray-400">
                Personnalisation avancée des promotions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="stackable_promotions" className="text-sm font-medium text-white">
                  Promotions cumulables
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Permettre plusieurs promotions simultanées</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-gray-400">Permettre plusieurs promotions simultanées</p>
            </div>
            <Switch
              id="stackable_promotions"
              checked={formData.stackable_promotions || false}
              onCheckedChange={(checked) => updateFormData("stackable_promotions", checked)}
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="automatic_promotions" className="text-sm font-medium text-white">
                Promotions automatiques
              </Label>
              <p className="text-sm text-gray-400">Activation automatique selon les conditions</p>
            </div>
            <Switch
              id="automatic_promotions"
              checked={formData.automatic_promotions || false}
              onCheckedChange={(checked) => updateFormData("automatic_promotions", checked)}
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="promotion_notifications" className="text-sm font-medium text-white">
                Notifications de promotion
              </Label>
              <p className="text-sm text-gray-400">Alertes par email pour les promotions</p>
            </div>
            <Switch
              id="promotion_notifications"
              checked={formData.promotion_notifications || false}
              onCheckedChange={(checked) => updateFormData("promotion_notifications", checked)}
              className="touch-manipulation"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="geo_promotions" className="text-sm font-medium text-white">
                Promotions géolocalisées
              </Label>
              <p className="text-sm text-gray-400">Promotions selon la localisation</p>
            </div>
            <Switch
              id="geo_promotions"
              checked={formData.geo_promotions || false}
              onCheckedChange={(checked) => updateFormData("geo_promotions", checked)}
              className="touch-manipulation"
            />
          </div>
        </CardContent>
      </Card>

      {/* Résumé des promotions */}
      <Card className="border-2 border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-white">Résumé des promotions</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{promotions.length}</div>
              <div className="text-sm text-gray-400 mt-1">Promotions configurées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{activePromotionsCount}</div>
              <div className="text-sm text-gray-400 mt-1">Promotions actives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{percentageCount}</div>
              <div className="text-sm text-gray-400 mt-1">Réductions %</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{fixedCount}</div>
              <div className="text-sm text-gray-400 mt-1">Réductions fixes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
