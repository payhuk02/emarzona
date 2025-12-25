/**
 * Email Tags Management Page
 * Page complète pour la gestion des tags email
 * Date: 2 Février 2025
 */

import { EmailTagsDashboard } from '@/components/email/EmailTagsDashboard';
import { useStoreContext } from '@/contexts/StoreContext';
import { MainLayout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';

export default function EmailTagsManagementPage() {
  const { selectedStore } = useStoreContext();

  if (!selectedStore) {
    return (
      <MainLayout layoutType="emails">
        <div className="container mx-auto p-3 sm:p-4 lg:p-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <p className="text-muted-foreground">Veuillez sélectionner un store</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout layoutType="emails">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        <EmailTagsDashboard storeId={selectedStore.id} />
      </div>
    </MainLayout>
  );
}

