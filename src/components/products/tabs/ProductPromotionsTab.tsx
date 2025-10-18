import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Percent, 
  Calendar as CalendarIcon, 
  Clock, 
  Target, 
  Users, 
  Gift,
  Zap,
  Settings,
  TrendingUp,
  Star,
  Crown,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProductPromotionsTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductPromotionsTab = ({ formData, updateFormData }: ProductPromotionsTabProps) => {
  const [promotions, setPromotions] = useState(formData.promotions || []);
  const [editingPromotion, setEditingPromotion] = useState<number | null>(null);

  const addPromotion = () => {
    const newPromotion = {
      id: Date.now().toString(),
      name: "",
      type: "percentage", // percentage, fixed, buy_x_get_y
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

  const updatePromotion = (index: number, field: string, value: any) => {
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

  return (
    <div className="space-y-6">
      {/* Configuration des promotions */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Percent className="h-5 w-5 text-blue-600" />
            Gestion des promotions
          </CardTitle>
          <CardDescription>
            Créez des promotions et réductions pour booster vos ventes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Promotions actives</h3>
              <p className="text-sm text-muted-foreground">
                {promotions.length} promotion{promotions.length > 1 ? 's' : ''} configurée{promotions.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={addPromotion} size="sm">
              <Gift className="h-4 w-4 mr-2" />
              Ajouter une promotion
            </Button>
          </div>

          {promotions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune promotion configurée</p>
              <p className="text-sm">Cliquez sur "Ajouter une promotion" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promotion: any, index: number) => (
                <Card key={promotion.id} className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {promotion.name || `Promotion ${index + 1}`}
                        </CardTitle>
                        <Badge variant={promotion.is_active ? "default" : "secondary"}>
                          {promotion.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {promotion.type === "percentage" ? "Pourcentage" : 
                           promotion.type === "fixed" ? "Montant fixe" : 
                           "Acheter X obtenir Y"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={promotion.is_active}
                          onCheckedChange={(checked) => updatePromotion(index, "is_active", checked)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPromotion(editingPromotion === index ? null : index)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePromotion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {editingPromotion === index && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor={`promotion-name-${index}`}>Nom de la promotion</Label>
                          <Input
                            id={`promotion-name-${index}`}
                            value={promotion.name}
                            onChange={(e) => updatePromotion(index, "name", e.target.value)}
                            placeholder="Ex: Réduction de lancement"
                            className="touch-target"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`promotion-type-${index}`}>Type de promotion</Label>
                          <Select value={promotion.type} onValueChange={(value) => updatePromotion(index, "type", value)}>
                            <SelectTrigger className="touch-target">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Pourcentage</SelectItem>
                              <SelectItem value="fixed">Montant fixe</SelectItem>
                              <SelectItem value="buy_x_get_y">Acheter X obtenir Y</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor={`promotion-value-${index}`}>
                            {promotion.type === "percentage" ? "Pourcentage (%)" : 
                             promotion.type === "fixed" ? "Montant fixe" : "Valeur"}
                          </Label>
                          <Input
                            id={`promotion-value-${index}`}
                            type="number"
                            value={promotion.value}
                            onChange={(e) => updatePromotion(index, "value", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="touch-target"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`promotion-min-quantity-${index}`}>Quantité minimum</Label>
                          <Input
                            id={`promotion-min-quantity-${index}`}
                            type="number"
                            value={promotion.min_quantity}
                            onChange={(e) => updatePromotion(index, "min_quantity", parseInt(e.target.value) || 1)}
                            placeholder="1"
                            className="touch-target"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor={`promotion-max-uses-${index}`}>Utilisations max</Label>
                          <Input
                            id={`promotion-max-uses-${index}`}
                            type="number"
                            value={promotion.max_uses || ""}
                            onChange={(e) => updatePromotion(index, "max_uses", parseInt(e.target.value) || null)}
                            placeholder="Illimité"
                            className="touch-target"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`promotion-customer-limit-${index}`}>Limite par client</Label>
                          <Input
                            id={`promotion-customer-limit-${index}`}
                            type="number"
                            value={promotion.customer_limit || ""}
                            onChange={(e) => updatePromotion(index, "customer_limit", parseInt(e.target.value) || null)}
                            placeholder="Illimité"
                            className="touch-target"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label>Date de début</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !promotion.start_date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <span className="truncate">{promotion.start_date ? format(promotion.start_date, "PPP") : "Sélectionner"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={promotion.start_date}
                                onSelect={(date) => updatePromotion(index, "start_date", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label>Date de fin</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !promotion.end_date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                <span className="truncate">{promotion.end_date ? format(promotion.end_date, "PPP") : "Sélectionner"}</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={promotion.end_date}
                                onSelect={(date) => updatePromotion(index, "end_date", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Types de promotions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Types de promotions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4 text-green-600" />
                Réductions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Réduction de lancement</Label>
                  <p className="text-sm text-muted-foreground">Promotion pour nouveaux produits</p>
                </div>
                <Switch
                  checked={formData.launch_discount || false}
                  onCheckedChange={(checked) => updateFormData("launch_discount", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Réduction saisonnière</Label>
                  <p className="text-sm text-muted-foreground">Promotions selon les saisons</p>
                </div>
                <Switch
                  checked={formData.seasonal_discount || false}
                  onCheckedChange={(checked) => updateFormData("seasonal_discount", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Réduction de stock</Label>
                  <p className="text-sm text-muted-foreground">Liquidation des stocks</p>
                </div>
                <Switch
                  checked={formData.clearance_discount || false}
                  onCheckedChange={(checked) => updateFormData("clearance_discount", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-600" />
                Offres spéciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Acheter 2, obtenir 1 gratuit</Label>
                  <p className="text-sm text-muted-foreground">Offre B2G1</p>
                </div>
                <Switch
                  checked={formData.buy_2_get_1 || false}
                  onCheckedChange={(checked) => updateFormData("buy_2_get_1", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pack famille</Label>
                  <p className="text-sm text-muted-foreground">Réduction sur les packs</p>
                </div>
                <Switch
                  checked={formData.family_pack || false}
                  onCheckedChange={(checked) => updateFormData("family_pack", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Offre flash</Label>
                  <p className="text-sm text-muted-foreground">Promotions limitées dans le temps</p>
                </div>
                <Switch
                  checked={formData.flash_offer || false}
                  onCheckedChange={(checked) => updateFormData("flash_offer", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                Promotions clients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Première commande</Label>
                  <p className="text-sm text-muted-foreground">Réduction pour nouveaux clients</p>
                </div>
                <Switch
                  checked={formData.first_order_discount || false}
                  onCheckedChange={(checked) => updateFormData("first_order_discount", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Fidélité</Label>
                  <p className="text-sm text-muted-foreground">Réduction pour clients fidèles</p>
                </div>
                <Switch
                  checked={formData.loyalty_discount || false}
                  onCheckedChange={(checked) => updateFormData("loyalty_discount", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Anniversaire</Label>
                  <p className="text-sm text-muted-foreground">Promotion d'anniversaire</p>
                </div>
                <Switch
                  checked={formData.birthday_discount || false}
                  onCheckedChange={(checked) => updateFormData("birthday_discount", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Configuration avancée */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Configuration avancée
        </h3>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              Options avancées
            </CardTitle>
            <CardDescription>
              Personnalisation avancée des promotions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Promotions cumulables</Label>
                <p className="text-sm text-muted-foreground">Permettre plusieurs promotions simultanées</p>
              </div>
              <Switch
                checked={formData.stackable_promotions || false}
                onCheckedChange={(checked) => updateFormData("stackable_promotions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Promotions automatiques</Label>
                <p className="text-sm text-muted-foreground">Activation automatique selon les conditions</p>
              </div>
              <Switch
                checked={formData.automatic_promotions || false}
                onCheckedChange={(checked) => updateFormData("automatic_promotions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications de promotion</Label>
                <p className="text-sm text-muted-foreground">Alertes par email pour les promotions</p>
              </div>
              <Switch
                checked={formData.promotion_notifications || false}
                onCheckedChange={(checked) => updateFormData("promotion_notifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Promotions géolocalisées</Label>
                <p className="text-sm text-muted-foreground">Promotions selon la localisation</p>
              </div>
              <Switch
                checked={formData.geo_promotions || false}
                onCheckedChange={(checked) => updateFormData("geo_promotions", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Résumé des promotions */}
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Résumé des promotions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{promotions.length}</div>
              <div className="text-sm text-muted-foreground">Promotions configurées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {promotions.filter((p: any) => p.is_active).length}
              </div>
              <div className="text-sm text-muted-foreground">Promotions actives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {promotions.filter((p: any) => p.type === "percentage").length}
              </div>
              <div className="text-sm text-muted-foreground">Réductions %</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {promotions.filter((p: any) => p.type === "fixed").length}
              </div>
              <div className="text-sm text-muted-foreground">Réductions fixes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
