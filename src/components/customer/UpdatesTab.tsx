/**
 * Updates Tab Component
 * Date: 27 Janvier 2025
 * 
 * Onglet pour afficher les mises à jour disponibles
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCustomerProductUpdates, useCustomerProductVersions } from '@/hooks/digital/useProductUpdates';
import { Download, AlertCircle, Package, Sparkles, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const UpdatesTab = () => {
  const { data: updates, isLoading: updatesLoading } = useCustomerProductUpdates();
  const { data: versions, isLoading: versionsLoading } = useCustomerProductVersions();
  const { toast } = useToast();

  const isLoading = updatesLoading || versionsLoading;

  const handleDownloadUpdate = (fileUrl: string, productName: string) => {
    window.open(fileUrl, '_blank');
    toast({
      title: '✅ Téléchargement démarré',
      description: `La mise à jour de ${productName} a commencé`,
    });
  };

  const handleDownloadVersion = (downloadUrl: string, productName: string) => {
    window.open(downloadUrl, '_blank');
    toast({
      title: '✅ Téléchargement démarré',
      description: `La version de ${productName} a commencé`,
    });
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

  const hasUpdates = (updates && updates.length > 0) || (versions && versions.length > 0);

  if (!hasUpdates) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucune mise à jour</h3>
          <p className="text-muted-foreground">
            Tous vos produits digitaux sont à jour
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="updates" className="space-y-4">
      <TabsList>
        <TabsTrigger value="updates">
          Mises à jour ({updates?.length || 0})
        </TabsTrigger>
        <TabsTrigger value="versions">
          Versions ({versions?.length || 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="updates" className="space-y-4">
        {updates && updates.length > 0 ? (
          updates.map((update) => (
            <Card key={update.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {update.digital_product?.product?.image_url && (
                      <img
                        src={update.digital_product.product.image_url}
                        alt={update.digital_product.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {update.digital_product?.product?.name || 'Produit inconnu'}
                        {update.is_forced && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Obligatoire
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{update.version}</Badge>
                          <Badge variant="secondary">{update.release_type}</Badge>
                          <span className="text-xs">
                            {format(new Date(update.release_date), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{update.title}</h4>
                  {update.description && (
                    <p className="text-sm text-muted-foreground mb-2">{update.description}</p>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{update.changelog}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {update.file_size_mb && `${update.file_size_mb.toFixed(1)} MB`}
                  </div>
                  <Button
                    onClick={() =>
                      handleDownloadUpdate(
                        update.file_url,
                        update.digital_product?.product?.name || 'Produit'
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger la mise à jour
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              Aucune mise à jour disponible
            </div>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="versions" className="space-y-4">
        {versions && versions.length > 0 ? (
          versions.map((version) => (
            <Card key={version.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {version.product?.image_url && (
                      <img
                        src={version.product.image_url}
                        alt={version.product.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {version.product?.name || 'Produit inconnu'}
                        <Badge
                          variant={
                            version.status === 'stable'
                              ? 'default'
                              : version.status === 'beta'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {version.status === 'beta' && <Sparkles className="h-3 w-3 mr-1" />}
                          {version.status === 'stable' && <Shield className="h-3 w-3 mr-1" />}
                          {version.status}
                        </Badge>
                        {version.is_security_update && (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Sécurité
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{version.version_number}</Badge>
                          {version.version_name && (
                            <span className="text-sm">{version.version_name}</span>
                          )}
                          {version.release_date && (
                            <span className="text-xs">
                              {format(new Date(version.release_date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {version.changelog_title && (
                  <div>
                    <h4 className="font-semibold mb-2">{version.changelog_title}</h4>
                    {version.changelog_markdown && (
                      <div className="text-sm whitespace-pre-wrap">{version.changelog_markdown}</div>
                    )}
                  </div>
                )}
                {version.whats_new && version.whats_new.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-1">Nouveautés</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {version.whats_new.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {version.bug_fixes && version.bug_fixes.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-sm mb-1">Corrections</h5>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {version.bug_fixes.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {version.file_size_mb && `${version.file_size_mb.toFixed(1)} MB`}
                  </div>
                  <Button
                    onClick={() =>
                      handleDownloadVersion(
                        version.download_url,
                        version.product?.name || 'Produit'
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              Aucune version disponible
            </div>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
};

