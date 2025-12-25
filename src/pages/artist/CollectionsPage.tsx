/**
 * Page Collections d'Œuvres d'Artiste
 * Affiche toutes les collections publiques d'une boutique
 * Date : 4 Février 2025
 */

import { useParams } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CollectionsGallery } from '@/components/artist/CollectionsGallery';
import { useStoreContext } from '@/contexts/StoreContext';
import { Package } from 'lucide-react';

const CollectionsPage = () => {
  const { storeSlug } = useParams<{ storeSlug?: string }>();
  const { selectedStore: store } = useStoreContext();

  // Utiliser le storeSlug de l'URL ou le store du contexte
  const targetStoreId = store?.id;

  if (!targetStoreId) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <div className="flex-1 p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Boutique non trouvée</p>
            </CardContent>
          </Card>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Collections d'Œuvres</h1>
            <p className="text-muted-foreground mt-2">
              Découvrez nos collections thématiques d'œuvres d'artiste
            </p>
          </div>

          <CollectionsGallery storeId={targetStoreId} showPrivate={false} />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default CollectionsPage;

