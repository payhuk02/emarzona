/**
 * Staff Availability Calendar Page
 * Date: 28 Janvier 2025
 * 
 * Page de calendrier pour gérer les disponibilités du staff
 * Style inspiré de la page Inventaire avec design responsive et animations
 */

import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { StaffAvailabilityCalendarView } from '@/components/service/staff/StaffAvailabilityCalendarView';
import { StaffAvailabilityManager } from '@/components/service/StaffAvailabilityManager';
import { StaffAvailabilitySettings } from '@/components/service/staff/StaffAvailabilitySettings';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export default function StaffAvailabilityCalendar() {
  const { serviceId } = useParams<{ serviceId?: string }>();
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('calendar');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Handle refresh
  const handleRefresh = useCallback(() => {
    logger.info('Staff availability refreshed');
    toast({
      title: '✅ Actualisé',
      description: 'Les disponibilités ont été actualisées.',
    });
    // Force re-render by updating state
    setSelectedStaffId(prev => prev);
  }, [toast]);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Chargement du store...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="animate-in fade-in slide-in-from-top-4">
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2">Aucune boutique trouvée</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                    Vous devez créer une boutique avant de gérer les disponibilités du staff.
                  </p>
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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header avec animation - Style Inventory */}
            <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Calendrier Staff
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Gérez les disponibilités et horaires du personnel
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                size="sm"
                className="h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">Rafraîchir</span>
              </Button>
            </div>

            {/* Tabs - Style Inventory */}
            <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2">
                  <TabsTrigger 
                    value="calendar"
                    className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Calendrier</span>
                    <span className="sm:hidden">Cal.</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="management"
                    className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Gestion</span>
                    <span className="sm:hidden">Gest.</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings"
                    className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Paramètres</span>
                    <span className="sm:hidden">Param.</span>
                  </TabsTrigger>
                </TabsList>

                {/* Calendar Tab */}
                <TabsContent value="calendar" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <StaffAvailabilityCalendarView
                      storeId={store.id}
                      serviceId={serviceId}
                      selectedStaffId={selectedStaffId}
                      onStaffSelect={setSelectedStaffId}
                    />
                  </div>
                </TabsContent>

                {/* Management Tab */}
                <TabsContent value="management" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <StaffAvailabilityManager
                      storeId={store.id}
                      staffMemberId={selectedStaffId}
                    />
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <StaffAvailabilitySettings
                      storeId={store.id}
                      serviceId={serviceId}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

