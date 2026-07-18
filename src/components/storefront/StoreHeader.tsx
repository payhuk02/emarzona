import type { Store } from '@/hooks/useStore';
import { Users } from '@/components/icons';
import { Check } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import { cn } from '@/lib/utils';

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
  /** Conservé pour compatibilité — non affiché dans le header visuel */
  infoMessage?: React.ReactNode;
}

const LOGO_SIZE = 'h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 xl:h-32 xl:w-32';

const LOGO_OVERLAP = 'h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16';

const StoreHeader = ({ store }: StoreHeaderProps) => {
  const theme = useStoreTheme(store);

  return (
    <header
      className={cn(
        'relative w-full',
        theme.headerStyle === 'minimal' && 'store-header-minimal',
        theme.headerStyle === 'standard' && 'store-header-standard',
        theme.headerStyle === 'extended' && 'store-header-extended'
      )}
      aria-label={store.name}
    >
      <div
        className={cn(
          'relative w-full overflow-hidden',
          'aspect-[2.15/1] min-h-[8.75rem] max-h-[12.5rem]',
          'sm:aspect-[2.45/1] sm:min-h-[10rem] sm:max-h-[16rem]',
          'md:aspect-[2.85/1] md:min-h-[11.5rem] md:max-h-[20rem]',
          'lg:aspect-[3.1/1] lg:max-h-[24rem]',
          'xl:max-h-[28rem]'
        )}
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
              alt=""
              role="presentation"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
              decoding="async"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1280px"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-black/10"
              aria-hidden
            />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10"
            aria-hidden
          >
            <Users className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary/25 animate-pulse" />
          </div>
        )}

        <div className="absolute top-3 right-3 z-30 sm:top-4 sm:right-4">
          <LanguageSwitcher variant="outline" showLabel={false} />
        </div>

        <div className="absolute bottom-0 left-3 z-20 translate-y-1/2 sm:left-4 md:left-6 lg:left-8">
          {store.logo_url ? (
            <div className="relative group">
              <div className="absolute inset-0 scale-110 rounded-full bg-primary/20 opacity-50 blur-xl transition-opacity group-hover:opacity-75" />
              <div
                className={cn(
                  'relative overflow-hidden rounded-full border-[3px] border-background bg-card shadow-xl ring-2 ring-background/60 sm:border-4 sm:ring-4',
                  LOGO_SIZE
                )}
              >
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
              {store.is_verified && (
                <div className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background bg-primary p-1 shadow-lg sm:-bottom-1 sm:-right-1 sm:p-1.5">
                  <Check className="h-2.5 w-2.5 text-primary-foreground sm:h-3.5 sm:w-3.5" />
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                'flex items-center justify-center rounded-full border-[3px] border-background bg-gradient-to-br from-primary/20 to-secondary/20 shadow-xl ring-2 ring-background/60 sm:border-4 sm:ring-4',
                LOGO_SIZE
              )}
              aria-hidden
            >
              <Users className="h-7 w-7 text-primary/50 sm:h-9 sm:w-9 md:h-11 md:w-11 lg:h-12 lg:w-12" />
            </div>
          )}
        </div>
      </div>

      {/* Espace pour la moitié inférieure du logo (mobile-first) */}
      <div className={cn('w-full shrink-0', LOGO_OVERLAP)} aria-hidden />
    </header>
  );
};

export default StoreHeader;
