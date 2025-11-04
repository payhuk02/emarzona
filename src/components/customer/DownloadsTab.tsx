/**
 * Downloads Tab Component
 * Date: 27 Janvier 2025
 * 
 * Onglet pour afficher les téléchargements disponibles
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserDownloads, useGenerateDownloadLink } from '@/hooks/digital/useDownloads';
import { Download, FileText, Calendar, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export const DownloadsTab = () => {
  const { data: downloads, isLoading } = useUserDownloads();
  const generateLink = useGenerateDownloadLink();
  const { toast } = useToast();

  const handleDownload = async (fileId: string, productName: string) => {
    try {
      const result = await generateLink.mutateAsync({
        fileId,
        expiresIn: 3600, // 1 heure
      });

      if (result?.download_url) {
        // Ouvrir le lien de téléchargement
        window.open(result.download_url, '_blank');
        toast({
          title: '✅ Téléchargement démarré',
          description: `Le téléchargement de ${productName} a commencé`,
        });
      } else {
        throw new Error('URL de téléchargement non disponible');
      }
    } catch (error: any) {
      logger.error('Error generating download link', { error, fileId });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer le lien de téléchargement',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
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
            Vous n'avez pas encore de produits digitaux téléchargeables
          </p>
        </div>
      </Card>
    );
  }

  // Grouper par produit
  const downloadsByProduct = downloads.reduce((acc: any, download: any) => {
    const productId = download.digital_product?.product?.id || 'unknown';
    if (!acc[productId]) {
      acc[productId] = {
        product: download.digital_product?.product,
        downloads: [],
      };
    }
    acc[productId].downloads.push(download);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.values(downloadsByProduct).map((group: any) => (
        <Card key={group.product?.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {group.product?.image_url && (
                  <img
                    src={group.product.image_url}
                    alt={group.product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <CardTitle>{group.product?.name || 'Produit inconnu'}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(group.downloads[0].download_date), 'dd MMM yyyy', { locale: fr })}
                    </span>
                    <Badge variant={group.downloads[0].download_success ? 'default' : 'destructive'}>
                      {group.downloads[0].download_success ? (
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
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {group.downloads.length} téléchargement{group.downloads.length > 1 ? 's' : ''}
              </div>
              {group.downloads[0].file_id && (
                <Button
                  onClick={() => handleDownload(group.downloads[0].file_id, group.product?.name)}
                  disabled={generateLink.isPending}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generateLink.isPending ? 'Génération...' : 'Télécharger à nouveau'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

