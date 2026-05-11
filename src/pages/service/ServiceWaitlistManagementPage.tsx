/**
 * Page de Gestion de la Waitlist des Services
 * Date: 1 Février 2025
 * 
 * Interface complète pour gérer les listes d'attente des services
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  useStoreWaitlist,
  useNotifyWaitlistEntry,
  useConvertWaitlistToBooking,
  useRemoveFromWaitlist,
  useUpdateWaitlistStatus,
  useNotifyWaitlistCustomers,
  type ServiceWaitlistEntry,
} from '@/hooks/services/useServiceWaitlist';
import { WaitlistManager, type WaitlistEntry } from '@/components/service/WaitlistManager';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export default function ServiceWaitlistManagementPage() {
  const { store } = useStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: waitlist, isLoading } = useStoreWaitlist(store?.id || '');
  const notifyEntry = useNotifyWaitlistEntry();
  const convertToBooking = useConvertWaitlistToBooking();
  const removeFromWaitlist = useRemoveFromWaitlist();
  const updateStatus = useUpdateWaitlistStatus();
  const notifyAll = useNotifyWaitlistCustomers();

  // Récupérer les services pour le filtre
  const { data: services } = useQuery({
    queryKey: ['store-services', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('store_id', store.id)
        .eq('product_type', 'service');

      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Convertir les entrées waitlist au format du composant
  const  waitlistEntries: WaitlistEntry[] = (waitlist || []).map((entry) => ({
    id: entry.id,
    serviceId: entry.service_id,
    serviceName: entry.products?.name || 'Service',
    customerId: entry.user_id,
    customerName: entry.customer_name,
    customerEmail: entry.customer_email,
    customerPhone: entry.customer_phone,
    status: entry.status,
    priority: entry.priority,
    preferredDate: entry.preferred_date,
    preferredTime: entry.preferred_time,
    notes: entry.customer_notes,
    position: entry.position,
    createdAt: entry.created_at,
    notifiedAt: entry.notified_at,
    expiresAt: entry.expires_at,
  }));

  const handleNotify = async (entryId: string) => {
    await notifyEntry.mutateAsync(entryId);
  };

  const handleNotifyAll = async (serviceId?: string) => {
    // Notification de tous les clients en attente
    const entriesToNotify = serviceId
      ? waitlistEntries.filter((e) => e.serviceId === serviceId && e.status === 'waiting')
      : waitlistEntries.filter((e) => e.status === 'waiting');

    // Notifier par batch de 10 pour éviter la surcharge
    for (const entry of entriesToNotify.slice(0, 10)) {
      try {
        await notifyEntry.mutateAsync(entry.id);
      } catch (error) {
        // Continuer avec les autres entrées même en cas d'erreur
        logger.error('Error notifying waitlist entry', { entryId: entry.id, error });
      }
    }
    
    if (entriesToNotify.length > 10) {
      toast({
        title: 'Notification partielle',
        description: `${entriesToNotify.length} entrées trouvées, 10 premières notifiées.`,
      });
    }
  };

  const handleConvert = async (entryId: string) => {
    const entry = waitlistEntries.find((e) => e.id === entryId);
    if (!entry) {
      toast({
        title: 'Erreur',
        description: 'Entrée waitlist non trouvée',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Option 1: Si une réservation existe déjà (depuis la page de booking)
      // On peut utiliser convertToBooking directement
      // Option 2: Naviguer vers la page de booking avec pré-remplissage
      // La page de booking créera la réservation et appellera convertToBooking
      
      // Pour l'instant, naviguer vers la page de booking avec les paramètres waitlist
      // La page ServiceBooking créera la réservation et appellera automatiquement convertToBooking
      navigate(`/service/${entry.serviceId}/book?waitlist=${entryId}`, {
        state: {
          waitlistEntry: entry,
          prefillData: {
            customerName: entry.customerName,
            customerEmail: entry.customerEmail,
            customerPhone: entry.customerPhone,
            preferredDate: entry.preferredDate,
            preferredTime: entry.preferredTime,
            notes: entry.notes,
          },
        },
      });
    } catch (error) {
      logger.error('Erreur lors de la conversion waitlist', { entryId, error });
      toast({
        title: 'Erreur',
        description: 'Impossible de convertir en réservation',
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (entryId: string) => {
    await removeFromWaitlist.mutateAsync(entryId);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8" />
                Gestion des Listes d'Attente
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérez les clients en attente de disponibilité pour vos services
              </p>
            </div>

            <WaitlistManager
              entries={waitlistEntries}
              onNotify={handleNotify}
              onNotifyAll={handleNotifyAll}
              onConvert={handleConvert}
              onRemove={handleRemove}
              availableServices={services || []}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







