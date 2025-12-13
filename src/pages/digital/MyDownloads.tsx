/**
 * My Downloads Page - Customer View
 * Date: 27 octobre 2025
 * 
 * Page pour que les clients voient leurs téléchargements
 */

import { useState } from 'react';
import { useUserDownloads, type DigitalDownload } from '@/hooks/digital/useDownloads';

// Type pour les téléchargements avec relations depuis Supabase
type DownloadWithRelations = DigitalDownload & {
  digital_product?: {
    id: string;
    product?: {
      id: string;
      name: string;
      image_url?: string;
    };
  };
};
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
  const filteredDownloads = downloads?.filter((d: DownloadWithRelations) => {
    const productName = d.digital_product?.product?.name || '';
    return productName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  /**
   * Group downloads by status
   */
  const successfulDownloads = filteredDownloads?.filter((d: DownloadWithRelations) => d.download_success);
  const failedDownloads = filteredDownloads?.filter((d: DownloadWithRelations) => !d.download_success);

  /**
   * Calculate stats
   */
  const stats = {
    total: downloads?.length || 0,
    successful: successfulDownloads?.length || 0,
    failed: failedDownloads?.length || 0,
    products: new Set(downloads?.map((d: DownloadWithRelations) => d.digital_product_id)).size,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">Mes Téléchargements</h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-0.5 sm:mt-1">
                Accédez à tous vos fichiers téléchargés
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">Total</CardTitle>
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">{stats.total}</div>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                    Téléchargements
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">Réussis</CardTitle>
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600">
                    {stats.successful}
                  </div>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                    {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% de succès
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">Échoués</CardTitle>
                  <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-red-600">
                    {stats.failed}
                  </div>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                    À réessayer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">Produits</CardTitle>
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{stats.products}</div>
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                    Produits différents
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card>
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">Rechercher</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="relative">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un téléchargement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 sm:pl-10 text-xs sm:text-sm min-h-[44px]"
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
const DownloadsList = ({ downloads, loading }: { downloads: DownloadWithRelations[]; loading: boolean }) => {
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
      <Card className="p-8 sm:p-10 md:p-12">
        <div className="text-center">
          <Download className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1.5 sm:mb-2">Aucun téléchargement</h3>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Vos téléchargements apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {downloads.map((download: DownloadWithRelations) => (
        <Card key={download.id} className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-start justify-between gap-2 sm:gap-3 md:gap-4">
              {/* Product Info */}
              <div className="flex items-start gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                {download.digital_product?.product?.image_url && (
                  <img
                    src={download.digital_product.product.image_url}
                    alt={download.digital_product.product.name}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded object-cover flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm md:text-base lg:text-lg truncate">
                    {download.digital_product?.product?.name || 'Produit inconnu'}
                  </h3>
                  
                  <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 mt-1.5 sm:mt-2 flex-wrap">
                    <Badge variant={download.download_success ? 'default' : 'destructive'} className="text-[9px] sm:text-[10px] md:text-xs">
                      {download.download_success ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          Réussi
                        </>
                      ) : (
                        <>
                          <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                          Échoué
                        </>
                      )}
                    </Badge>
                    
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                      <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {format(new Date(download.download_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </span>

                    {download.download_duration_seconds && (
                      <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {download.download_duration_seconds}s
                      </span>
                    )}
                  </div>

                  {download.file_version && (
                    <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      Version: {download.file_version}
                    </p>
                  )}

                  {download.error_message && (
                    <p className="text-[10px] sm:text-xs md:text-sm text-red-600 mt-0.5 sm:mt-1">
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


