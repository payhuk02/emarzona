/**
 * Physical Product - Shipping Config (Step 4)
 * Date: 27 octobre 2025
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Package, Info } from 'lucide-react';
import type { PhysicalProductFormData } from '@/types/physical-product';

interface PhysicalShippingConfigProps {
  data: Partial<PhysicalProductFormData>;
  onUpdate: (data: Partial<PhysicalProductFormData>) => void;
}

export const PhysicalShippingConfig = ({ data, onUpdate }: PhysicalShippingConfigProps) => {
  return (
    <div className="space-y-6">
      {/* Requires Shipping */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Expédition requise
              </CardTitle>
              <CardDescription>
                Ce produit nécessite-t-il une expédition physique ?
              </CardDescription>
            </div>
            <Switch
              checked={data.requires_shipping ?? true}
              onCheckedChange={(checked) => onUpdate({ requires_shipping: checked })}
            />
          </div>
        </CardHeader>
      </Card>

      {data.requires_shipping && (
        <>
          {/* Weight */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Poids du colis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Poids *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="1.5"
                    value={data.weight || ''}
                    onChange={(e) => onUpdate({ weight: parseFloat(e.target.value) || null })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight_unit">Unité</Label>
                  <Select
                    value={data.weight_unit || 'kg'}
                    onValueChange={(value) => onUpdate({ weight_unit: value as any })}
                  >
                    <SelectTrigger id="weight_unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
                      <SelectItem value="g">Grammes (g)</SelectItem>
                      <SelectItem value="lb">Livres (lb)</SelectItem>
                      <SelectItem value="oz">Onces (oz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Le poids est utilisé pour calculer les frais d'expédition
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle>Dimensions du colis</CardTitle>
              <CardDescription>
                Dimensions pour le calcul de l'expédition (optionnel)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Longueur</Label>
                  <Input
                    id="length"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="30"
                    value={data.dimensions?.length || ''}
                    onChange={(e) =>
                      onUpdate({
                        dimensions: {
                          ...data.dimensions!,
                          length: parseFloat(e.target.value) || null,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width">Largeur</Label>
                  <Input
                    id="width"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="20"
                    value={data.dimensions?.width || ''}
                    onChange={(e) =>
                      onUpdate({
                        dimensions: {
                          ...data.dimensions!,
                          width: parseFloat(e.target.value) || null,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Hauteur</Label>
                  <Input
                    id="height"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="10"
                    value={data.dimensions?.height || ''}
                    onChange={(e) =>
                      onUpdate({
                        dimensions: {
                          ...data.dimensions!,
                          height: parseFloat(e.target.value) || null,
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dim_unit">Unité</Label>
                  <Select
                    value={data.dimensions?.unit || 'cm'}
                    onValueChange={(value) =>
                      onUpdate({
                        dimensions: {
                          ...data.dimensions!,
                          unit: value as 'cm' | 'in',
                        },
                      })
                    }
                  >
                    <SelectTrigger id="dim_unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">Centimètres</SelectItem>
                      <SelectItem value="in">Pouces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Free Shipping */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Livraison gratuite</CardTitle>
                  <CardDescription>
                    Offrir la livraison gratuite pour ce produit
                  </CardDescription>
                </div>
                <Switch
                  checked={data.free_shipping ?? false}
                  onCheckedChange={(checked) => onUpdate({ free_shipping: checked })}
                />
              </div>
            </CardHeader>
          </Card>
        </>
      )}

      {!data.requires_shipping && (
        <Alert>
          <AlertDescription>
            Ce produit est numérique ou n'a pas besoin d'expédition (ex: service sur place)
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
