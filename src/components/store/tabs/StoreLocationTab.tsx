import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { StoreLocationSettings } from '../StoreLocationSettings';
import type { StoreFormState } from '../types/store-form';

interface StoreLocationTabProps {
  formState: Pick<
    StoreFormState,
    | 'addressLine1'
    | 'addressLine2'
    | 'city'
    | 'stateProvince'
    | 'postalCode'
    | 'country'
    | 'latitude'
    | 'longitude'
    | 'timezone'
    | 'openingHours'
  >;
  setters: Record<string, (v: string | null) => void>;
  isSubmitting: boolean;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleAddressChange: (field: string, value: string) => void;
}

export const StoreLocationTab = ({
  formState,
  setters,
  handleAddressChange,
}: StoreLocationTabProps) => {
  const { t } = useTranslation();
  const {
    addressLine1,
    addressLine2,
    city,
    stateProvince,
    postalCode,
    country,
    latitude,
    longitude,
    timezone,
    openingHours,
  } = formState;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="store-card">
        <CardHeader className="store-card-header">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            {t('store.tabs.location.title')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('store.tabs.location.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="store-card-content">
          <StoreLocationSettings
            addressLine1={addressLine1}
            addressLine2={addressLine2}
            city={city}
            stateProvince={stateProvince}
            postalCode={postalCode}
            country={country}
            latitude={latitude}
            longitude={longitude}
            timezone={timezone}
            openingHours={openingHours}
            onAddressChange={handleAddressChange}
            onCoordinatesChange={(lat, lng) => {
              setters.setLatitude(lat);
              setters.setLongitude(lng);
            }}
            onTimezoneChange={v => setters.setTimezone(v)}
            onOpeningHoursChange={v => setters.setOpeningHours(v)}
          />
        </CardContent>
      </Card>
    </div>
  );
};
