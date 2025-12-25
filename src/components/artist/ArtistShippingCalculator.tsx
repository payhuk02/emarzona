/**
 * Composant pour Calculer le Shipping Spécialisé d'une Œuvre d'Artiste
 * Date: 31 Janvier 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        title: t('shipping.countryRequired', 'Pays requis'),
        description: t('shipping.selectCountry', 'Veuillez sélectionner un pays'),
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
          {t('shipping.artistCalculator.title', 'Calcul du Shipping Spécialisé')}
        </CardTitle>
        <CardDescription>
          {t('shipping.artistCalculator.description', 'Calculez les frais de livraison spécialisés pour cette œuvre d\'artiste')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shipping-country">{t('shipping.country', 'Pays')} *</Label>
            <Select id="shipping-country">
              <SelectTrigger>
                <SelectValue placeholder={t('shipping.selectCountry', 'Sélectionner un pays')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SN">{t('countries.SN', 'Sénégal')}</SelectItem>
                <SelectItem value="CI">{t('countries.CI', 'Côte d\'Ivoire')}</SelectItem>
                <SelectItem value="ML">{t('countries.ML', 'Mali')}</SelectItem>
                <SelectItem value="BF">{t('countries.BF', 'Burkina Faso')}</SelectItem>
                <SelectItem value="FR">{t('countries.FR', 'France')}</SelectItem>
                <SelectItem value="BE">{t('countries.BE', 'Belgique')}</SelectItem>
                <SelectItem value="CH">{t('countries.CH', 'Suisse')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-city">{t('shipping.city', 'Ville')} ({t('common.optional', 'optionnel')})</Label>
            <Input id="shipping-city" placeholder={t('shipping.cityPlaceholder', 'Ex: Dakar')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-postal-code">{t('shipping.postalCode', 'Code postal')} ({t('common.optional', 'optionnel')})</Label>
            <Input id="shipping-postal-code" placeholder={t('shipping.postalCodePlaceholder', 'Ex: 75001')} />
          </div>
        </div>

        <Button onClick={handleCalculate} className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('shipping.calculating', 'Calcul en cours...')}
            </>
          ) : (
            t('shipping.calculate', 'Calculer le shipping')
          )}
        </Button>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{t('shipping.calculationError', 'Erreur lors du calcul du shipping')}</span>
          </div>
        )}

        {quote && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('shipping.baseShipping', 'Shipping de base')}</span>
              <span className="font-medium">{quote.base_shipping.toLocaleString()} {quote.currency}</span>
            </div>

            {quote.insurance_cost > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t('shipping.insurance', 'Assurance')}</span>
                </div>
                <span className="font-medium">{quote.insurance_cost.toLocaleString()} {quote.currency}</span>
              </div>
            )}

            {quote.packaging_cost > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{t('shipping.specializedPackaging', 'Emballage spécialisé')}</span>
                </div>
                <span className="font-medium">{quote.packaging_cost.toLocaleString()} {quote.currency}</span>
              </div>
            )}

            {quote.special_handling_cost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('shipping.specialHandling', 'Manutention spéciale')}</span>
                <span className="font-medium">{quote.special_handling_cost.toLocaleString()} {quote.currency}</span>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="font-semibold">{t('shipping.totalShipping', 'Total shipping')}</span>
              <span className="text-lg font-bold text-primary">
                {quote.total_shipping.toLocaleString()} {quote.currency}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>{t('shipping.estimatedDelivery', { days: quote.estimated_delivery_days, defaultValue: `Livraison estimée : ${quote.estimated_delivery_days} jours` })}</span>
            </div>

            {quote.carrier_recommendations.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium">{t('shipping.recommendedCarriers', 'Transporteurs recommandés :')}</span>
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

