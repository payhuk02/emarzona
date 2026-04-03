/**
 * Store Team Management Page
 * Date: 2 Février 2025
 * 
 * Page principale pour gérer l'équipe d'une boutique (membres et tâches)
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreMembersList } from '@/components/team/StoreMembersList';
import { Users, CheckSquare, BarChart3 } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreTasksList } from '@/components/team/StoreTasksList';
import { StoreTeamStats } from '@/components/team/StoreTeamStats';
import { StoreTeamAnalytics } from '@/components/team/StoreTeamAnalytics';

const StoreTeamManagement = () => {
  const { t } = useTranslation();
  const { store, loading } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
                <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
                <Skeleton className="h-6 w-48" />
              </div>
            </header>
            <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
              <Skeleton className="h-96 w-full" />
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
              <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
                <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              </div>
            </header>
            <main className="flex-1 p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="py-8 sm:py-12 text-center">
                  <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2">{t('team.noStore', 'Aucune boutique sélectionnée')}</h2>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    {t('team.noStoreDesc', 'Veuillez sélectionner une boutique pour gérer votre équipe')}
                  </p>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header
            ref={headerRef}
            className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm"
          >
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
              <SidebarTrigger className="touch-manipulation min-h-[44px] min-w-[44px]" />
              <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                      {t('team.title', 'Gestion d\'équipe')}
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground hidden sm:block">
                    {t('team.subtitle', 'Gérez les membres de votre équipe et leurs tâches')}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-background overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
              {/* Statistiques */}
              <StoreTeamStats storeId={store.id} />

              {/* Tabs */}
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-6 h-auto p-1 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger
                    value="members"
                    className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{t('team.tabs.members', 'Membres')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="tasks"
                    className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{t('team.tabs.tasks', 'Tâches')}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="stats"
                    className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('team.tabs.stats', 'Statistiques')}</span>
                    <span className="sm:hidden">{t('team.tabs.statsShort', 'Stats')}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4 sm:space-y-6">
                  <StoreMembersList />
                </TabsContent>

                <TabsContent value="tasks" className="space-y-4 sm:space-y-6">
                  <StoreTasksList storeId={store.id} />
                </TabsContent>

                <TabsContent value="stats" className="space-y-4 sm:space-y-6">
                  <StoreTeamAnalytics storeId={store.id} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StoreTeamManagement;







