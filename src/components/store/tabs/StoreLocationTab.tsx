import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { StoreLocationSettings } from '../StoreLocationSettings';
import type { StoreFormState } from '../types/store-form';

interface StoreLocationTabProps {
  formState: Pick<StoreFormState, 'addressLine1' | 'addressLine2' | 'city' | 'stateProvince' | 'postalCode' | 'country' | 'latitude' | 'longitude' | 'timezone' | 'openingHours'>;
  setters: Record<string, (v: any) => void>;
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleAddressChange: (field: string, value: string) => void;
}

export const StoreLocationTab = ({ formState, setters, isSubmitting, handleSubmit, handleAddressChange }: StoreLocationTabProps) => {
  const { addressLine1, addressLine2, city, stateProvince, postalCode, country, latitude, longitude, timezone, openingHours } = formState;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="store-card">
        <CardHeader className="store-card-header">
          <CardTitle className="text-lg sm:text-xl font-semibold">Localisation et horaires</CardTitle>
          <CardDescription className="text-sm sm:text-base">Configurez l'adresse et les horaires d'ouverture de votre boutique</CardDescription>
        </CardHeader>
        <CardContent className="store-card-content">
          <StoreLocationSettings
            addressLine1={addressLine1} addressLine2={addressLine2} city={city}
            stateProvince={stateProvince} postalCode={postalCode} country={country}
            latitude={latitude} longitude={longitude} timezone={timezone} openingHours={openingHours}
            onAddressChange={handleAddressChange}
            onCoordinatesChange={(lat, lng) => { setters.setLatitude(lat); setters.setLongitude(lng); }}
            onTimezoneChange={v => setters.setTimezone(v)}
            onOpeningHoursChange={v => setters.setOpeningHours(v)}
          />
          <div className="pt-4 border-t mt-6">
            <Button onClick={() => handleSubmit()} disabled={isSubmitting} className="w-full sm:w-auto">
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
