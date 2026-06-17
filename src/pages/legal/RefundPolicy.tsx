/**
 * Page: Politique de Remboursement / Refund Policy
 */

import { RefreshCw } from 'lucide-react';
import { PlatformLegalPageShell } from '@/components/legal/PlatformLegalPageShell';
import { getPlatformLegalPageByType } from '@/lib/admin/platformLegalPagesConfig';

const meta = getPlatformLegalPageByType('refund');

export default function RefundPolicy() {
  if (!meta) return null;

  return (
    <PlatformLegalPageShell
      meta={meta}
      headerIcon={<RefreshCw className="h-8 w-8 text-blue-600" />}
    />
  );
}
