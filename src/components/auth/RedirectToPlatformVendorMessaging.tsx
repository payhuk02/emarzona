import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPlatformUrl } from '@/lib/auth-routes';
import { softNavigateTo } from '@/lib/navigation/soft-navigate';

/**
 * Sur *.myemarzona.shop, /vendor/messaging n'existe pas côté boutique :
 * redirection vers www.emarzona.com avec le même chemin et query string.
 */
export function RedirectToPlatformVendorMessaging() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    softNavigateTo(getPlatformUrl(`${pathname}${search}`));
  }, [pathname, search]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
