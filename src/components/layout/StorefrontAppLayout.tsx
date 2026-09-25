/**
 * Layout boutique persistant (*.myemarzona.shop).
 * Thème + header/footer montés une fois ; Suspense interne pour les lazy pages.
 */

import { Outlet, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { StoreThemeProvider } from '@/components/storefront/StoreThemeProvider';
import StoreHeader from '@/components/storefront/StoreHeader';
import StoreFooter from '@/components/storefront/StoreFooter';
import { RouteOutletSuspense } from '@/components/navigation/RouteChunkFallback';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useCurrentStoreBySubdomain } from '@/hooks/useStoreBySubdomain';
import { StorefrontShellProvider } from '@/contexts/StorefrontShellContext';
import { shouldShowStoreChrome, shouldShowStoreHeader } from '@/lib/storefront/storefront-chrome';
import type { Store as ThemedStore } from '@/hooks/useStores';
import type { Store as HeaderStore } from '@/hooks/useStore';

export function StorefrontAppLayout() {
  useScrollRestoration();
  const location = useLocation();
  // Résout via le host réel (subdomain / custom domain), pas le slug — aligné middleware RQ cache
  const { data: store, isLoading: storeLoading } = useCurrentStoreBySubdomain();
  const showChrome = shouldShowStoreChrome(location.pathname);
  const showHeader = shouldShowStoreHeader(location.pathname);

  const shellValue = useMemo(
    () =>
      ({
        chromeProvided: true as const,
        store: (store as ThemedStore) ?? null,
        storeLoading,
      }) satisfies import('@/contexts/StorefrontShellContext').StorefrontShellContextValue,
    [store, storeLoading]
  );

  const headerStore = store
    ? ({
        ...store,
        description: store.description ?? null,
      } as HeaderStore & {
        logo_url?: string;
        banner_url?: string;
        active_clients?: number;
        is_verified?: boolean;
        info_message?: string | null;
        info_message_color?: string | null;
        info_message_font?: string | null;
      })
    : null;

  return (
    <StorefrontShellProvider value={shellValue}>
      <StoreThemeProvider store={(store as ThemedStore) ?? null}>
        <div
          className="min-h-screen flex flex-col overflow-x-hidden store-theme-active"
          style={{ backgroundColor: store?.background_color || undefined }}
        >
          {showHeader && headerStore && <StoreHeader store={headerStore} />}

          <div className="flex-1 flex flex-col min-w-0">
            <RouteOutletSuspense>
              <Outlet />
            </RouteOutletSuspense>
          </div>

          {showChrome && store && (
            <StoreFooter
              storeName={store.name}
              facebook_url={store.facebook_url || undefined}
              instagram_url={store.instagram_url || undefined}
              twitter_url={store.twitter_url || undefined}
              linkedin_url={store.linkedin_url || undefined}
              youtube_url={store.youtube_url || undefined}
              tiktok_url={store.tiktok_url || undefined}
              pinterest_url={store.pinterest_url || undefined}
              snapchat_url={store.snapchat_url || undefined}
              discord_url={store.discord_url || undefined}
              twitch_url={store.twitch_url || undefined}
              store={store as ThemedStore}
              storeSlug={store.slug}
            />
          )}
        </div>
      </StoreThemeProvider>
    </StorefrontShellProvider>
  );
}
