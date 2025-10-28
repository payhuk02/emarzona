/**
 * Physical Product - Preview (Step 5)
 * Date: 27 octobre 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  DollarSign, 
  Warehouse, 
  Truck,
  Tag,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import type { PhysicalProductFormData } from '@/types/physical-product';

interface PhysicalPreviewProps {
  data: Partial<PhysicalProductFormData>;
  onUpdate: (data: Partial<PhysicalProductFormData>) => void;
}

export const PhysicalPreview = ({ data }: PhysicalPreviewProps) => {
  return (
    <div className="space-y-6">
      {/* Product Images */}
      {data.images && data.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Images du produit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {data.images.map((image, index) => (
                <div key={index} className="aspect-square rounded-lg border overflow-hidden">
                  <img
                    src={image}
                    alt={`Product ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informations de base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nom</p>
            <p className="text-lg font-semibold">{data.name || 'Non défini'}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">Description</p>
            <p className="text-sm">{data.description || 'Non définie'}</p>
          </div>

          {data.tags && data.tags.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {data.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tarification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prix de vente</p>
              <p className="text-2xl font-bold text-green-600">
                {data.price?.toLocaleString()} XOF
              </p>
            </div>

            {data.compare_at_price && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prix de comparaison</p>
                <p className="text-xl font-semibold line-through text-muted-foreground">
                  {data.compare_at_price.toLocaleString()} XOF
                </p>
              </div>
            )}

            {data.cost_per_item && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Coût unitaire</p>
                <p className="text-xl font-semibold">
                  {data.cost_per_item.toLocaleString()} XOF
                </p>
                <p className="text-xs text-green-600">
                  Marge: {((data.price! - data.cost_per_item) / data.price! * 100).toFixed(0)}%
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      {data.has_variants && data.variants && data.variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Variantes ({data.variants.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.variants.slice(0, 5).map((variant, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">
                    {variant.option1_value}
                    {variant.option2_value && ` / ${variant.option2_value}`}
                    {variant.option3_value && ` / ${variant.option3_value}`}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{variant.price.toLocaleString()} XOF</span>
                    <span className="text-muted-foreground">Stock: {variant.quantity}</span>
                  </div>
                </div>
              ))}
              {data.variants.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {data.variants.length - 5} autres variantes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Inventaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Suivi des stocks</span>
            {data.track_inventory ? (
              <Badge variant="default"><Check className="h-3 w-3 mr-1" /> Activé</Badge>
            ) : (
              <Badge variant="secondary"><X className="h-3 w-3 mr-1" /> Désactivé</Badge>
            )}
          </div>

          {data.track_inventory && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">SKU</p>
                  <p className="font-mono">{data.sku || 'Non défini'}</p>
                </div>
                {!data.has_variants && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Stock</p>
                    <p className="font-semibold">{data.quantity} unités</p>
                  </div>
                )}
              </div>

              {data.barcode && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Code-barres</p>
                  <p className="font-mono">{data.barcode}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground">Politique de stock</p>
                <p className="text-sm">
                  {data.inventory_policy === 'deny'
                    ? 'Arrêter les ventes quand épuisé'
                    : 'Continuer à vendre (précommande)'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Expédition
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Expédition requise</span>
            {data.requires_shipping ? (
              <Badge variant="default"><Check className="h-3 w-3 mr-1" /> Oui</Badge>
            ) : (
              <Badge variant="secondary"><X className="h-3 w-3 mr-1" /> Non</Badge>
            )}
          </div>

          {data.requires_shipping && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Poids</p>
                  <p className="font-semibold">
                    {data.weight} {data.weight_unit}
                  </p>
                </div>

                {data.dimensions?.length && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dimensions</p>
                    <p className="font-semibold">
                      {data.dimensions.length} × {data.dimensions.width} × {data.dimensions.height} {data.dimensions.unit}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Livraison gratuite</span>
                {data.free_shipping ? (
                  <Badge variant="default" className="bg-green-600">Oui</Badge>
                ) : (
                  <Badge variant="secondary">Non</Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
