/**
 * Page: Politique des Cookies / Cookie Policy
 */

import { Cookie } from 'lucide-react';
import { PlatformLegalPageShell } from '@/components/legal/PlatformLegalPageShell';
import { getPlatformLegalPageByType } from '@/lib/admin/platformLegalPagesConfig';

const meta = getPlatformLegalPageByType('cookies');

export default function CookiePolicy() {
  if (!meta) return null;

  return (
    <PlatformLegalPageShell meta={meta} headerIcon={<Cookie className="h-8 w-8 text-blue-600" />} />
  );
}
