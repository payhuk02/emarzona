import type { Store } from '@/hooks/useStore';
import { Users } from '@/components/icons';
import { Check } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useStoreTheme } from '@/hooks/useStoreTheme';

interface StoreHeaderProps {
  store: Store & {
    logo_url?: string;
    banner_url?: string;
    active_clients?: number;
    is_verified?: boolean;
    info_message?: string | null;
    info_message_color?: string | null;
    info_message_font?: string | null;
  };
  /** Message informatif optionnel à afficher au-dessus de la bannière (prioritaire sur store.info_message) */
  infoMessage?: React.ReactNode;
}

const StoreHeader = ({ store, infoMessage }: StoreHeaderProps) => {
  const theme = useStoreTheme(store);

  // Vérifier si le message existe et n'est pas vide
  const hasInfoMessage =
    store?.info_message &&
    typeof store.info_message === 'string' &&
    store.info_message.trim().length > 0;

  // Déterminer la classe CSS selon le style du header
  const headerStyleClass = `store-header-${theme.headerStyle}`;

  // Utiliser infoMessage en priorité, sinon utiliser store.info_message avec styles personnalisés
  const displayMessage =
    infoMessage ||
    (hasInfoMessage ? (
      <div
        className="border-b px-4 py-3 text-center text-sm"
        style={{
          backgroundColor: store.info_message_color
            ? `${store.info_message_color}15`
            : 'rgba(59, 130, 246, 0.1)',
          borderColor: store.info_message_color
            ? `${store.info_message_color}40`
            : 'rgba(59, 130, 246, 0.2)',
          color: store.info_message_color || '#3b82f6',
          fontFamily: store.info_message_font || 'Inter, sans-serif',
        }}
      >
        {store.info_message}
      </div>
    ) : null);

  return (
    <div className="relative">
      {/* Espace pour message informatif en haut */}
      {displayMessage && (
        <div className="w-full bg-transparent relative z-30">{displayMessage}</div>
      )}

      {/* Espace réservé même sans message (pour cohérence visuelle) */}
      {!displayMessage && <div className="h-4 sm:h-6 w-full bg-transparent" aria-hidden="true" />}

      {/* Language Switcher - Top Right */}
      <div
        className={`absolute ${infoMessage ? 'top-20 sm:top-24 md:top-28' : 'top-4'} right-4 z-50`}
      >
        <LanguageSwitcher variant="outline" showLabel={false} />
      </div>

      {/* Banner - Hauteur agrandie pour affichage professionnel */}
      <div
        className="h-64 sm:h-80 md:h-96 lg:h-[28rem] w-full overflow-visible relative"
        style={{
          background: store.banner_url
            ? undefined
            : `linear-gradient(to bottom right, ${theme.primaryColor}33, ${theme.secondaryColor}33, ${theme.accentColor}33)`,
        }}
      >
        {store.banner_url ? (
          <>
            <img
              src={store.banner_url}
              alt={`Bannière de ${store.name}`}
              className="h-full w-full object-cover object-bottom"
              loading="eager"
            />
            {/* Overlay gradient pour meilleure lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
            <div className="text-center">
              <Users className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 text-primary/30 mx-auto mb-3 animate-pulse" />
              <p className="text-muted-foreground text-sm sm:text-base font-medium">
                Bannière de la boutique
              </p>
              <p className="text-muted-foreground/70 text-xs mt-1">
                Ajoutez une bannière personnalisée dans les paramètres
              </p>
            </div>
          </div>
        )}

        {/* Logo positionné sur la bannière (en bas à gauche) */}
        <div className="absolute bottom-0 left-3 sm:left-4 md:left-6 lg:left-8 transform translate-y-1/2 z-20">
          {store.logo_url ? (
            <div className="relative group">
              {/* Ombre portée professionnelle */}
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-110 opacity-50 group-hover:opacity-75 transition-opacity" />
              {/* Logo avec bordure et ombre améliorées */}
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36 rounded-full overflow-hidden border-4 border-background shadow-2xl bg-card ring-4 ring-background/50">
                <img
                  src={store.logo_url}
                  alt={`Logo de ${store.name}`}
                  className="h-full w-full object-cover"
                  loading="eager"
                />
              </div>
              {/* Badge de vérification optionnel (pour futures fonctionnalités) */}
              {store.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 border-2 border-background shadow-lg">
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ) : (
            <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36 rounded-full border-4 border-background shadow-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-4 ring-background/50">
              <Users className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 text-primary/60" />
            </div>
          )}
        </div>
      </div>

      {/* Store Info Card */}
      <div className={`bg-card border-b shadow-soft overflow-hidden relative ${headerStyleClass}`}>
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 py-6 sm:py-8 pt-16 sm:pt-20 md:pt-24 lg:pt-28">
            {/* Espace réservé pour le logo (maintenant sur la bannière) */}
            <div className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36"></div>

            {/* Store Details */}
            <div className="flex-1 min-w-0 w-full">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 truncate"
                style={{
                  color: theme.textColor,
                  fontFamily: theme.headingFont,
                }}
              >
                {store.name}
              </h1>
              {store.description && (
                <p
                  className="text-xs sm:text-sm md:text-base mb-2 line-clamp-2 break-words"
                  style={{
                    color: theme.textSecondaryColor,
                    fontFamily: theme.bodyFont,
                  }}
                >
                  {store.description}
                </p>
              )}
              {store.active_clients !== undefined && store.active_clients > 0 && (
                <div
                  className="flex items-center gap-2 text-xs sm:text-sm bg-muted/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full inline-flex max-w-fit"
                  style={{
                    color: theme.textSecondaryColor,
                    borderRadius: theme.borderRadius === 'full' ? '9999px' : undefined,
                  }}
                >
                  <Users
                    className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                    style={{ color: theme.primaryColor }}
                  />
                  <span className="font-medium whitespace-nowrap">
                    {store.active_clients} clients actifs
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreHeader;






