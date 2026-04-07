/**
 * Page principale pour la gestion des séquences email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { 
  EmailSequenceManager, 
  EmailSequenceBuilder,
  SequenceStepsList,
  SequenceStepEditor,
} from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Info, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EmailSequence, EmailSequenceStep } from '@/lib/email/email-sequence-service';
import { useEmailSequence, useEmailSequenceSteps } from '@/hooks/email/useEmailSequences';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const EmailSequencesPage = () => {
  const { t } = useTranslation();
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);
  const [viewingSequenceId, setViewingSequenceId] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<EmailSequenceStep | null>(null);
  const [currentTab, setCurrentTab] = useState<'list' | 'steps'>('list');
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  const { data: viewingSequence } = useEmailSequence(viewingSequenceId);
  const { data: viewingSteps } = useEmailSequenceSteps(viewingSequenceId);

  const handleCreateSequence = () => {
    setEditingSequence(null);
    setBuilderOpen(true);
  };

  const handleEditSequence = (sequence: EmailSequence) => {
    setEditingSequence(sequence);
    setBuilderOpen(true);
  };

  const handleViewSteps = (sequence: EmailSequence) => {
    setViewingSequenceId(sequence.id);
    setCurrentTab('steps');
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setStepEditorOpen(true);
  };

  const handleEditStep = (step: EmailSequenceStep) => {
    setEditingStep(step);
    setStepEditorOpen(true);
  };

  const handleBuilderClose = () => {
    setBuilderOpen(false);
    setEditingSequence(null);
  };

  const handleStepEditorClose = () => {
    setStepEditorOpen(false);
    setEditingStep(null);
  };

  const handleSuccess = () => {
    setBuilderOpen(false);
    setStepEditorOpen(false);
    setEditingSequence(null);
    setEditingStep(null);
  };

  const getNextStepOrder = () => {
    if (!viewingSteps || viewingSteps.length === 0) return 1;
    const maxOrder = Math.max(...viewingSteps.map((step) => step.step_order));
    return maxOrder + 1;
  };

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen">
          <AppSidebar />
          <main className="flex-1 p-3 sm:p-4 lg:p-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 sm:p-8 sm:p-12 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('emails.sequences.noStore')}
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
        <main className="flex-1 p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div 
            ref={headerRef}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger 
                aria-label="Toggle sidebar"
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px]"
              />
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/5 backdrop-blur-sm border border-purple-500/20 flex-shrink-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {t('emails.sequences.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('emails.sequences.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-purple-200/50 bg-purple-50/50 dark:bg-purple-950/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-600" />
            <AlertTitle className="text-xs sm:text-sm md:text-base text-purple-900 dark:text-purple-100">
              {t('emails.sequences.alert.title')}
            </AlertTitle>
            <AlertDescription className="text-[10px] sm:text-xs md:text-sm text-purple-800 dark:text-purple-200">
              {t('emails.sequences.alert.description')}
            </AlertDescription>
          </Alert>

          {/* Main Content with Tabs */}
          <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'list' | 'steps')}>
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                <TabsTrigger 
                  value="list" 
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t('emails.sequences.tabs.list')}
                </TabsTrigger>
                {viewingSequenceId && (
                  <TabsTrigger 
                    value="steps" 
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="hidden sm:inline">{t('emails.sequences.tabs.steps')}: </span>
                    <span className="truncate">{viewingSequence?.name || '...'}</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <EmailSequenceManager
                  storeId={store.id}
                  onCreateSequence={handleCreateSequence}
                  onEditSequence={handleEditSequence}
                  onViewSteps={handleViewSteps}
                />
              </TabsContent>

              {viewingSequenceId && (
                <TabsContent value="steps" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setViewingSequenceId(null);
                        setCurrentTab('list');
                      }}
                      className="min-h-[44px] text-xs sm:text-sm"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Retour à la liste</span>
                      <span className="sm:hidden">Retour</span>
                    </Button>
                  </div>
                  <SequenceStepsList
                    sequenceId={viewingSequenceId}
                    onAddStep={handleAddStep}
                    onEditStep={handleEditStep}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sequence Builder Dialog */}
          <EmailSequenceBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            storeId={store.id}
            sequence={editingSequence}
            onSuccess={handleSuccess}
          />

          {/* Step Editor Dialog */}
          {viewingSequenceId && (
            <SequenceStepEditor
              open={stepEditorOpen}
              onOpenChange={setStepEditorOpen}
              sequenceId={viewingSequenceId}
              step={editingStep}
              stepOrder={getNextStepOrder()}
              onSuccess={handleSuccess}
            />
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};







