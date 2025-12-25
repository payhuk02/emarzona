/**
 * Artist Product - Shipping Configuration
 * Date: 28 Janvier 2025
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Truck, Package, Shield, Info, AlertTriangle } from 'lucide-react';
import type { ArtistProductFormData } from '@/types/artist-product';

interface ArtistShippingConfigProps {
  data: Partial<ArtistProductFormData>;
  onUpdate: (data: Partial<ArtistProductFormData>) => void;
}

const ArtistShippingConfigComponent = ({ data, onUpdate }: ArtistShippingConfigProps) => {
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
                Cette œuvre nécessite-t-elle une expédition physique ?
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
          {/* Handling Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Délai de préparation
              </CardTitle>
              <CardDescription>
                Temps nécessaire pour préparer l'œuvre avant expédition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="shipping_handling_time">Délai (en jours) *</Label>
                <Input
                  id="shipping_handling_time"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="7"
                  value={data.shipping_handling_time || 7}
                  onChange={(e) => onUpdate({ shipping_handling_time: parseInt(e.target.value) || 7 })}
                />
                <p className="text-xs text-muted-foreground">
                  Temps nécessaire pour emballer et préparer l'œuvre
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Fragile Item */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Œuvre fragile
                  </CardTitle>
                  <CardDescription>
                    Cette œuvre nécessite-t-elle un emballage spécial ?
                  </CardDescription>
                </div>
                <Switch
                  checked={data.shipping_fragile ?? false}
                  onCheckedChange={(checked) => {
                    onUpdate({ shipping_fragile: checked });
                    // Si fragile, suggérer l'assurance
                    if (checked && !data.shipping_insurance_required) {
                      onUpdate({ shipping_insurance_required: true });
                    }
                  }}
                />
              </div>
            </CardHeader>
            {data.shipping_fragile && (
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Les œuvres fragiles nécessitent un emballage renforcé et peuvent avoir des frais d'expédition supplémentaires.
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
          </Card>

          {/* Insurance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Assurance d'expédition
                  </CardTitle>
                  <CardDescription>
                    Protégez l'œuvre avec une assurance d'expédition
                  </CardDescription>
                </div>
                <Switch
                  checked={data.shipping_insurance_required ?? false}
                  onCheckedChange={(checked) => onUpdate({ shipping_insurance_required: checked })}
                />
              </div>
            </CardHeader>
            {data.shipping_insurance_required && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shipping_insurance_amount">Montant de l'assurance (XOF)</Label>
                  <Input
                    id="shipping_insurance_amount"
                    type="number"
                    min="0"
                    step="1"
                    placeholder={data.price?.toString() || '0'}
                    value={data.shipping_insurance_amount || ''}
                    onChange={(e) => onUpdate({ 
                      shipping_insurance_amount: e.target.value ? parseFloat(e.target.value) : null 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Montant à assurer (par défaut: prix de l'œuvre)
                  </p>
                </div>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    L'assurance protège contre les dommages et pertes pendant le transport. 
                    Le coût est généralement calculé en fonction de la valeur assurée.
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
          </Card>

          {/* Shipping Info Alert */}
          <Alert>
            <Truck className="h-4 w-4" />
            <AlertDescription>
              <strong>Conseil :</strong> Pour les œuvres d'art de grande valeur, nous recommandons fortement 
              d'activer l'assurance d'expédition et de marquer l'œuvre comme fragile.
            </AlertDescription>
          </Alert>
        </>
      )}

      {!data.requires_shipping && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Si cette œuvre est un produit numérique (ebook, musique téléchargeable, etc.), 
            l'expédition physique n'est pas nécessaire.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

// Optimisation avec React.memo
export const ArtistShippingConfig = React.memo(ArtistShippingConfigComponent);

