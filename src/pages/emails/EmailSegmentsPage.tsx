/**
 * Page principale pour la gestion des segments email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { 
  EmailSegmentManager, 
  EmailSegmentBuilder,
  SegmentPreview,
} from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Info, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EmailSegment } from '@/lib/email/email-segment-service';

export const EmailSegmentsPage = () => {
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<EmailSegment | null>(null);
  const [previewingSegment, setPreviewingSegment] = useState<EmailSegment | null>(null);
  const [currentTab, setCurrentTab] = useState<'list' | 'preview'>('list');

  const handleCreateSegment = () => {
    setEditingSegment(null);
    setBuilderOpen(true);
  };

  const handleEditSegment = (segment: EmailSegment) => {
    setEditingSegment(segment);
    setBuilderOpen(true);
  };

  const handlePreviewSegment = (segment: EmailSegment) => {
    setPreviewingSegment(segment);
    setCurrentTab('preview');
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditingSegment(null);
  };

  const handleSuccess = () => {
    setBuilderOpen(false);
    setEditingSegment(null);
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
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/5 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Segments d'Audience
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1">
                  Créez et gérez vos segments d'audience pour cibler vos campagnes email
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">
              Segmentation d'Audience
            </AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              Créez des segments statiques (liste manuelle) ou dynamiques (calculés automatiquement)
              pour cibler précisément vos campagnes email. Les segments dynamiques se mettent à jour
              automatiquement selon vos critères.
            </AlertDescription>
          </Alert>

          {/* Main Content with Tabs */}
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'list' | 'preview')}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="list" className="flex-1 sm:flex-none">Liste des segments</TabsTrigger>
              {previewingSegment && (
                <TabsTrigger value="preview" className="flex-1 sm:flex-none">
                  <span className="hidden sm:inline">Prévisualisation: </span>
                  <span className="truncate">{previewingSegment.name}</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <EmailSegmentManager
                storeId={store.id}
                onCreateSegment={handleCreateSegment}
                onEditSegment={handleEditSegment}
                onPreviewSegment={handlePreviewSegment}
              />
            </TabsContent>

            {previewingSegment && (
              <TabsContent value="preview" className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewingSegment(null);
                      setCurrentTab('list');
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la liste
                  </Button>
                </div>
                <SegmentPreview
                  segment={previewingSegment}
                  onClose={() => {
                    setPreviewingSegment(null);
                    setCurrentTab('list');
                  }}
                />
              </TabsContent>
            )}
          </Tabs>

          {/* Segment Builder Dialog */}
          <EmailSegmentBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            storeId={store.id}
            segment={editingSegment}
            onSuccess={handleSuccess}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

