/**
 * Digital Product Versions Management Page
 * Date: 1 Février 2025
 * 
 * Page complète de gestion des versions pour produits digitaux (vendeurs)
 * Avec upload de fichiers intégré
 */

import { useParams, useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Download, Edit, Trash2, CheckCircle2, AlertCircle, Package, MoreVertical } from 'lucide-react';
import {
  useDigitalProductVersionHistory,
  useCurrentDigitalProductVersion,
  useCreateDigitalProductVersion,
  useUpdateDigitalProductVersion,
  useDeleteDigitalProductVersion,
} from '@/hooks/digital/useDigitalProductVersions';
import { useDigitalProduct } from '@/hooks/digital/useDigitalProducts';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateVersionDialog } from '@/components/digital/CreateVersionDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export default function DigitalProductVersionsManagement() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);

  const { data: product, isLoading: productLoading } = useDigitalProduct(productId || '');
  const { data: currentVersion, isLoading: currentVersionLoading } = useCurrentDigitalProductVersion(productId || '');
  const { data: versionHistory = [], isLoading: historyLoading } = useDigitalProductVersionHistory(productId || '', 50);
  const deleteVersion = useDeleteDigitalProductVersion();

  const handleDeleteVersion = async (versionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette version ?')) return;

    try {
      await deleteVersion.mutateAsync({ id: versionId, productId: productId || '' });
      toast({
        title: 'Version supprimée',
        description: 'La version a été supprimée avec succès',
      });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de supprimer la version',
        variant: 'destructive',
      });
    }
  };

  if (productLoading || currentVersionLoading || historyLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6 space-y-6">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!product) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 md:p-6">
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Produit introuvable</h3>
                  <p className="text-muted-foreground mb-4">
                    Le produit demandé n'existe pas ou vous n'avez pas les permissions nécessaires.
                  </p>
                  <Button onSelect={() => navigate('/dashboard/products')}>
                    Retour aux produits
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onSelect={() => navigate(-1)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold">
                  Gestion des Versions
                </h1>
                <p className="text-muted-foreground">
                  {product.name || 'Produit'}
                </p>
              </div>
              <Button onSelect={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Version
              </Button>
            </div>

            {/* Current Version */}
            {currentVersion && (
              <Card className="border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Version Actuelle
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {currentVersion.version_name || `Version ${currentVersion.version_number}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Publiée le</p>
                      <p className="font-medium">
                        {format(new Date(currentVersion.released_at), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentVersion.release_notes && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Notes de version</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {currentVersion.release_notes}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Téléchargements: </span>
                      <span className="font-medium">{currentVersion.download_count}</span>
                    </div>
                    {currentVersion.file_size_bytes && (
                      <div>
                        <span className="text-muted-foreground">Taille: </span>
                        <span className="font-medium">
                          {(currentVersion.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                    {currentVersion.files && currentVersion.files.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Fichiers: </span>
                        <span className="font-medium">{currentVersion.files.length}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des Versions</CardTitle>
                <CardDescription>
                  Toutes les versions publiées de ce produit
                </CardDescription>
              </CardHeader>
              <CardContent>
                {versionHistory.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Aucune version</p>
                    <p className="text-sm">Créez votre première version pour commencer</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date de sortie</TableHead>
                        <TableHead>Téléchargements</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versionHistory.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell>
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                Version {version.version_number}
                                {version.is_current && (
                                  <Badge variant="default">Actuelle</Badge>
                                )}
                                {version.is_beta && <Badge variant="secondary">Beta</Badge>}
                                {version.is_deprecated && (
                                  <Badge variant="destructive">Dépréciée</Badge>
                                )}
                              </div>
                              {version.version_name && (
                                <p className="text-sm text-muted-foreground">
                                  {version.version_name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {version.is_current ? (
                              <Badge variant="default">Active</Badge>
                            ) : version.is_beta ? (
                              <Badge variant="secondary">Beta</Badge>
                            ) : version.is_deprecated ? (
                              <Badge variant="destructive">Dépréciée</Badge>
                            ) : (
                              <Badge variant="outline">Ancienne</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(version.released_at), 'd MMM yyyy à HH:mm', {
                              locale: fr,
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Download className="h-3 w-3 text-muted-foreground" />
                              <span>{version.download_count}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {version.file_size_bytes
                              ? `${(version.file_size_bytes / 1024 / 1024).toFixed(2)} MB`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Select>
                              <SelectTrigger
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </SelectTrigger>
                              <SelectContent mobileVariant="sheet" className="min-w-[200px]">
                                <SelectItem value="edit" onSelect onSelect={() => setEditingVersion(version.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </SelectItem>
                                <DropdownMenuSeparator />
                                <SelectItem value="delete" onSelect
                                  className="text-destructive"
                                  onSelect={() => handleDeleteVersion(version.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
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

            {/* Create Version Dialog */}
            {product.digital_product_id && (
              <CreateVersionDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                digitalProductId={product.digital_product_id}
                productId={productId || ''}
                onSuccess={() => {
                  // Refresh will happen automatically via React Query
                }}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







