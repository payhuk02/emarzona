/**
 * Page: Politique de Confidentialité / Privacy Policy
 */

import { Shield } from 'lucide-react';
import { PlatformLegalPageShell } from '@/components/legal/PlatformLegalPageShell';
import { getPlatformLegalPageByType } from '@/lib/admin/platformLegalPagesConfig';

const meta = getPlatformLegalPageByType('privacy');

export default function PrivacyPolicy() {
  if (!meta) return null;

  return (
    <PlatformLegalPageShell meta={meta} headerIcon={<Shield className="h-8 w-8 text-blue-600" />} />
  );
}
