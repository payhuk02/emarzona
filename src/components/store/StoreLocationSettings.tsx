/**
 * StoreLocationSettings Component
 * Composant pour la configuration de la localisation et des horaires
 * Phase 1 - Fonctionnalités avancées
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Plus, Trash2, Calendar, Loader2, Navigation } from 'lucide-react';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { StoreOpeningHours } from '@/hooks/useStores';
import { geocodeAddress, buildFullAddress } from '@/lib/geocoding';
import { useToast } from '@/hooks/use-toast';

interface StoreLocationSettingsProps {
  // Adresse
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  // Horaires
  openingHours: StoreOpeningHours | null;
  // Callbacks
  onAddressChange: (field: string, value: string) => void;
  onLocationChange: (field: string, value: number | null) => void;
  onTimezoneChange: (value: string) => void;
  onOpeningHoursChange: (hours: StoreOpeningHours) => void;
}

const DAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const TIMEZONE_VALUES = [
  'Africa/Ouagadougou',
  'Africa/Abidjan',
  'Africa/Dakar',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
] as const;

export const StoreLocationSettings: React.FC<StoreLocationSettingsProps> = ({
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
  onAddressChange,
  onLocationChange,
  onTimezoneChange,
  onOpeningHoursChange,
}) => {
  const { t } = useTranslation();
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const { toast } = useToast();
  const [geocoding, setGeocoding] = useState(false);

  const defaultHours: StoreOpeningHours = openingHours || {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: false },
    timezone: timezone || 'Africa/Ouagadougou',
    special_hours: [],
  };

  const handleDayChange = (
    day: keyof StoreOpeningHours,
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    const updatedHours = {
      ...defaultHours,
      [day]: {
        ...defaultHours[day],
        [field]: value,
      },
    };
    onOpeningHoursChange(updatedHours);
  };

  const handleAddSpecialHour = () => {
    const newSpecialHour = {
      date: '',
      open: '09:00',
      close: '18:00',
      closed: false,
      reason: '',
    };
    const updatedHours = {
      ...defaultHours,
      special_hours: [...(defaultHours.special_hours || []), newSpecialHour],
    };
    onOpeningHoursChange(updatedHours);
  };

  const handleUpdateSpecialHour = (index: number, field: string, value: string | boolean) => {
    const updatedSpecialHours = [...(defaultHours.special_hours || [])];
    updatedSpecialHours[index] = {
      ...updatedSpecialHours[index],
      [field]: value,
    };
    const updatedHours = {
      ...defaultHours,
      special_hours: updatedSpecialHours,
    };
    onOpeningHoursChange(updatedHours);
  };

  const handleRemoveSpecialHour = (index: number) => {
    const updatedSpecialHours = [...(defaultHours.special_hours || [])];
    updatedSpecialHours.splice(index, 1);
    const updatedHours = {
      ...defaultHours,
      special_hours: updatedSpecialHours,
    };
    onOpeningHoursChange(updatedHours);
  };

  const handleGeocode = async () => {
    const fullAddress = buildFullAddress(
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      country
    );

    if (!fullAddress || fullAddress.trim().length < 5) {
      toast({
        title: t('store.form.location.toast.incompleteAddressTitle'),
        description: t('store.form.location.toast.incompleteAddressDescription'),
        variant: 'destructive',
      });
      return;
    }

    setGeocoding(true);
    try {
      const result = await geocodeAddress(fullAddress);

      if (result.success) {
        onLocationChange('latitude', result.data.latitude);
        onLocationChange('longitude', result.data.longitude);

        toast({
          title: t('store.form.location.toast.geocodeSuccessTitle'),
          description: t('store.form.location.toast.geocodeSuccessDescription', {
            lat: result.data.latitude.toFixed(6),
            lng: result.data.longitude.toFixed(6),
          }),
        });
      } else {
        toast({
          title: t('store.form.location.toast.geocodeErrorTitle'),
          description: result.error.message,
          variant: 'destructive',
        });
      }
    } catch (_error: unknown) {
      toast({
        title: t('store.form.common.error'),
        description: t('store.form.location.toast.geocodeGenericError'),
        variant: 'destructive',
      });
    } finally {
      setGeocoding(false);
    }
  };

  const hasAddress = addressLine1 || city || country;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t('store.form.location.title')}
        </CardTitle>
        <CardDescription>{t('store.form.location.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adresse complète */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold">{t('store.form.location.addressTitle')}</h4>

          <div className="space-y-2">
            <Label htmlFor="address_line1">{t('store.form.location.addressLine1')}</Label>
            <Input
              id="address_line1"
              value={addressLine1}
              onChange={e => onAddressChange('address_line1', e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              placeholder={t('store.form.location.addressLine1Placeholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">{t('store.form.location.addressLine2')}</Label>
            <Input
              id="address_line2"
              value={addressLine2}
              onChange={e => onAddressChange('address_line2', e.target.value)}
              onKeyDown={handleSpaceKeyDown}
              placeholder={t('store.form.location.addressLine2Placeholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t('store.form.location.city')}</Label>
              <Input
                id="city"
                value={city}
                onChange={e => onAddressChange('city', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder={t('store.form.location.cityPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state_province">{t('store.form.location.stateProvince')}</Label>
              <Input
                id="state_province"
                value={stateProvince}
                onChange={e => onAddressChange('state_province', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder={t('store.form.location.stateProvincePlaceholder')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal_code">{t('store.form.location.postalCode')}</Label>
              <Input
                id="postal_code"
                value={postalCode}
                onChange={e => onAddressChange('postal_code', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder={t('store.form.location.postalCodePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">{t('store.form.location.country')}</Label>
              <Input
                id="country"
                value={country}
                onChange={e => onAddressChange('country', e.target.value)}
                onKeyDown={handleSpaceKeyDown}
                placeholder={t('store.form.location.countryPlaceholder')}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('store.form.location.gpsCoordinates')}</Label>
              {hasAddress && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeocode}
                  disabled={geocoding}
                  className="flex items-center gap-2"
                >
                  {geocoding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('store.form.location.geocoding')}
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4" />
                      {t('store.form.location.geocodeAuto')}
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">{t('store.form.location.latitude')}</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={latitude || ''}
                  onChange={e =>
                    onLocationChange('latitude', e.target.value ? parseFloat(e.target.value) : null)
                  }
                  placeholder={t('store.form.location.latitudePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longitude">{t('store.form.location.longitude')}</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={longitude || ''}
                  onChange={e =>
                    onLocationChange(
                      'longitude',
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder={t('store.form.location.longitudePlaceholder')}
                />
              </div>
            </div>

            {(latitude || longitude) && (
              <p className="text-xs text-muted-foreground">
                {t('store.form.location.coordinatesDisplay', {
                  lat: latitude?.toFixed(6),
                  lng: longitude?.toFixed(6),
                })}{' '}
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('store.form.location.viewOnGoogleMaps')}
                </a>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t('store.form.location.timezone')}</Label>
            <Select value={timezone} onValueChange={onTimezoneChange}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_VALUES.map(tz => (
                  <SelectItem key={tz} value={tz}>
                    {t(`store.form.location.timezones.${tz}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4" />
            <h4 className="text-sm font-semibold">{t('store.form.location.openingHours')}</h4>
          </div>

          <div className="space-y-3">
            {DAY_KEYS.map(day => {
              const dayHours = defaultHours[day];
              return (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
                >
                  <div className="w-full sm:w-24 flex-shrink-0">
                    <Label className="text-sm font-medium">
                      {t(`store.form.location.days.${day}`)}
                    </Label>
                  </div>

                  <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <Switch
                      checked={!dayHours.closed}
                      onCheckedChange={checked => handleDayChange(day, 'closed', !checked)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {dayHours.closed
                        ? t('store.form.location.closed')
                        : t('store.form.location.open')}
                    </span>
                  </div>

                  {!dayHours.closed && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${day}_open`} className="text-xs whitespace-nowrap">
                          {t('store.form.location.opening')}
                        </Label>
                        <Input
                          id={`${day}_open`}
                          type="time"
                          value={dayHours.open}
                          onChange={e => handleDayChange(day, 'open', e.target.value)}
                          className="w-28 sm:w-32"
                        />
                      </div>
                      <span className="text-muted-foreground hidden sm:inline">-</span>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`${day}_close`} className="text-xs whitespace-nowrap">
                          {t('store.form.location.closing')}
                        </Label>
                        <Input
                          id={`${day}_close`}
                          type="time"
                          value={dayHours.close}
                          onChange={e => handleDayChange(day, 'close', e.target.value)}
                          className="w-28 sm:w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            {t('store.form.location.hoursTimezoneHint', { timezone })}
          </p>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <h4 className="text-sm font-semibold">{t('store.form.location.specialHours')}</h4>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSpecialHour}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('store.form.common.add')}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            {t('store.form.location.specialHoursHint')}
          </p>

          {defaultHours.special_hours && defaultHours.special_hours.length > 0 ? (
            <div className="space-y-3">
              {defaultHours.special_hours.map((specialHour, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t('store.form.location.specialHour', { index: index + 1 })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSpecialHour(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`special_date_${index}`}>
                        {t('store.form.location.date')}
                      </Label>
                      <Input
                        id={`special_date_${index}`}
                        type="date"
                        value={specialHour.date}
                        onChange={e => handleUpdateSpecialHour(index, 'date', e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`special_reason_${index}`}>
                        {t('store.form.location.reason')}
                      </Label>
                      <Input
                        id={`special_reason_${index}`}
                        value={specialHour.reason}
                        onChange={e => handleUpdateSpecialHour(index, 'reason', e.target.value)}
                        placeholder={t('store.form.location.reasonPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!specialHour.closed}
                      onCheckedChange={checked =>
                        handleUpdateSpecialHour(index, 'closed', !checked)
                      }
                    />
                    <span className="text-xs text-muted-foreground">
                      {specialHour.closed
                        ? t('store.form.location.closedThisDay')
                        : t('store.form.location.openThisDay')}
                    </span>
                  </div>

                  {!specialHour.closed && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`special_open_${index}`}
                          className="text-xs whitespace-nowrap"
                        >
                          {t('store.form.location.opening')}
                        </Label>
                        <Input
                          id={`special_open_${index}`}
                          type="time"
                          value={specialHour.open}
                          onChange={e => handleUpdateSpecialHour(index, 'open', e.target.value)}
                          className="w-28 sm:w-32"
                        />
                      </div>
                      <span className="text-muted-foreground hidden sm:inline">-</span>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`special_close_${index}`}
                          className="text-xs whitespace-nowrap"
                        >
                          {t('store.form.location.closing')}
                        </Label>
                        <Input
                          id={`special_close_${index}`}
                          type="time"
                          value={specialHour.close}
                          onChange={e => handleUpdateSpecialHour(index, 'close', e.target.value)}
                          className="w-28 sm:w-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('store.form.location.noSpecialHours')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('store.form.location.noSpecialHoursHint')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
