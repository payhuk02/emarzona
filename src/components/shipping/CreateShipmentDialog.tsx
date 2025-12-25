/**
 * Create Shipment Dialog
 * Date: 28 octobre 2025
 * 
 * Dialog pour créer une nouvelle expédition
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateFedexShipment } from '@/hooks/shipping/useFedexShipping';
import { Package, MapPin, Settings } from 'lucide-react';
import { COUNTRIES } from '@/lib/countries';

interface CreateShipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  orderId?: string;
}

export function CreateShipmentDialog({
  open,
  onOpenChange,
  storeId,
  orderId,
}: CreateShipmentDialogProps) {
  const createShipment = useCreateFedexShipment();
  const [step, setStep] = useState('origin');

  // Form state
  const [formData, setFormData] = useState({
    // Origin
    originName: '',
    originCompany: '',
    originAddress: '',
    originCity: '',
    originState: '',
    originZip: '',
    originCountry: 'BF',
    originPhone: '',

    // Destination
    destName: '',
    destCompany: '',
    destAddress: '',
    destCity: '',
    destState: '',
    destZip: '',
    destCountry: 'BF',
    destPhone: '',

    // Package
    weight: '1',
    length: '',
    width: '',
    height: '',
    insuranceValue: '',

    // Service
    serviceType: 'FEDEX_GROUND',
  });

  const handleSubmit = async () => {
    if (!orderId) {
      alert('Veuillez sélectionner une commande');
      return;
    }

    const shipmentRequest = {
      ship_from: {
        name: formData.originName,
        company: formData.originCompany,
        address: formData.originAddress,
        city: formData.originCity,
        state: formData.originState,
        zip: formData.originZip,
        country: formData.originCountry,
        phone: formData.originPhone,
      },
      ship_to: {
        name: formData.destName,
        company: formData.destCompany,
        address: formData.destAddress,
        city: formData.destCity,
        state: formData.destState,
        zip: formData.destZip,
        country: formData.destCountry,
        phone: formData.destPhone,
      },
      package: {
        weight: parseFloat(formData.weight),
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        insurance_value: formData.insuranceValue
          ? parseFloat(formData.insuranceValue)
          : undefined,
      },
      service_type: formData.serviceType,
      reference: orderId,
    };

    await createShipment.mutateAsync({
      orderId,
      storeId,
      shipmentRequest,
    });

    onOpenChange(false);
    // Reset form
    setStep('origin');
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nouvelle expédition
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle expédition et générez l'étiquette d'envoi
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={setStep} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="origin">
              <MapPin className="h-4 w-4 mr-2" />
              Origine
            </TabsTrigger>
            <TabsTrigger value="destination">
              <MapPin className="h-4 w-4 mr-2" />
              Destination
            </TabsTrigger>
            <TabsTrigger value="package">
              <Package className="h-4 w-4 mr-2" />
              Colis
            </TabsTrigger>
          </TabsList>

          {/* Origin */}
          <TabsContent value="origin" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originName">Nom *</Label>
                <Input
                  id="originName"
                  value={formData.originName}
                  onChange={(e) => updateField('originName', e.target.value)}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label htmlFor="originCompany">Entreprise</Label>
                <Input
                  id="originCompany"
                  value={formData.originCompany}
                  onChange={(e) => updateField('originCompany', e.target.value)}
                  placeholder="Ma Boutique"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="originAddress">Adresse *</Label>
              <Input
                id="originAddress"
                value={formData.originAddress}
                onChange={(e) => updateField('originAddress', e.target.value)}
                placeholder="123 Avenue de la Liberté"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originCity">Ville *</Label>
                <Input
                  id="originCity"
                  value={formData.originCity}
                  onChange={(e) => updateField('originCity', e.target.value)}
                  placeholder="Ouagadougou"
                />
              </div>
              <div>
                <Label htmlFor="originZip">Code postal *</Label>
                <Input
                  id="originZip"
                  value={formData.originZip}
                  onChange={(e) => updateField('originZip', e.target.value)}
                  placeholder="01000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originCountry">Pays *</Label>
                <Select
                  value={formData.originCountry}
                  onValueChange={(value) => updateField('originCountry', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="originPhone">Téléphone *</Label>
                <Input
                  id="originPhone"
                  value={formData.originPhone}
                  onChange={(e) => updateField('originPhone', e.target.value)}
                  placeholder="+226 12 34 56 78"
                />
              </div>
            </div>

            <Button onClick={() => setStep('destination')} className="w-full">
              Suivant
            </Button>
          </TabsContent>

          {/* Destination */}
          <TabsContent value="destination" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destName">Nom *</Label>
                <Input
                  id="destName"
                  value={formData.destName}
                  onChange={(e) => updateField('destName', e.target.value)}
                  placeholder="Marie Martin"
                />
              </div>
              <div>
                <Label htmlFor="destCompany">Entreprise</Label>
                <Input
                  id="destCompany"
                  value={formData.destCompany}
                  onChange={(e) => updateField('destCompany', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="destAddress">Adresse *</Label>
              <Input
                id="destAddress"
                value={formData.destAddress}
                onChange={(e) => updateField('destAddress', e.target.value)}
                placeholder="456 Rue du Commerce"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destCity">Ville *</Label>
                <Input
                  id="destCity"
                  value={formData.destCity}
                  onChange={(e) => updateField('destCity', e.target.value)}
                  placeholder="Abidjan"
                />
              </div>
              <div>
                <Label htmlFor="destZip">Code postal *</Label>
                <Input
                  id="destZip"
                  value={formData.destZip}
                  onChange={(e) => updateField('destZip', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destCountry">Pays *</Label>
                <Select
                  value={formData.destCountry}
                  onValueChange={(value) => updateField('destCountry', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="destPhone">Téléphone *</Label>
                <Input
                  id="destPhone"
                  value={formData.destPhone}
                  onChange={(e) => updateField('destPhone', e.target.value)}
                  placeholder="+225 12 34 56 78"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('origin')} className="flex-1">
                Retour
              </Button>
              <Button onClick={() => setStep('package')} className="flex-1">
                Suivant
              </Button>
            </div>
          </TabsContent>

          {/* Package */}
          <TabsContent value="package" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Poids (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                  placeholder="1.5"
                />
              </div>
              <div>
                <Label htmlFor="serviceType">Service FedEx *</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => updateField('serviceType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FEDEX_GROUND">FedEx Ground (5 jours)</SelectItem>
                    <SelectItem value="FEDEX_2DAY">FedEx 2Day</SelectItem>
                    <SelectItem value="FEDEX_OVERNIGHT">FedEx Overnight</SelectItem>
                    <SelectItem value="FEDEX_INTERNATIONAL">
                      FedEx International
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">Longueur (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  value={formData.length}
                  onChange={(e) => updateField('length', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="width">Largeur (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  value={formData.width}
                  onChange={(e) => updateField('width', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="height">Hauteur (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => updateField('height', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="insuranceValue">Valeur assurée (XOF)</Label>
              <Input
                id="insuranceValue"
                type="number"
                value={formData.insuranceValue}
                onChange={(e) => updateField('insuranceValue', e.target.value)}
                placeholder="50000"
              />
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('destination')} className="flex-1">
                Retour
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={createShipment.isPending || !formData.weight}
              >
                {createShipment.isPending ? 'Création...' : 'Créer l\'expédition'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

