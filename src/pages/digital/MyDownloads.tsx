/**
 * My Downloads Page - Customer View
 * Date: 27 octobre 2025
 * 
 * Page pour que les clients voient leurs téléchargements
 */

import { useState } from 'react';
import { useUserDownloads } from '@/hooks/digital/useDownloads';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Search,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { DigitalDownloadButton } from '@/components/digital';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const MyDownloads = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: downloads, isLoading } = useUserDownloads();

  /**
   * Filter downloads
   */
  const filteredDownloads = downloads?.filter((d: any) => {
    const productName = d.digital_product?.product?.name || '';
    return productName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /**
   * Group downloads by status
   */
  const successfulDownloads = filteredDownloads?.filter((d: any) => d.download_success);
  const failedDownloads = filteredDownloads?.filter((d: any) => !d.download_success);

  /**
   * Calculate stats
   */
  const stats = {
    total: downloads?.length || 0,
    successful: successfulDownloads?.length || 0,
    failed: failedDownloads?.length || 0,
    products: new Set(downloads?.map((d: any) => d.digital_product_id)).size,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold">Mes Téléchargements</h1>
              <p className="text-muted-foreground mt-1">
                Accédez à tous vos fichiers téléchargés
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Téléchargements
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Réussis</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.successful}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% de succès
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Échoués</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {stats.failed}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    À réessayer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.products}</div>
                  <p className="text-xs text-muted-foreground">
                    Produits différents
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rechercher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un téléchargement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Downloads List */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">
                  Tous ({filteredDownloads?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="successful">
                  Réussis ({successfulDownloads?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Échoués ({failedDownloads?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <DownloadsList downloads={filteredDownloads} loading={isLoading} />
              </TabsContent>

              <TabsContent value="successful" className="mt-6">
                <DownloadsList downloads={successfulDownloads} loading={isLoading} />
              </TabsContent>

              <TabsContent value="failed" className="mt-6">
                <DownloadsList downloads={failedDownloads} loading={isLoading} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

/**
 * Downloads List Component
 */
const DownloadsList = ({ downloads, loading }: { downloads: any[]; loading: boolean }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!downloads || downloads.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun téléchargement</h3>
          <p className="text-muted-foreground">
            Vos téléchargements apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {downloads.map((download: any) => (
        <Card key={download.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              {/* Product Info */}
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {download.digital_product?.product?.image_url && (
                  <img
                    src={download.digital_product.product.image_url}
                    alt={download.digital_product.product.name}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {download.digital_product?.product?.name || 'Produit inconnu'}
                  </h3>
                  
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge variant={download.download_success ? 'default' : 'destructive'}>
                      {download.download_success ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Réussi
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Échoué
                        </>
                      )}
                    </Badge>
                    
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(download.download_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </span>

                    {download.download_duration_seconds && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {download.download_duration_seconds}s
                      </span>
                    )}
                  </div>

                  {download.file_version && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Version: {download.file_version}
                    </p>
                  )}

                  {download.error_message && (
                    <p className="text-sm text-red-600 mt-1">
                      Erreur: {download.error_message}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex-shrink-0">
                {download.file_id && (
                  <DigitalDownloadButton
                    digitalProductId={download.digital_product_id}
                    fileId={download.file_id}
                    fileName="Fichier"
                    fileSize={0}
                    variant="outline"
                    size="sm"
                    showRemainingDownloads={false}
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyDownloads;


