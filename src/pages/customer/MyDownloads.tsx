/**
 * Page My Downloads - Mes Téléchargements (Customer Portal)
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Liste tous téléchargements produits digitaux
 * - Statistiques téléchargements
 * - Filtres par statut (réussi/échoué)
 * - Recherche par produit
 * - Bouton re-télécharger
 * - Historique complet
 */

import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  FileText,
  Package,
  RefreshCw,
} from 'lucide-react';
import { useUserDownloads } from '@/hooks/digital/useDownloads';
import { DigitalDownloadButton } from '@/components/digital';

export default function MyDownloads() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch downloads using existing hook
  const { data: downloads, isLoading } = useUserDownloads();

  // Filter downloads
  const filteredDownloads = downloads?.filter((d: any) => {
    const productName = d.digital_product?.product?.name || '';
    const matchesSearch = productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'success' && d.download_success) ||
      (statusFilter === 'failed' && !d.download_success);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: downloads?.length || 0,
    successful: downloads?.filter((d: any) => d.download_success).length || 0,
    failed: downloads?.filter((d: any) => !d.download_success).length || 0,
    uniqueProducts: new Set(downloads?.map((d: any) => d.digital_product_id)).size || 0,
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/account')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Download className="h-8 w-8" />
                    Mes Téléchargements
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  Accédez à tous vos produits digitaux achetés
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Téléchargements</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Depuis le début</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Réussis</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
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
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <p className="text-xs text-muted-foreground">À réessayer</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Produits Uniques</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.uniqueProducts}</div>
                  <p className="text-xs text-muted-foreground">Produits différents</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="success">Réussis</TabsTrigger>
                      <TabsTrigger value="failed">Échoués</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Downloads List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {filteredDownloads?.length || 0} {filteredDownloads?.length === 1 ? 'téléchargement' : 'téléchargements'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!filteredDownloads || filteredDownloads.length === 0 ? (
                  <div className="text-center py-12">
                    <Download className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun téléchargement</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Aucun téléchargement ne correspond à vos critères'
                        : 'Vous n\'avez pas encore téléchargé de produits digitaux'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button onClick={() => navigate('/marketplace')}>
                        Découvrir les produits digitaux
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDownloads.map((download: any) => (
                      <Card key={download.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            {/* Product Info */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              {download.digital_product?.product?.image_url && (
                                <img
                                  src={download.digital_product.product.image_url}
                                  alt={download.digital_product?.product?.name || 'Produit'}
                                  className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border"
                                />
                              )}
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-2">
                                  {download.digital_product?.product?.name || 'Produit inconnu'}
                                </h3>
                                
                                <div className="flex items-center gap-3 flex-wrap">
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
                                    <Calendar className="h-4 w-4" />
                                    {new Date(download.download_date).toLocaleDateString('fr-FR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>

                                  {download.download_duration_seconds && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {download.download_duration_seconds}s
                                    </span>
                                  )}

                                  {download.file_version && (
                                    <Badge variant="outline">
                                      Version {download.file_version}
                                    </Badge>
                                  )}
                                </div>

                                {download.error_message && (
                                  <p className="text-sm text-red-600 mt-2">
                                    ❌ Erreur: {download.error_message}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex-shrink-0">
                              {download.digital_product_id && (
                                <DigitalDownloadButton
                                  digitalProductId={download.digital_product_id}
                                  fileId={download.file_id}
                                  fileName={download.digital_product?.product?.name || 'Fichier'}
                                  fileSize={0}
                                  variant="default"
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
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

