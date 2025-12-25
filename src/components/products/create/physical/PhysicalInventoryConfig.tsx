/**
 * Physical Product - Inventory Config (Step 3)
 * Date: 27 octobre 2025
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, AlertTriangle } from '@/components/icons';
import type { PhysicalProductFormData } from '@/types/physical-product';

interface PhysicalInventoryConfigProps {
  data: Partial<PhysicalProductFormData>;
  onUpdate: (data: Partial<PhysicalProductFormData>) => void;
}

export const PhysicalInventoryConfig = ({ data, onUpdate }: PhysicalInventoryConfigProps) => {
  return (
    <div className="space-y-6">
      {/* Track Inventory */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Suivi des stocks
              </CardTitle>
              <CardDescription>
                Gérez automatiquement la quantité disponible
              </CardDescription>
            </div>
            <Switch
              checked={data.track_inventory ?? true}
              onCheckedChange={(checked) => onUpdate({ track_inventory: checked })}
            />
          </div>
        </CardHeader>

        {data.track_inventory && (
          <CardContent className="space-y-4">
            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Stock Keeping Unit) *</Label>
              <Input
                id="sku"
                placeholder="Ex: TSH-COT-BLK-L"
                value={data.sku || ''}
                onChange={(e) => onUpdate({ sku: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Identifiant unique pour ce produit
              </p>
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <Label htmlFor="barcode">Code-barres (optionnel)</Label>
              <Input
                id="barcode"
                placeholder="Ex: 123456789012"
                value={data.barcode || ''}
                onChange={(e) => onUpdate({ barcode: e.target.value })}
              />
            </div>

            {/* Quantity */}
            {!data.has_variants && (
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité en stock *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={data.quantity || 0}
                  onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            )}

            {/* Inventory Policy */}
            <div className="space-y-3">
              <Label>Politique de stock</Label>
              <RadioGroup
                value={data.inventory_policy || 'deny'}
                onValueChange={(value) => onUpdate({ inventory_policy: value as 'deny' | 'continue' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="deny" id="deny" />
                  <Label htmlFor="deny" className="font-normal cursor-pointer">
                    Arrêter les ventes quand le stock est épuisé
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="continue" id="continue" />
                  <Label htmlFor="continue" className="font-normal cursor-pointer">
                    Continuer à vendre (précommande)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {data.inventory_policy === 'continue' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Les clients pourront acheter même si le stock est à 0 (précommande)
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {!data.track_inventory && (
        <Alert>
          <AlertDescription>
            Le suivi des stocks est désactivé. Vous devrez gérer manuellement la disponibilité.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

