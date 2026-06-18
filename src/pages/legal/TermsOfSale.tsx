/**
 * Page: Conditions Générales de Vente (CGV) / Terms of Sale
 */

import { ShoppingBag } from 'lucide-react';
import { PlatformLegalPageShell } from '@/components/legal/PlatformLegalPageShell';
import { getPlatformLegalPageByType } from '@/lib/admin/platformLegalPagesConfig';

const meta = getPlatformLegalPageByType('sales');

export default function TermsOfSale() {
  if (!meta) return null;

  return (
    <PlatformLegalPageShell
      meta={meta}
      headerIcon={<ShoppingBag className="h-8 w-8 text-blue-600" />}
    />
  );
}
