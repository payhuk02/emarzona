/**
 * Digital Product Updates Dashboard
 * Date: 28 Janvier 2025
 * 
 * Dashboard complet pour gérer les mises à jour de produits digitaux
 * Permet de créer, publier, et gérer les versions de produits
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Upload,
  Package,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Shield,
  Zap,
  FileText,
  Settings,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useDigitalProducts } from '@/hooks/digital/useDigitalProducts';
import { CreateUpdateDialog } from '@/components/digital/updates/CreateUpdateDialog';
import { UpdatesList } from '@/components/digital/updates/UpdatesList';
import { UpdateStats } from '@/components/digital/updates/UpdateStats';
import { logger } from '@/lib/logger';

export default function DigitalProductUpdatesDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { productId } = useParams<{ productId?: string }>();
  const { store } = useStore();
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(productId);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Récupérer les produits digitaux du store
  const { data: productsResponse, isLoading: isLoadingProducts } = useDigitalProducts(store?.id);

  // Extraire le tableau de produits (le hook peut retourner un objet paginé ou un tableau)
  const products = Array.isArray(productsResponse) 
    ? productsResponse 
    : (productsResponse?.data || []);

  // useDigitalProducts retourne déjà uniquement les produits digitaux
  // Pas besoin de filtrer, mais on s'assure que c'est bien un tableau
  const digitalProducts = Array.isArray(products) ? products : [];

  interface DigitalProductWithId {
    id: string;
    product_id?: string;
  }
  const selectedProduct = selectedProductId
    ? digitalProducts.find((p: DigitalProductWithId) => p.id === selectedProductId || p.product_id === selectedProductId)
    : null;

  if (isLoadingProducts) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <div className="space-y-8">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-96 w-full" />
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
          <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <SidebarTrigger className="shrink-0" />
                <div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/20">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {t('digitalUpdates.title')}
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-1">
                    {t('digitalUpdates.subtitle')}
                  </p>
                </div>
              </div>
              {selectedProduct && (
                <Button onClick={() => setShowCreateDialog(true)} className="gap-1.5 sm:gap-2 min-h-[44px] text-xs sm:text-sm w-full sm:w-auto">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('digitalUpdates.newUpdate')}</span>
                  <span className="sm:hidden">{t('digitalUpdates.newUpdateShort')}</span>
                </Button>
              )}
            </div>

            {/* Product Selector */}
            {!selectedProductId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {t('digitalUpdates.selectProduct')}
                  </CardTitle>
                  <CardDescription>
                    {t('digitalUpdates.selectProductDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {digitalProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-base sm:text-lg font-semibold mb-2">{t('digitalUpdates.noProducts')}</h3>
                      <p className="text-muted-foreground mb-4">
                        {t('digitalUpdates.noProductsDesc')}
                      </p>
                      <Button onClick={() => navigate('/digital/products/create')}>
                        {t('digitalUpdates.createProduct')}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {digitalProducts.map((product) => {
                        interface DigitalProductCard {
                          id: string;
                          name?: string;
                          image_url?: string;
                          description?: string;
                        }
                        const productCard = product as DigitalProductCard;
                        return (
                          <Card
                            key={productCard.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => setSelectedProductId(productCard.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                {product.product?.image_url && (
                                  <img
                                    src={product.product.image_url}
                                    alt={product.product.name}
                                    className="w-16 h-16 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex-1">
                                  <h3 className="font-semibold">{product.product?.name || t('digitalUpdates.productWithoutName')}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {t('digitalUpdates.currentVersion', { version: product.version || '1.0' })}
                                  </p>
                                  <Badge variant="outline" className="mt-2">
                                    {product.digital_type || 'other'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Updates Dashboard */}
            {selectedProduct && (
              <Tabs defaultValue="updates" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2">
                  <TabsTrigger value="updates" className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('digitalUpdates.tabs.updates')}</span>
                    <span className="sm:hidden">{t('digitalUpdates.tabs.updatesShort')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300">
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('digitalUpdates.tabs.stats')}</span>
                    <span className="sm:hidden">{t('digitalUpdates.tabs.statsShort')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300">
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('digitalUpdates.tabs.settings')}</span>
                    <span className="sm:hidden">{t('digitalUpdates.tabs.settingsShort')}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="updates" className="space-y-6">
                  {/* Product Info */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {selectedProduct.product?.image_url && (
                            <img
                              src={selectedProduct.product.image_url}
                              alt={selectedProduct.product.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <CardTitle>{selectedProduct.product?.name || 'Produit sans nom'}</CardTitle>
                            <CardDescription>
                              Version actuelle: {selectedProduct.version || '1.0'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setSelectedProductId(undefined)}
                          >
                            Changer de produit
                          </Button>
                          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nouvelle mise à jour
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Updates List */}
                  <UpdatesList
                    digitalProductId={selectedProduct.id}
                    currentVersion={selectedProduct.version || '1.0'}
                  />
                </TabsContent>

                <TabsContent value="stats" className="space-y-6">
                  <UpdateStats digitalProductId={selectedProduct.id} />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Paramètres de mise à jour</CardTitle>
                      <CardDescription>
                        Configurez les notifications et le comportement des mises à jour
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Notifications automatiques</h4>
                            <p className="text-sm text-muted-foreground">
                              Notifier automatiquement les clients lors de nouvelles mises à jour
                            </p>
                          </div>
                          <Badge variant={selectedProduct.update_notifications ? 'default' : 'secondary'}>
                            {selectedProduct.update_notifications ? 'Activé' : 'Désactivé'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Mises à jour forcées</h4>
                            <p className="text-sm text-muted-foreground">
                              Permettre de forcer les mises à jour critiques
                            </p>
                          </div>
                          <Badge variant="outline">Disponible</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            {/* Create Update Dialog */}
            {selectedProduct && (
              <CreateUpdateDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                digitalProductId={selectedProduct.id}
                currentVersion={selectedProduct.version || '1.0'}
                productName={selectedProduct.product?.name || 'Produit'}
              />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

