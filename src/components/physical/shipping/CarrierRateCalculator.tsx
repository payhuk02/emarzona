/**
 * Carrier Rate Calculator Component
 * Calculer les tarifs de livraison avec transporteurs réels
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShippingCarriers, useCalculateCarrierRates } from '@/hooks/physical/useShippingCarriers';
import { Loader2, Calculator, Package } from 'lucide-react';
import { useStore } from '@/hooks/useStore';

interface CarrierRateCalculatorProps {
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  onRateSelected?: (rate: any) => void;
}

export const CarrierRateCalculator = ({
  weight,
  dimensions,
  onRateSelected,
}: CarrierRateCalculatorProps) => {
  const { store } = useStore();
  const { data: carriers = [] } = useShippingCarriers(store?.id);
  const calculateRates = useCalculateCarrierRates();

  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [fromCountry, setFromCountry] = useState('SN');
  const [fromPostalCode, setFromPostalCode] = useState('');
  const [toCountry, setToCountry] = useState('SN');
  const [toPostalCode, setToPostalCode] = useState('');
  const [rates, setRates] = useState<any[]>([]);

  const handleCalculate = async () => {
    if (!selectedCarrier) return;

    const result = await calculateRates.mutateAsync({
      carrierId: selectedCarrier,
      from: {
        country: fromCountry,
        postalCode: fromPostalCode,
      },
      to: {
        country: toCountry,
        postalCode: toPostalCode,
      },
      weight,
      dimensions,
    });

    setRates(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculer les Tarifs de Livraison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Transporteur */}
        <div className="space-y-2">
          <Label htmlFor="carrier">Transporteur</Label>
          <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
            <SelectTrigger id="carrier">
              <SelectValue placeholder="Sélectionner un transporteur" />
            </SelectTrigger>
            <SelectContent>
              {carriers.map((carrier) => (
                <SelectItem key={carrier.id} value={carrier.id}>
                  {carrier.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Adresse expéditeur */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from-country">Pays expéditeur</Label>
            <Input
              id="from-country"
              value={fromCountry}
              onChange={(e) => setFromCountry(e.target.value)}
              placeholder="SN"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-postal">Code postal</Label>
            <Input
              id="from-postal"
              value={fromPostalCode}
              onChange={(e) => setFromPostalCode(e.target.value)}
              placeholder="12345"
            />
          </div>
        </div>

        {/* Adresse destinataire */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="to-country">Pays destinataire</Label>
            <Input
              id="to-country"
              value={toCountry}
              onChange={(e) => setToCountry(e.target.value)}
              placeholder="SN"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to-postal">Code postal</Label>
            <Input
              id="to-postal"
              value={toPostalCode}
              onChange={(e) => setToPostalCode(e.target.value)}
              placeholder="12345"
            />
          </div>
        </div>

        {/* Informations colis */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4" />
            <span className="font-medium">Informations colis</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Poids: {weight} kg</p>
            {dimensions && (
              <p>Dimensions: {dimensions.length} x {dimensions.width} x {dimensions.height} cm</p>
            )}
          </div>
        </div>

        {/* Bouton calculer */}
        <Button
          onClick={handleCalculate}
          disabled={!selectedCarrier || calculateRates.isPending}
          className="w-full"
        >
          {calculateRates.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calcul en cours...
            </>
          ) : (
            'Calculer les tarifs'
          )}
        </Button>

        {/* Résultats */}
        {rates.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="font-semibold">Tarifs disponibles</h3>
            {rates.map((rate, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => onRateSelected?.(rate)}
              >
                <div>
                  <p className="font-medium">{rate.serviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    Livraison estimée: {rate.estimatedDeliveryDays} jour{rate.estimatedDeliveryDays > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {rate.totalPrice.toLocaleString('fr-FR')} {rate.currency}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

