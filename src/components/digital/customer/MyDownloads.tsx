/**
 * MyDownloads - Historique des téléchargements du client
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Download,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Package,
  Key,
} from 'lucide-react';
import { useUserDownloads, DigitalDownload } from '@/hooks/digital/useDownloads';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';

interface DownloadWithRelations extends DigitalDownload {
  digital_product?: {
    id: string;
    product?: {
      id: string;
      name: string;
      image_url?: string | null;
    } | null;
  } | null;
}

export const MyDownloads = () => {
  const { data: downloads, isLoading, error } = useUserDownloads();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDownloads = (downloads as DownloadWithRelations[] | undefined)?.filter((download: DownloadWithRelations) => {
    const productName = download.digital_product?.product?.name || '';
    return productName.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement de votre historique. Veuillez réessayer plus tard.
        </AlertDescription>
      </Alert>
    );
  }

  if (!downloads || downloads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Download className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun téléchargement</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Vous n'avez pas encore téléchargé de produits. Vos téléchargements apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher dans l'historique</CardTitle>
          <CardDescription>
            Trouvez rapidement un téléchargement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom du produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{downloads.length}</div>
            <div className="text-sm text-muted-foreground">Téléchargements totaux</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {(downloads as DownloadWithRelations[]).filter((d: DownloadWithRelations) => d.download_success).length}
            </div>
            <div className="text-sm text-muted-foreground">Réussis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {(downloads as DownloadWithRelations[]).filter((d: DownloadWithRelations) => !d.download_success).length}
            </div>
            <div className="text-sm text-muted-foreground">Échoués</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {new Set((downloads as DownloadWithRelations[]).map((d: DownloadWithRelations) => d.digital_product?.product?.id).filter(Boolean)).size}
            </div>
            <div className="text-sm text-muted-foreground">Produits uniques</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des téléchargements */}
      <div className="space-y-4">
        {filteredDownloads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground">
                Aucun téléchargement ne correspond à votre recherche.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDownloads.map((download: DownloadWithRelations) => (
            <Card key={download.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className="flex-shrink-0">
                    {download.download_success ? (
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {download.digital_product?.product?.name || 'Produit supprimé'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {download.download_success ? (
                            <Badge variant="default" className="bg-green-500">
                              Réussi
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Échoué</Badge>
                          )}
                          {download.license_key && (
                            <Badge variant="outline">
                              <Key className="h-3 w-3 mr-1" />
                              Avec licence
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-muted-foreground">Date</div>
                          <div className="font-medium">
                            {format(new Date(download.download_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </div>
                        </div>
                      </div>
                      {download.download_ip && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-muted-foreground">IP</div>
                            <div className="font-medium font-mono text-xs">
                              {download.download_ip}
                            </div>
                          </div>
                        </div>
                      )}
                      {download.download_country && (
                        <div>
                          <div className="text-muted-foreground">Pays</div>
                          <div className="font-medium">{download.download_country}</div>
                        </div>
                      )}
                      {download.download_duration_seconds && (
                        <div>
                          <div className="text-muted-foreground">Durée</div>
                          <div className="font-medium">
                            {download.download_duration_seconds}s
                          </div>
                        </div>
                      )}
                    </div>

                    {download.file_version && (
                      <div className="text-sm text-muted-foreground">
                        Version du fichier : {download.file_version}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

