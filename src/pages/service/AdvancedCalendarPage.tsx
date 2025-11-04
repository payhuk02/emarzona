/**
 * Advanced Calendar Page
 * Date: 27 Janvier 2025
 * 
 * Page complète pour le calendrier avancé des services
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AdvancedServiceCalendar } from '@/components/service';
import { Calendar } from 'lucide-react';

export default function AdvancedCalendarPage() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Calendrier Avancé des Réservations
              </h1>
              <p className="text-muted-foreground">
                Gérez vos réservations avec vues multiples, drag & drop et filtres avancés
              </p>
            </div>

            <AdvancedServiceCalendar
              enableDragDrop={true}
              enableFilters={true}
              defaultView="week"
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

