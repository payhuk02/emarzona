/**
 * My Tasks Page
 * Date: 2 Février 2025
 * 
 * Page affichant les tâches assignées à l'utilisateur connecté
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useStore } from '@/hooks/useStore';
import { StoreTasksList } from '@/components/team/StoreTasksList';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreTasks, type StoreTask } from '@/hooks/useStoreTasks';

const MyTasks = () => {
  const { t } = useTranslation();
  const { store } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer l'utilisateur actuel
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Récupérer toutes les tâches assignées à l'utilisateur dans la boutique active
  const { data: tasks, isLoading: tasksLoading } = useStoreTasks(store?.id || null, {
    assigned_to: currentUser?.id,
  });

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
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 flex items-center justify-center">
                  <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold truncate bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {t('tasks.title', 'Mes Tâches')}
                </h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-background overflow-x-hidden">
            <div className="max-w-7xl mx-auto w-full">
              {tasksLoading ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </CardContent>
                </Card>
              ) : store ? (
                <StoreTasksList storeId={store.id} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      {t('tasks.title', 'Mes Tâches')}
                    </CardTitle>
                    <CardDescription>
                      {t('tasks.description', 'Toutes les tâches qui vous sont assignées')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">{t('tasks.noStore', 'Aucune boutique sélectionnée')}</p>
                    <p className="text-sm">
                      {t('tasks.noStoreDesc', 'Sélectionnez une boutique pour voir vos tâches assignées.')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MyTasks;







