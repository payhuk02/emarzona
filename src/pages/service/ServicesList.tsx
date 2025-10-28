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
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Services</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez vos services et réservations
                </p>
              </div>

              <Button onClick={() => navigate('/products/create?type=service')}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau service
              </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Services Grid */}
            <ServicesGrid
              services={filteredServices || []}
              loading={isLoading}
              onEdit={(id) => navigate(`/dashboard/services/${id}/edit`)}
              onDelete={(id) => setDeleteServiceId(id)}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteServiceId} onOpenChange={(open) => !open && setDeleteServiceId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                  <AlertDialogDescription>
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

