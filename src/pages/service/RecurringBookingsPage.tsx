/**
 * Recurring Bookings Page
 * Date: 27 Janvier 2025
 * 
 * Page complète pour gérer les réservations récurrentes
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { RecurringBookingsManager } from '@/components/service/recurring';
import { Repeat } from 'lucide-react';

export default function RecurringBookingsPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Repeat className="h-8 w-8" />
                Réservations Récurrentes
              </h1>
              <p className="text-muted-foreground">
                Gérez vos séries de réservations récurrentes
              </p>
            </div>

            <RecurringBookingsManager />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

