/**
 * Composant pour Calculer le Shipping Spécialisé d'une Œuvre d'Artiste
 * Date: 31 Janvier 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalculateArtistShipping } from '@/hooks/artist/useArtistShipping';
import { Truck, Shield, Package, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArtistShippingCalculatorProps {
  productId: string;
  artworkValue: number;
}

export function ArtistShippingCalculator({ productId, artworkValue }: ArtistShippingCalculatorProps) {
  const { toast } = useToast();
  const [destination, setDestination] = useState<{
    country: string;
    city?: string;
    postal_code?: string;
  } | null>(null);

  const { data: quote, isLoading, error } = useCalculateArtistShipping(
    productId,
    destination,
    artworkValue
  );

  const handleCalculate = () => {
    const country = (document.getElementById('shipping-country') as HTMLSelectElement)?.value;
    const city = (document.getElementById('shipping-city') as HTMLInputElement)?.value;
    const postalCode = (document.getElementById('shipping-postal-code') as HTMLInputElement)?.value;

    if (!country) {
      toast({
        title: 'Pays requis',
        description: 'Veuillez sélectionner un pays',
        variant: 'destructive',
      });
      return;
    }

    setDestination({
      country,
      city: city || undefined,
      postal_code: postalCode || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Calcul du Shipping Spécialisé
        </CardTitle>
        <CardDescription>
          Calculez les frais de livraison spécialisés pour cette œuvre d'artiste
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shipping-country">Pays *</Label>
            <Select id="shipping-country">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SN">Sénégal</SelectItem>
                <SelectItem value="CI">Côte d'Ivoire</SelectItem>
                <SelectItem value="ML">Mali</SelectItem>
                <SelectItem value="BF">Burkina Faso</SelectItem>
                <SelectItem value="FR">France</SelectItem>
                <SelectItem value="BE">Belgique</SelectItem>
                <SelectItem value="CH">Suisse</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-city">Ville (optionnel)</Label>
            <Input id="shipping-city" placeholder="Ex: Dakar" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-postal-code">Code postal (optionnel)</Label>
            <Input id="shipping-postal-code" placeholder="Ex: 75001" />
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calcul en cours...
            </>
          ) : (
            'Calculer le shipping'
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Erreur lors du calcul du shipping</span>
          </div>
        )}

        {quote && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Shipping de base</span>
              <span className="font-medium">{quote.base_shipping.toLocaleString()} {quote.currency}</span>
            </div>

            {quote.insurance_cost > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Assurance</span>
                </div>
                <span className="font-medium">{quote.insurance_cost.toLocaleString()} {quote.currency}</span>
              </div>
            )}

            {quote.packaging_cost > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Emballage spécialisé</span>
                </div>
                <span className="font-medium">{quote.packaging_cost.toLocaleString()} {quote.currency}</span>
              </div>
            )}

            {quote.special_handling_cost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Manutention spéciale</span>
                <span className="font-medium">{quote.special_handling_cost.toLocaleString()} {quote.currency}</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold">Total shipping</span>
              <span className="text-lg font-bold text-primary">
                {quote.total_shipping.toLocaleString()} {quote.currency}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Livraison estimée : {quote.estimated_delivery_days} jours</span>
            </div>

            {quote.carrier_recommendations.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Transporteurs recommandés :</span>
                <div className="flex flex-wrap gap-2">
                  {quote.carrier_recommendations.map((carrier, index) => (
                    <Badge key={index} variant="outline">
                      {carrier}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

