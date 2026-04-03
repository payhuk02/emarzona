/**
 * Product Version History Component
 * Date: 1 Février 2025
 * 
 * Composant pour afficher l'historique des versions d'un produit digital
 */

import { useDigitalProductVersionHistory, useCurrentDigitalProductVersion } from '@/hooks/digital/useDigitalProductVersions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProductVersionHistoryProps {
  productId: string;
  productName: string;
  onVersionSelect?: (versionId: string) => void;
}

export const ProductVersionHistory = ({
  productId,
  productName,
  onVersionSelect,
}: ProductVersionHistoryProps) => {
  const { data: currentVersion, isLoading: isLoadingCurrent } = useCurrentDigitalProductVersion(productId);
  const { data: versionHistory, isLoading: isLoadingHistory } = useDigitalProductVersionHistory(productId, 20);

  if (isLoadingCurrent || isLoadingHistory) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentVersion && (!versionHistory || versionHistory.length === 0)) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune version disponible pour ce produit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historique des Versions
        </CardTitle>
        <CardDescription>
          Consultez toutes les versions disponibles de {productName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList>
            <TabsTrigger value="current">Version Actuelle</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          {/* Version Actuelle */}
          <TabsContent value="current" className="mt-4">
            {currentVersion ? (
              <VersionCard
                version={currentVersion}
                isCurrent={true}
                onSelect={onVersionSelect}
              />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucune version courante disponible.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Historique */}
          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {versionHistory && versionHistory.length > 0 ? (
                  versionHistory.map((version) => (
                    <VersionCard
                      key={version.id}
                      version={version}
                      isCurrent={version.is_current}
                      onSelect={onVersionSelect}
                    />
                  ))
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucune version dans l'historique.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface VersionCardProps {
  version: {
    id: string;
    version_number: string;
    version_name?: string;
    release_notes?: string;
    changelog?: Array<{ type: string; description: string }>;
    released_at: string;
    is_current: boolean;
    is_beta: boolean;
    is_deprecated: boolean;
    download_count: number;
  };
  isCurrent: boolean;
  onSelect?: (versionId: string) => void;
}

const VersionCard = ({ version, isCurrent, onSelect }: VersionCardProps) => {
  const getChangelogTypeColor = (type: string) => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'fixed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'changed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'removed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className={isCurrent ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">
                {version.version_name || `Version ${version.version_number}`}
              </CardTitle>
              {isCurrent && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Actuelle
                </Badge>
              )}
              {version.is_beta && (
                <Badge variant="secondary">Beta</Badge>
              )}
              {version.is_deprecated && (
                <Badge variant="destructive">Dépréciée</Badge>
              )}
            </div>
            <CardDescription>
              Version {version.version_number} • Publiée le{' '}
              {format(new Date(version.released_at), 'd MMMM yyyy', { locale: fr })}
            </CardDescription>
          </div>
          {onSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(version.id)}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Release Notes */}
        {version.release_notes && (
          <div>
            <h4 className="font-semibold mb-2">Notes de version</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {version.release_notes}
            </p>
          </div>
        )}

        {/* Changelog */}
        {version.changelog && version.changelog.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Changements</h4>
            <ul className="space-y-1">
              {version.changelog.map((change, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={getChangelogTypeColor(change.type)}
                  >
                    {change.type}
                  </Badge>
                  <span className="text-muted-foreground">{change.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>{version.download_count} téléchargements</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(version.released_at), 'HH:mm', { locale: fr })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};







