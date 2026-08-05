/**
 * Downloads Tab Component
 * Date: 27 Janvier 2025
 *
 * Onglet hub : produits digitaux achetés avec tous les fichiers téléchargeables.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerPurchasedProducts } from '@/hooks/digital/useCustomerPurchasedProducts';
import { useCustomerDigitalDownload } from '@/hooks/digital/useCustomerDigitalDownload';
import { getCustomerDigitalFileLabel } from '@/lib/digital/customer-file-label';
import { Download, Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export const DownloadsTab = () => {
  const { data: products, isLoading } = useCustomerPurchasedProducts();
  const { downloadFile, downloadingFileId } = useCustomerDigitalDownload();
  const { toast } = useToast();

  const activeProducts = products?.filter(p => p.status === 'active') ?? [];

  const handleDownload = async (
    fileId: string,
    fileUrl: string | undefined,
    productName: string,
    digitalProductId: string,
    licenseKey?: string | null
  ) => {
    try {
      const openResult = await downloadFile({
        fileId,
        fileUrl,
        digitalProductId,
        licenseKey: licenseKey ?? undefined,
      });

      toast({
        title: openResult.mode === 'external' ? 'Accès ouvert' : 'Téléchargement démarré',
        description:
          openResult.mode === 'external'
            ? `${productName} s'ouvre dans un nouvel onglet.`
            : `Le téléchargement de ${productName} a commencé.`,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Impossible de générer le lien de téléchargement';
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
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

  if (activeProducts.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun téléchargement disponible</h3>
          <p className="text-muted-foreground">
            Vous n&apos;avez pas encore de produits digitaux actifs à télécharger.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeProducts.map(product => (
        <Card key={product.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start gap-4">
              {product.product_image_url && (
                <img
                  src={product.product_image_url}
                  alt={product.product_name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <CardTitle>{product.product_name}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Acheté le {format(new Date(product.order_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                  <Badge variant="secondary">
                    {product.download_count} téléchargement
                    {product.download_count !== 1 ? 's' : ''}
                  </Badge>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(product.files?.length ?? 0) > 1 && (
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Vos fichiers ({product.files?.length})
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {product.files && product.files.length > 0 ? (
                  product.files.map((file, idx) => (
                    <Button
                      key={file.id}
                      size="sm"
                      disabled={downloadingFileId === file.id}
                      onClick={() =>
                        handleDownload(
                          file.id,
                          file.file_url,
                          product.product_name,
                          product.digital_product_id,
                          product.license_key
                        )
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingFileId === file.id
                        ? 'Ouverture…'
                        : getCustomerDigitalFileLabel(file.name, idx)}
                    </Button>
                  ))
                ) : product.main_file_id ? (
                  <Button
                    size="sm"
                    disabled={downloadingFileId === product.main_file_id}
                    onClick={() =>
                      handleDownload(
                        product.main_file_id!,
                        product.main_file_url,
                        product.product_name,
                        product.digital_product_id,
                        product.license_key
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingFileId === product.main_file_id
                      ? 'Ouverture…'
                      : getCustomerDigitalFileLabel(product.files?.[0]?.name, 0)}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
