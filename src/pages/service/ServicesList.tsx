/**
 * Services List Page
 * Date: 28 octobre 2025
 * 
 * Main page for managing services (sellers)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/hooks/useStore';
import { useServiceProducts, useDeleteServiceProduct } from '@/hooks/service';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Search } from 'lucide-react';
import { ServicesGrid } from '@/components/service';
import { ServicesListVirtualized } from '@/components/service/ServicesListVirtualized';
import { useToast } from '@/hooks/use-toast';

export const ServicesList = () => {
  const navigate = useNavigate();
  const { store } = useStore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);

  const { data: services, isLoading } = useServiceProducts(store?.id);
  const deleteService = useDeleteServiceProduct();

  const filteredServices = services?.filter((s) =>
    s.product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteServiceId) return;

    try {
      await deleteService.mutateAsync(deleteServiceId);
      toast({
        title: 'Service supprimé',
        description: 'Le service a été supprimé avec succès',
      });
      setDeleteServiceId(null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le service',
        variant: 'destructive',
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-x-hidden">
          <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">Services</h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-0.5 sm:mt-1">
                  Gérez vos services et réservations
                </p>
              </div>

              <Button onClick={() => navigate('/products/create?type=service')} size="sm" className="text-xs sm:text-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Nouveau service</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm min-h-[44px]"
              />
            </div>

            {/* Services Grid ou Virtualized */}
            {isLoading ? (
              <ServicesGrid
                services={[]}
                loading={true}
                onEdit={(id) => navigate(`/dashboard/services/${id}/edit`)}
                onDelete={(id) => setDeleteServiceId(id)}
              />
            ) : (filteredServices?.length || 0) > 50 ? (
              <ServicesListVirtualized
                services={filteredServices || []}
                onEdit={(id) => navigate(`/dashboard/services/${id}/edit`)}
                onDelete={(id) => setDeleteServiceId(id)}
                showActions={true}
                itemHeight={300}
                containerHeight="600px"
              />
            ) : (
              <ServicesGrid
                services={filteredServices || []}
                loading={false}
                onEdit={(id) => navigate(`/dashboard/services/${id}/edit`)}
                onDelete={(id) => setDeleteServiceId(id)}
              />
            )}

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteServiceId} onOpenChange={(open) => !open && setDeleteServiceId(null)}>
              <AlertDialogContent className="p-4 sm:p-6">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xs sm:text-sm md:text-base lg:text-lg">Confirmer la suppression</AlertDialogTitle>
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
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ServicesList;







