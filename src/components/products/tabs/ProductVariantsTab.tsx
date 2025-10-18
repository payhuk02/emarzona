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
    <div className="saas-space-y-6">
      {/* Configuration des variantes */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-5 w-5 text-blue-600" />
          <h3 className="saas-section-title">Gestion des variantes</h3>
        </div>
        <p className="saas-section-description">
          Créez différentes versions de votre produit (couleurs, tailles, etc.)
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="saas-label">Variantes du produit</h4>
            <p className="saas-label-description">
              {variants.length} variante{variants.length > 1 ? 's' : ''} configurée{variants.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={addVariant} size="sm" className="saas-button">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une variante
          </Button>
        </div>

        {variants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune variante configurée</p>
            <p className="text-sm">Cliquez sur "Ajouter une variante" pour commencer</p>
          </div>
        ) : (
          <div className="saas-space-y-4">
            {variants.map((variant: any, index: number) => (
              <div key={variant.id} className="saas-section-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h4 className="saas-section-title">Variante {index + 1}</h4>
                    <span className={`saas-badge ${variant.is_active ? 'saas-badge-success' : 'saas-badge'}`}>
                      {variant.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={variant.is_active}
                      onCheckedChange={() => toggleVariantActive(index)}
                      className="saas-switch"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingVariant(editingVariant === index ? null : index)}
                      className="saas-button-outline"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      className="saas-button-outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {editingVariant === index && (
                  <div className="saas-space-y-4">
                    <div className="saas-grid saas-grid-cols-2">
                      <div>
                        <label className="saas-label">Nom de la variante</label>
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          placeholder="Ex: Rouge, Taille L, etc."
                          className="saas-input"
                        />
                      </div>
                      <div>
                        <label className="saas-label">SKU</label>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, "sku", e.target.value)}
                          placeholder="PROD-RED-L"
                          className="saas-input"
                        />
                      </div>
                    </div>

                    <div className="saas-grid saas-grid-cols-2">
                      <div>
                        <label className="saas-label">Prix</label>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, "price", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="saas-input"
                        />
                      </div>
                      <div>
                        <label className="saas-label">Stock</label>
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="saas-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="saas-label">Image de la variante</label>
                      <Input
                        value={variant.image}
                        onChange={(e) => updateVariant(index, "image", e.target.value)}
                        placeholder="URL de l'image"
                        className="saas-input"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration des attributs */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="saas-section-title">Configuration des attributs</h3>
        </div>

        <div className="saas-grid saas-grid-cols-2">
          <div className="saas-section-card">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="h-4 w-4 text-green-600" />
              <h4 className="saas-section-title">Attributs visuels</h4>
            </div>
            <div className="saas-space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="saas-label">Couleurs</label>
                  <p className="saas-label-description">Différentes couleurs disponibles</p>
                </div>
                <Switch
                  checked={formData.color_variants || false}
                  onCheckedChange={(checked) => updateFormData("color_variants", checked)}
                  className="saas-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="saas-label">Motifs</label>
                  <p className="saas-label-description">Différents motifs ou designs</p>
                </div>
                <Switch
                  checked={formData.pattern_variants || false}
                  onCheckedChange={(checked) => updateFormData("pattern_variants", checked)}
                  className="saas-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="saas-label">Finitions</label>
                  <p className="saas-label-description">Mat, brillant, satiné, etc.</p>
                </div>
                <Switch
                  checked={formData.finish_variants || false}
                  onCheckedChange={(checked) => updateFormData("finish_variants", checked)}
                  className="saas-switch"
                />
              </div>
            </div>
          </div>

          <div className="saas-section-card">
            <div className="flex items-center gap-2 mb-3">
              <Ruler className="h-4 w-4 text-purple-600" />
              <h4 className="saas-section-title">Attributs dimensionnels</h4>
            </div>
            <div className="saas-space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="saas-label">Tailles</label>
                  <p className="saas-label-description">XS, S, M, L, XL, etc.</p>
                </div>
                <Switch
                  checked={formData.size_variants || false}
                  onCheckedChange={(checked) => updateFormData("size_variants", checked)}
                  className="saas-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="saas-label">Dimensions</label>
                  <p className="saas-label-description">Longueur, largeur, hauteur</p>
                </div>
                <Switch
                  checked={formData.dimension_variants || false}
                  onCheckedChange={(checked) => updateFormData("dimension_variants", checked)}
                  className="saas-switch"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="saas-label">Poids</label>
                  <p className="saas-label-description">Différents poids disponibles</p>
                </div>
                <Switch
                  checked={formData.weight_variants || false}
                  onCheckedChange={(checked) => updateFormData("weight_variants", checked)}
                  className="saas-switch"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="saas-separator" />

      {/* Gestion des stocks */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <h3 className="saas-section-title">Gestion des stocks</h3>
        </div>
        <p className="saas-section-description">
          Gérez les stocks pour chaque variante
        </p>
        
        <div className="saas-space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Gestion centralisée des stocks</label>
              <p className="saas-label-description">Stocks gérés globalement</p>
            </div>
            <Switch
              checked={formData.centralized_stock || false}
              onCheckedChange={(checked) => updateFormData("centralized_stock", checked)}
              className="saas-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Alertes de stock bas</label>
              <p className="saas-label-description">Notifications automatiques</p>
            </div>
            <Switch
              checked={formData.low_stock_alerts || false}
              onCheckedChange={(checked) => updateFormData("low_stock_alerts", checked)}
              className="saas-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Précommande autorisée</label>
              <p className="saas-label-description">Permettre les commandes sans stock</p>
            </div>
            <Switch
              checked={formData.preorder_allowed || false}
              onCheckedChange={(checked) => updateFormData("preorder_allowed", checked)}
              className="saas-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Masquer si rupture</label>
              <p className="saas-label-description">Cacher le produit si plus de stock</p>
            </div>
            <Switch
              checked={formData.hide_when_out_of_stock || false}
              onCheckedChange={(checked) => updateFormData("hide_when_out_of_stock", checked)}
              className="saas-switch"
            />
          </div>
        </div>
      </div>

      {/* Règles de prix */}
      <div className="saas-section-card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-blue-600" />
          <h3 className="saas-section-title">Règles de prix</h3>
        </div>
        <p className="saas-section-description">
          Définissez des règles de prix pour les variantes
        </p>
        
        <div className="saas-space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Prix différent par variante</label>
              <p className="saas-label-description">Chaque variante peut avoir son prix</p>
            </div>
            <Switch
              checked={formData.different_prices_per_variant || false}
              onCheckedChange={(checked) => updateFormData("different_prices_per_variant", checked)}
              className="saas-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Supplément de prix</label>
              <p className="saas-label-description">Ajouter un supplément pour certaines variantes</p>
            </div>
            <Switch
              checked={formData.price_surcharge || false}
              onCheckedChange={(checked) => updateFormData("price_surcharge", checked)}
              className="saas-switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="saas-label">Remise sur quantité</label>
              <p className="saas-label-description">Réductions pour achats en gros</p>
            </div>
            <Switch
              checked={formData.quantity_discounts || false}
              onCheckedChange={(checked) => updateFormData("quantity_discounts", checked)}
              className="saas-switch"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
