import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Package, 
  Upload, 
  Download, 
  Calendar, 
  Tag, 
  MoreVertical,
  Bell,
  Trash2,
  Eye,
  Edit,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  useProductVersions, 
  useDeleteVersion,
  useNotifyCustomers,
  type ProductVersion,
  type VersionStatus,
} from '@/hooks/digital/useProductVersions';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// TYPES
// ============================================================================

interface VersionManagementDashboardProps {
  productId: string;
  onCreateVersion?: () => void;
  onEditVersion?: (version: ProductVersion) => void;
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function VersionStatusBadge({ status }: { status: VersionStatus }) {
  const variants: Record<VersionStatus, { variant: any; label: string; icon: React.ReactNode }> = {
    draft: { 
      variant: 'secondary', 
      label: 'Brouillon',
      icon: <Edit className="h-3 w-3" />,
    },
    beta: { 
      variant: 'default', 
      label: 'Beta',
      icon: <Package className="h-3 w-3" />,
    },
    stable: { 
      variant: 'default', 
      label: 'Stable',
      icon: <Shield className="h-3 w-3" />,
    },
    deprecated: { 
      variant: 'destructive', 
      label: 'Obsolète',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VersionManagementDashboard({
  productId,
  onCreateVersion,
  onEditVersion,
}: VersionManagementDashboardProps) {
  const { data: versions, isLoading } = useProductVersions(productId);
  const { mutate: deleteVersion } = useDeleteVersion();
  const { mutate: notifyCustomers } = useNotifyCustomers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const stats = {
    total: versions?.length || 0,
    stable: versions?.filter(v => v.status === 'stable').length || 0,
    beta: versions?.filter(v => v.status === 'beta').length || 0,
    totalDownloads: versions?.reduce((sum, v) => sum + v.download_count, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versions Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versions Stables</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.stable}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Versions Beta</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.beta}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Téléchargements</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Versions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestion des Versions</CardTitle>
            <CardDescription>
              Gérez toutes les versions de votre produit digital
            </CardDescription>
          </div>
          {onCreateVersion && (
            <Button onClick={onCreateVersion} className="gap-2">
              <Upload className="h-4 w-4" />
              Nouvelle Version
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!versions || versions.length === 0 ? (
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
                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {version.version_number}
                          {version.is_major_update && (
                            <Badge variant="outline" className="text-xs">Major</Badge>
                          )}
                          {version.is_security_update && (
                            <Badge variant="destructive" className="text-xs">Sécurité</Badge>
                          )}
                        </div>
                        {version.version_name && (
                          <div className="text-sm text-muted-foreground">{version.version_name}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <VersionStatusBadge status={version.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {version.release_date 
                          ? format(new Date(version.release_date), 'PPP', { locale: fr })
                          : 'Non définie'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Download className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{version.download_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {version.file_size_mb ? `${version.file_size_mb.toFixed(2)} MB` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditVersion?.(version)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          {version.notify_customers && !version.notification_sent_at && (
                            <DropdownMenuItem 
                              onClick={() => notifyCustomers({ versionId: version.id, productId: version.product_id })}
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              Notifier clients
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              if (confirm('Supprimer cette version ?')) {
                                deleteVersion(version.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

