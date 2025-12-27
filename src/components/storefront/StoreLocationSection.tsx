/**
 * StoreLocationSection Component
 * Affiche la localisation et les horaires d'ouverture dans le storefront
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Calendar, Globe } from 'lucide-react';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import type { Store, StoreOpeningHours } from '@/hooks/useStores';

interface StoreLocationSectionProps {
  store: Store | null;
}

const  DAYS_LABELS: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export const StoreLocationSection : React.FC<StoreLocationSectionProps> = ({ store }) => {
  const theme = useStoreTheme(store);

  if (!store) return null;

  const hasAddress = store.address_line1 || store.city || store.country;
  const hasOpeningHours = store.opening_hours !== null && store.opening_hours !== undefined;
  const openingHours = store.opening_hours as StoreOpeningHours | null;

  // Vérifier s'il y a des horaires spéciaux aujourd'hui ou à venir
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const specialHoursToday = openingHours?.special_hours?.find(
    (sh) => sh.date === todayStr
  );
  const upcomingSpecialHours = openingHours?.special_hours
    ?.filter((sh) => sh.date >= todayStr && sh.date !== todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3) || [];

  // Formater l'adresse complète
  const formatAddress = () => {
    const  parts: string[] = [];
    if (store.address_line1) parts.push(store.address_line1);
    if (store.address_line2) parts.push(store.address_line2);
    if (store.city) parts.push(store.city);
    if (store.state_province) parts.push(store.state_province);
    if (store.postal_code) parts.push(store.postal_code);
    if (store.country) parts.push(store.country);
    return parts.join(', ');
  };

  // Obtenir le statut d'ouverture actuel
  const getCurrentStatus = () => {
    if (!openingHours) return null;

    const now = new Date();
    const currentDay = DAYS_ORDER[now.getDay() === 0 ? 6 : now.getDay() - 1];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Vérifier d'abord les horaires spéciaux
    if (specialHoursToday) {
      if (specialHoursToday.closed) {
        return { isOpen: false, reason: specialHoursToday.reason || 'Fermé exceptionnellement' };
      }
      if (currentTime >= specialHoursToday.open && currentTime <= specialHoursToday.close) {
        return { isOpen: true, reason: specialHoursToday.reason || 'Ouvert exceptionnellement' };
      }
      return { isOpen: false, reason: specialHoursToday.reason || 'Fermé exceptionnellement' };
    }

    // Vérifier les horaires réguliers
    const dayHours = openingHours[currentDay];
    if (dayHours.closed) {
      return { isOpen: false, reason: 'Fermé aujourd\'hui' };
    }
    if (currentTime >= dayHours.open && currentTime <= dayHours.close) {
      return { isOpen: true, reason: `Ouvert jusqu'à ${dayHours.close}` };
    }
    if (currentTime < dayHours.open) {
      return { isOpen: false, reason: `Ouvre à ${dayHours.open}` };
    }
    return { isOpen: false, reason: `Fermé (fermeture à ${dayHours.close})` };
  };

  const currentStatus = getCurrentStatus();

  if (!hasAddress && !hasOpeningHours) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Adresse */}
      {hasAddress && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: theme.primaryColor }} />
              Localisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm sm:text-base font-medium" style={{ color: theme.textColor }}>
                {formatAddress()}
              </p>
              {store.latitude && store.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm inline-flex items-center gap-1 hover:underline"
                  style={{ color: theme.linkColor }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.linkHoverColor; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.linkColor; }}
                >
                  <MapPin className="h-3 w-3" />
                  Voir sur Google Maps
                </a>
              )}
            </div>
            {store.timezone && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>Fuseau horaire: {store.timezone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Horaires d'ouverture */}
      {hasOpeningHours && openingHours && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" style={{ color: theme.primaryColor }} />
              Horaires d'ouverture
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statut actuel */}
            {currentStatus && (
              <div
                className="p-3 rounded-lg border-2"
                style={{
                  backgroundColor: currentStatus.isOpen
                    ? `${theme.primaryColor}15`
                    : `${theme.textSecondaryColor}15`,
                  borderColor: currentStatus.isOpen
                    ? `${theme.primaryColor}40`
                    : `${theme.textSecondaryColor}40`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: currentStatus.isOpen ? theme.primaryColor : theme.textSecondaryColor,
                    }}
                  />
                  <span className="text-sm font-medium" style={{ color: theme.textColor }}>
                    {currentStatus.isOpen ? 'Ouvert maintenant' : 'Fermé maintenant'}
                  </span>
                </div>
                {currentStatus.reason && (
                  <p className="text-xs mt-1" style={{ color: theme.textSecondaryColor }}>
                    {currentStatus.reason}
                  </p>
                )}
              </div>
            )}

            {/* Horaires réguliers */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold" style={{ color: theme.textColor }}>
                Horaires réguliers
              </h4>
              <div className="space-y-1">
                {DAYS_ORDER.map((day) => {
                  const dayHours = openingHours[day];
                  return (
                    <div
                      key={day}
                      className="flex items-center justify-between text-sm py-1 border-b border-dashed"
                      style={{ borderColor: theme.textSecondaryColor + '20' }}
                    >
                      <span style={{ color: theme.textColor }}>{DAYS_LABELS[day]}</span>
                      {dayHours.closed ? (
                        <span className="text-muted-foreground">Fermé</span>
                      ) : (
                        <span style={{ color: theme.textSecondaryColor }}>
                          {dayHours.open} - {dayHours.close}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Horaires spéciaux */}
            {specialHoursToday && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  Aujourd'hui (horaire spécial)
                </h4>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                    {new Date(specialHoursToday.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {specialHoursToday.reason && (
                    <p className="text-xs mt-1" style={{ color: theme.textSecondaryColor }}>
                      {specialHoursToday.reason}
                    </p>
                  )}
                  {!specialHoursToday.closed && (
                    <p className="text-sm mt-2" style={{ color: theme.textColor }}>
                      {specialHoursToday.open} - {specialHoursToday.close}
                    </p>
                  )}
                  {specialHoursToday.closed && (
                    <p className="text-sm mt-2 text-muted-foreground">Fermé</p>
                  )}
                </div>
              </div>
            )}

            {/* Horaires spéciaux à venir */}
            {upcomingSpecialHours.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: theme.primaryColor }} />
                  Horaires spéciaux à venir
                </h4>
                <div className="space-y-2">
                  {upcomingSpecialHours.map((sh, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                        {new Date(sh.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      {sh.reason && (
                        <p className="text-xs mt-1" style={{ color: theme.textSecondaryColor }}>
                          {sh.reason}
                        </p>
                      )}
                      {!sh.closed && (
                        <p className="text-sm mt-2" style={{ color: theme.textColor }}>
                          {sh.open} - {sh.close}
                        </p>
                      )}
                      {sh.closed && (
                        <p className="text-sm mt-2 text-muted-foreground">Fermé</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};









