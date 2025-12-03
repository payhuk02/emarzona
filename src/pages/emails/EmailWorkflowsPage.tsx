/**
 * Page principale pour les workflows email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import {
  EmailWorkflowManager,
  EmailWorkflowBuilder,
} from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Workflow, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { EmailWorkflow } from '@/lib/email/email-workflow-service';

export const EmailWorkflowsPage = () => {
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<EmailWorkflow | null>(null);

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setBuilderOpen(true);
  };

  const handleEditWorkflow = (workflow: EmailWorkflow) => {
    setEditingWorkflow(workflow);
    setBuilderOpen(true);
  };

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Veuillez sélectionner une boutique
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger 
                aria-label="Toggle sidebar"
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] lg:hidden"
              />
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/5 flex-shrink-0">
                <Workflow className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Workflows Email
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-1">
                  Automatisez vos emails avec des workflows intelligents
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900 dark:text-purple-100">
              Workflows Automatisés
            </AlertTitle>
            <AlertDescription className="text-purple-800 dark:text-purple-200">
              Créez des workflows automatisés qui déclenchent des actions basées sur des
              événements, des conditions ou des planifications. Automatisez vos campagnes
              email pour économiser du temps et améliorer l'engagement.
            </AlertDescription>
          </Alert>

          {/* Workflow Manager */}
          <EmailWorkflowManager
            storeId={store.id}
            onCreateWorkflow={handleCreateWorkflow}
            onEditWorkflow={handleEditWorkflow}
          />

          {/* Workflow Builder */}
          <EmailWorkflowBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            storeId={store.id}
            workflow={editingWorkflow}
            onSuccess={() => {
              setBuilderOpen(false);
              setEditingWorkflow(null);
            }}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

