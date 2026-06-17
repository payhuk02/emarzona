/**
 * Page: Conditions Générales d'Utilisation (CGU) / Terms of Service
 */

import { FileText } from 'lucide-react';
import { PlatformLegalPageShell } from '@/components/legal/PlatformLegalPageShell';
import { getPlatformLegalPageByType } from '@/lib/admin/platformLegalPagesConfig';

const meta = getPlatformLegalPageByType('terms');

export default function TermsOfService() {
  if (!meta) return null;

  return (
    <PlatformLegalPageShell
      meta={meta}
      headerIcon={<FileText className="h-8 w-8 text-blue-600" />}
    />
  );
}
