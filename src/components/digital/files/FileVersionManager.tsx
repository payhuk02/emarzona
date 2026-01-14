/**
 * FileVersionManager - Gestionnaire de versions de fichiers
 * Date: 2025-01-27
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  History,
  Plus,
  MoreVertical,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Tag,
  Clock,
} from 'lucide-react';
import {
  useFileVersions,
  useCreateFileVersion,
  FileVersion,
} from '@/hooks/digital/useAdvancedFileManagement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileVersionForm } from './FileVersionForm';

interface FileVersionManagerProps {
  fileId: string;
  fileName: string;
}

export const FileVersionManager = ({ fileId, fileName }: FileVersionManagerProps) => {
  const { data: versions, isLoading, error } = useFileVersions(fileId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des versions. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Versions de {fileName}
              </CardTitle>
              <CardDescription>
                Gérez l'historique des versions de ce fichier
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle version
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle version</DialogTitle>
                  <DialogDescription>
                    Ajoutez une nouvelle version de ce fichier
                  </DialogDescription>
                </DialogHeader>
                <FileVersionForm
                  fileId={fileId}
                  onSuccess={() => setIsCreateDialogOpen(false)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!versions || versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune version</h3>
              <p className="text-muted-foreground mb-4">
                Créez votre première version pour commencer l'historique
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une version
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Téléchargements</TableHead>
                  <TableHead>Date de sortie</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      {version.version_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>{version.version_label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {version.is_stable && (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Stable
                          </Badge>
                        )}
                        {version.is_beta && (
                          <Badge variant="secondary">Beta</Badge>
                        )}
                        {version.is_alpha && (
                          <Badge variant="outline">Alpha</Badge>
                        )}
                        {version.deprecated_at && (
                          <Badge variant="destructive">Déprécié</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{version.file_size_mb.toFixed(2)} MB</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <span>{version.download_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(version.released_at), 'dd/MM/yyyy', {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select>
                        <SelectTrigger
                          <Button variant="ghost" size="icon" aria-label={`Actions pour la version ${version.version_number || version.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </SelectTrigger>
                        <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <SelectItem value="edit" onSelect
                            onSelect={() => window.open(version.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </SelectItem>
                          <SelectItem value="delete" onSelect
                            onSelect={() => setSelectedVersion(version)}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Voir les détails
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détails de version */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto
            pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]
            overscroll-contain -webkit-overflow-scrolling-touch">
            <DialogHeader>
              <DialogTitle>
                Version {selectedVersion.version_number} - {selectedVersion.version_label}
              </DialogTitle>
              <DialogDescription>
                Détails et notes de version
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Taille</div>
                  <div className="font-medium">{selectedVersion.file_size_mb.toFixed(2)} MB</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Téléchargements</div>
                  <div className="font-medium">{selectedVersion.download_count}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Date de sortie</div>
                  <div className="font-medium">
                    {format(new Date(selectedVersion.released_at), 'dd/MM/yyyy à HH:mm', {
                      locale: fr,
                    })}
                  </div>
                </div>
                {selectedVersion.deprecated_at && (
                  <div>
                    <div className="text-sm text-muted-foreground">Déprécié le</div>
                    <div className="font-medium text-red-600">
                      {format(new Date(selectedVersion.deprecated_at), 'dd/MM/yyyy', {
                        locale: fr,
                      })}
                    </div>
                  </div>
                )}
              </div>

              {selectedVersion.changelog && (
                <div>
                  <div className="text-sm font-semibold mb-2">Changelog</div>
                  <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {selectedVersion.changelog}
                  </div>
                </div>
              )}

              {selectedVersion.release_notes && (
                <div>
                  <div className="text-sm font-semibold mb-2">Notes de version</div>
                  <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap">
                    {selectedVersion.release_notes}
                  </div>
                </div>
              )}

              {selectedVersion.checksum_sha256 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Checksum SHA-256</div>
                  <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all">
                    {selectedVersion.checksum_sha256}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};







