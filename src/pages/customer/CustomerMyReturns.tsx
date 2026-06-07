/**
 * Page CustomerMyReturns - Mes retours (Standalone Page)
 * Date: 2 Février 2025
 *
 * Page standalone pour la route /account/returns
 * Utilise ReturnsTab avec le layout approprié
 */

import { ReturnsTab } from '@/components/customer/ReturnsTab';
import { AppPageShell } from '@/components/layout/AppPageShell';

export default function CustomerMyReturns() {
  return (
    <AppPageShell>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <ReturnsTab />
      </div>
    </AppPageShell>
  );
}
