/**
 * Shipping Label Generator Component
 * Générer des étiquettes d'expédition
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useShippingCarriers, useGenerateShippingLabel, useShippingLabels } from '@/hooks/physical/useShippingCarriers';
import { useStore } from '@/hooks/useStore';
import { Package, Download, Printer, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ShippingLabelGeneratorProps {
  orderId: string;
  orderWeight: number;
  orderDimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export const ShippingLabelGenerator = ({
  orderId,
  orderWeight,
  orderDimensions,
}: ShippingLabelGeneratorProps) => {
  const { store } = useStore();
  const { data: carriers = [] } = useShippingCarriers(store?.id);
  const { data: existingLabels = [] } = useShippingLabels(store?.id);
  const generateLabel = useGenerateShippingLabel();

  const [selectedCarrier, setSelectedCarrier] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [fromAddress, setFromAddress] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    countryCode: 'SN',
    phone: '',
    email: '',
  });
  const [toAddress, setToAddress] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    countryCode: 'SN',
    phone: '',
    email: '',
  });

  const orderLabels = existingLabels.filter(l => l.order_id === orderId);

  const handleGenerate = async () => {
    if (!selectedCarrier || !selectedService) return;

    await generateLabel.mutateAsync({
      orderId,
      carrierId: selectedCarrier,
      serviceType: selectedService,
      fromAddress,
      toAddress,
      weight: orderWeight,
      dimensions: orderDimensions,
    });
  };

  const selectedCarrierData = carriers.find(c => c.id === selectedCarrier);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Générer une Étiquette d'Expédition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Étiquettes existantes */}
        {orderLabels.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Étiquettes existantes</h3>
            {orderLabels.map((label) => (
              <div key={label.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{label.label_number}</p>
                  {label.tracking_number && (
                    <p className="text-sm text-muted-foreground">
                      Suivi: {label.tracking_number}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(label.created_at), 'PPp', { locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {label.label_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(label.label_url, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  )}
                  {label.status === 'generated' && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-4">
          {/* Transporteur */}
          <div className="space-y-2">
            <Label htmlFor="label-carrier">Transporteur *</Label>
            <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
              <SelectTrigger id="label-carrier">
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

          {/* Service */}
          {selectedCarrierData && (
            <div className="space-y-2">
              <Label htmlFor="label-service">Service *</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger id="label-service">
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCarrierData.available_services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Adresse expéditeur */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Adresse Expéditeur</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-name">Nom *</Label>
                <Input
                  id="from-name"
                  value={fromAddress.name}
                  onChange={(e) => setFromAddress({ ...fromAddress, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-city">Ville *</Label>
                <Input
                  id="from-city"
                  value={fromAddress.city}
                  onChange={(e) => setFromAddress({ ...fromAddress, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-address">Adresse *</Label>
                <Input
                  id="from-address"
                  value={fromAddress.addressLine1}
                  onChange={(e) => setFromAddress({ ...fromAddress, addressLine1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-postal">Code postal *</Label>
                <Input
                  id="from-postal"
                  value={fromAddress.postalCode}
                  onChange={(e) => setFromAddress({ ...fromAddress, postalCode: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Adresse destinataire */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">Adresse Destinataire</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="to-name">Nom *</Label>
                <Input
                  id="to-name"
                  value={toAddress.name}
                  onChange={(e) => setToAddress({ ...toAddress, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-city">Ville *</Label>
                <Input
                  id="to-city"
                  value={toAddress.city}
                  onChange={(e) => setToAddress({ ...toAddress, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-address">Adresse *</Label>
                <Input
                  id="to-address"
                  value={toAddress.addressLine1}
                  onChange={(e) => setToAddress({ ...toAddress, addressLine1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to-postal">Code postal *</Label>
                <Input
                  id="to-postal"
                  value={toAddress.postalCode}
                  onChange={(e) => setToAddress({ ...toAddress, postalCode: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Générer */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedCarrier || !selectedService || generateLabel.isPending}
            className="w-full"
          >
            {generateLabel.isPending ? (
              'Génération en cours...'
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Générer l'étiquette
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

