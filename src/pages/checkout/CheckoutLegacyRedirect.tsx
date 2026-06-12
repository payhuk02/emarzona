import { Navigate } from 'react-router-dom';
import { CHECKOUT_LEGACY_REDIRECTS } from '@/lib/checkout/checkout-route';

interface Props {
  legacyPath: keyof typeof CHECKOUT_LEGACY_REDIRECTS;
}

/** Epic 3.6 — redirige les anciennes URLs checkout vers `/checkout`. */
export function CheckoutLegacyRedirect({ legacyPath }: Props) {
  return <Navigate to={CHECKOUT_LEGACY_REDIRECTS[legacyPath]} replace />;
}
