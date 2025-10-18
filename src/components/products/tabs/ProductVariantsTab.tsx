import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Package, 
  Palette, 
  Ruler, 
  Weight,
  Zap,
  Settings,
  Target,
  TrendingUp
} from "lucide-react";

interface ProductVariantsTabProps {
  formData: any;
  updateFormData: (field: string, value: any) => void;
}

export const ProductVariantsTab = ({ formData, updateFormData }: ProductVariantsTabProps) => {
  const [variants, setVariants] = useState(formData.variants || []);
  const [editingVariant, setEditingVariant] = useState<number | null>(null);

  const addVariant = () => {
    const newVariant = {
      id: Date.now().toString(),
      name: "",
      sku: "",
      price: formData.price || 0,
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

  const updateVariant = (index: number, field: string, value: any) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
    updateFormData("variants", updatedVariants);
  };

  const removeVariant = (index: number) => {
    const updatedVariants = variants.filter((_, i) => i !== index);
    setVariants(updatedVariants);
    updateFormData("variants", updatedVariants);
  };

  const toggleVariantActive = (index: number) => {
    const updatedVariants = [...variants];
    updatedVariants[index].is_active = !updatedVariants[index].is_active;
    setVariants(updatedVariants);
    updateFormData("variants", updatedVariants);
  };

  return (
    <div className="space-y-6">
      {/* Configuration des variantes */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Gestion des variantes
          </CardTitle>
          <CardDescription>
            Créez différentes versions de votre produit (couleurs, tailles, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Variantes du produit</h3>
              <p className="text-sm text-muted-foreground">
                {variants.length} variante{variants.length > 1 ? 's' : ''} configurée{variants.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={addVariant} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une variante
            </Button>
          </div>

          {variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune variante configurée</p>
              <p className="text-sm">Cliquez sur "Ajouter une variante" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {variants.map((variant: any, index: number) => (
                <Card key={variant.id} className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          Variante {index + 1}
                        </CardTitle>
                        <Badge variant={variant.is_active ? "default" : "secondary"}>
                          {variant.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={variant.is_active}
                          onCheckedChange={() => toggleVariantActive(index)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingVariant(editingVariant === index ? null : index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {editingVariant === index && (
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`variant-name-${index}`}>Nom de la variante</Label>
                          <Input
                            id={`variant-name-${index}`}
                            value={variant.name}
                            onChange={(e) => updateVariant(index, "name", e.target.value)}
                            placeholder="Ex: Rouge, Taille L, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor={`variant-sku-${index}`}>SKU</Label>
                          <Input
                            id={`variant-sku-${index}`}
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, "sku", e.target.value)}
                            placeholder="PROD-RED-L"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`variant-price-${index}`}>Prix</Label>
                          <Input
                            id={`variant-price-${index}`}
                            type="number"
                            value={variant.price}
                            onChange={(e) => updateVariant(index, "price", parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`variant-stock-${index}`}>Stock</Label>
                          <Input
                            id={`variant-stock-${index}`}
                            type="number"
                            value={variant.stock}
                            onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor={`variant-image-${index}`}>Image de la variante</Label>
                        <Input
                          id={`variant-image-${index}`}
                          value={variant.image}
                          onChange={(e) => updateVariant(index, "image", e.target.value)}
                          placeholder="URL de l'image"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration des attributs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configuration des attributs
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-green-600" />
                Attributs visuels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Couleurs</Label>
                  <p className="text-sm text-muted-foreground">Différentes couleurs disponibles</p>
                </div>
                <Switch
                  checked={formData.color_variants || false}
                  onCheckedChange={(checked) => updateFormData("color_variants", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Motifs</Label>
                  <p className="text-sm text-muted-foreground">Différents motifs ou designs</p>
                </div>
                <Switch
                  checked={formData.pattern_variants || false}
                  onCheckedChange={(checked) => updateFormData("pattern_variants", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Finitions</Label>
                  <p className="text-sm text-muted-foreground">Mat, brillant, satiné, etc.</p>
                </div>
                <Switch
                  checked={formData.finish_variants || false}
                  onCheckedChange={(checked) => updateFormData("finish_variants", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="h-4 w-4 text-purple-600" />
                Attributs dimensionnels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tailles</Label>
                  <p className="text-sm text-muted-foreground">XS, S, M, L, XL, etc.</p>
                </div>
                <Switch
                  checked={formData.size_variants || false}
                  onCheckedChange={(checked) => updateFormData("size_variants", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dimensions</Label>
                  <p className="text-sm text-muted-foreground">Longueur, largeur, hauteur</p>
                </div>
                <Switch
                  checked={formData.dimension_variants || false}
                  onCheckedChange={(checked) => updateFormData("dimension_variants", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Poids</Label>
                  <p className="text-sm text-muted-foreground">Différents poids disponibles</p>
                </div>
                <Switch
                  checked={formData.weight_variants || false}
                  onCheckedChange={(checked) => updateFormData("weight_variants", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Gestion des stocks */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Gestion des stocks
        </h3>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              Configuration des stocks
            </CardTitle>
            <CardDescription>
              Gérez les stocks pour chaque variante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Gestion centralisée des stocks</Label>
                <p className="text-sm text-muted-foreground">Stocks gérés globalement</p>
              </div>
              <Switch
                checked={formData.centralized_stock || false}
                onCheckedChange={(checked) => updateFormData("centralized_stock", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Alertes de stock bas</Label>
                <p className="text-sm text-muted-foreground">Notifications automatiques</p>
              </div>
              <Switch
                checked={formData.low_stock_alerts || false}
                onCheckedChange={(checked) => updateFormData("low_stock_alerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Précommande autorisée</Label>
                <p className="text-sm text-muted-foreground">Permettre les commandes sans stock</p>
              </div>
              <Switch
                checked={formData.preorder_allowed || false}
                onCheckedChange={(checked) => updateFormData("preorder_allowed", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Masquer si rupture</Label>
                <p className="text-sm text-muted-foreground">Cacher le produit si plus de stock</p>
              </div>
              <Switch
                checked={formData.hide_when_out_of_stock || false}
                onCheckedChange={(checked) => updateFormData("hide_when_out_of_stock", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Règles de prix */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Règles de prix
        </h3>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Configuration des prix
            </CardTitle>
            <CardDescription>
              Définissez des règles de prix pour les variantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Prix différent par variante</Label>
                <p className="text-sm text-muted-foreground">Chaque variante peut avoir son prix</p>
              </div>
              <Switch
                checked={formData.different_prices_per_variant || false}
                onCheckedChange={(checked) => updateFormData("different_prices_per_variant", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Supplément de prix</Label>
                <p className="text-sm text-muted-foreground">Ajouter un supplément pour certaines variantes</p>
              </div>
              <Switch
                checked={formData.price_surcharge || false}
                onCheckedChange={(checked) => updateFormData("price_surcharge", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Remise sur quantité</Label>
                <p className="text-sm text-muted-foreground">Réductions pour achats en gros</p>
              </div>
              <Switch
                checked={formData.quantity_discounts || false}
                onCheckedChange={(checked) => updateFormData("quantity_discounts", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
