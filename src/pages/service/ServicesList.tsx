import { useState } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import {
  filterServicesBySearch,
  useServiceProducts,
  useDeleteServiceProduct,
  type ServiceProduct,
} from '@/hooks/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Clock, Grid3X3, List, Plus, Search } from 'lucide-react';
import { ServicesGrid } from '@/components/service';
import { useToast } from '@/hooks/use-toast';
import { ProductManagementActions } from '@/components/products/ProductManagementActions';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateCatalogCaches } from '@/lib/cache-invalidation';
import { cn } from '@/lib/utils';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { formatServiceCategoryLabel } from '@/lib/services/service-categories';
import { ServiceListingAttributeBadges } from '@/components/service/ServiceListingAttributeBadges';
import { ServicePriceDisplay } from '@/components/service/ServicePriceDisplay';
import { resolveServiceDisplayPrice } from '@/lib/service/service-pricing';

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function locationLabel(type: string) {
  if (type === 'on_site') return 'Sur place';
  if (type === 'online') return 'En ligne';
  if (type === 'customer_location') return 'À domicile';
  return 'Flexible';
}

export const ServicesList = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const { data: services, isLoading, isError } = useServiceProducts(store?.id);
  const { data: categoryRows = [] } = useServiceCategories();
  const deleteService = useDeleteServiceProduct();

  const filteredServices = filterServicesBySearch(services, searchQuery);

  const handleDelete = async () => {
    if (!deleteServiceId) return;

    try {
      await deleteService.mutateAsync(deleteServiceId);
      toast({
        title: 'Service supprimé',
        description: 'Le service a été supprimé avec succès',
      });
      setDeleteServiceId(null);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le service',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (productId: string, nextActive: boolean) => {
    const { error } = await supabase
      .from('products')
      .update(nextActive ? { is_active: true, is_draft: false } : { is_active: false })
      .eq('id', productId);
    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['service-products'] });
    invalidateCatalogCaches(queryClient);
  };

  const serviceActions = (service: ServiceProduct) => (
    <ProductManagementActions
      product={{
        id: service.product_id,
        slug: service.product?.slug || service.product_id,
        name: service.product?.name,
        is_active: Boolean(service.product?.is_active),
        product_type: 'service',
      }}
      storeSlug={store?.slug}
      storeSubdomain={store?.subdomain}
      onEdit={id => navigate(`/dashboard/products/${id}/edit`)}
      onDelete={() => setDeleteServiceId(service.id)}
      onDuplicate={id => navigate(`/dashboard/products/new/service?duplicate=${id}`)}
      onToggleStatus={handleToggleStatus}
    />
  );

  return (
    <AppPageShell mainClassName="overflow-x-hidden">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">
              Services
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-0.5 sm:mt-1">
              Gérez vos services et réservations
            </p>
          </div>

          <Button
            onClick={() => navigate('/dashboard/products/new/service')}
            size="sm"
            className="text-xs sm:text-sm"
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Nouveau service</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 text-xs sm:text-sm min-h-[44px]"
            />
          </div>
          <div className="flex rounded-lg border p-1 w-fit">
            <Button
              type="button"
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-9 px-2.5', viewMode === 'list' && 'bg-muted')}
              onClick={() => setViewMode('list')}
              aria-label="Vue liste"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('h-9 px-2.5', viewMode === 'grid' && 'bg-muted')}
              onClick={() => setViewMode('grid')}
              aria-label="Vue grille"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isError && (
          <p className="text-sm text-destructive" role="alert">
            Impossible de charger les services. Réessayez dans un instant.
          </p>
        )}

        {isLoading ? (
          <ServicesGrid
            services={[]}
            loading={true}
            onEdit={id => navigate(`/dashboard/products/${id}/edit`)}
            onDelete={id => setDeleteServiceId(id)}
          />
        ) : filteredServices.length === 0 ? (
          <Card className="p-12">
            <CardContent className="p-0 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun service disponible</h3>
              <p className="text-muted-foreground">
                Créez votre premier service pour commencer à recevoir des réservations
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {filteredServices.map(service => {
              const display = resolveServiceDisplayPrice({
                price: Number(service.product?.price || 0),
                promotionalPrice: Number(service.product?.promotional_price || 0),
                pricingType: service.pricing_type,
                fulfillmentMode: service.fulfillment_mode,
              });
              const currency = String(service.product?.currency || 'XOF');
              return (
                <Card
                  key={service.id}
                  className="group border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <ResponsiveProductImage
                        src={service.product?.image_url}
                        alt={service.product?.name || 'Service'}
                        sizes="80px"
                        context="grid"
                        fit="cover"
                        className="h-full w-full"
                        fallbackIcon={<Calendar className="h-7 w-7 text-muted-foreground" />}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold line-clamp-1">
                        {service.product?.name || 'Service sans nom'}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatDuration(service.duration_minutes)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {locationLabel(service.location_type)}
                        </Badge>
                        {(() => {
                          const label = formatServiceCategoryLabel(categoryRows, {
                            categoryId: service.product?.category_id as string | undefined,
                            categorySlug: service.product?.category as string | undefined,
                          });
                          return label ? (
                            <Badge variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ) : null;
                        })()}
                        <ServiceListingAttributeBadges
                          categorySlug={service.product?.category as string | undefined}
                          attributes={service.category_attributes}
                        />
                        {service.product?.is_active === false && (
                          <Badge variant="secondary" className="text-xs">
                            Brouillon
                          </Badge>
                        )}
                        {display.originalAmount && display.originalAmount > display.amount ? (
                          <Badge className="text-xs">
                            -
                            {Math.round(
                              ((display.originalAmount - display.amount) / display.originalAmount) *
                                100
                            )}
                            %
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <ServicePriceDisplay
                        display={display}
                        currency={currency}
                        size="sm"
                        align="right"
                      />
                      {serviceActions(service)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <ServicesGrid
            services={filteredServices}
            loading={false}
            storeSlug={store?.slug}
            storeSubdomain={store?.subdomain}
            onEdit={id => navigate(`/dashboard/products/${id}/edit`)}
            onDelete={id => setDeleteServiceId(id)}
            onDuplicate={id => navigate(`/dashboard/products/new/service?duplicate=${id}`)}
            onToggleStatus={handleToggleStatus}
          />
        )}

        <AlertDialog
          open={!!deleteServiceId}
          onOpenChange={open => !open && setDeleteServiceId(null)}
        >
          <AlertDialogContent className="p-4 sm:p-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
                Confirmer la suppression
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[10px] sm:text-xs md:text-sm">
                Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppPageShell>
  );
};

export default ServicesList;
