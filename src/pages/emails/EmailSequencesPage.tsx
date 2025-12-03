/**
 * Page principale pour la gestion des séquences email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
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

export const EmailSequencesPage = () => {
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [stepEditorOpen, setStepEditorOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);
  const [viewingSequenceId, setViewingSequenceId] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<EmailSequenceStep | null>(null);
  const [currentTab, setCurrentTab] = useState<'list' | 'steps'>('list');

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
                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Séquences Email
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-1">
                  Créez et gérez vos séquences d'emails automatiques (drip campaigns)
                </p>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <Alert className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
            <Info className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900 dark:text-purple-100">
              Séquences d'Emails Automatiques
            </AlertTitle>
            <AlertDescription className="text-purple-800 dark:text-purple-200">
              Créez des séquences d'emails qui s'envoient automatiquement selon un calendrier
              ou en réponse à des événements. Parfait pour les séquences de bienvenue,
              de nurture, ou de récupération de panier abandonné.
            </AlertDescription>
          </Alert>

          {/* Main Content with Tabs */}
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'list' | 'steps')}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="list" className="flex-1 sm:flex-none">Liste des séquences</TabsTrigger>
              {viewingSequenceId && (
                <TabsTrigger value="steps" className="flex-1 sm:flex-none">
                  <span className="hidden sm:inline">Étapes: </span>
                  <span className="truncate">{viewingSequence?.name || '...'}</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              <EmailSequenceManager
                storeId={store.id}
                onCreateSequence={handleCreateSequence}
                onEditSequence={handleEditSequence}
                onViewSteps={handleViewSteps}
              />
            </TabsContent>

            {viewingSequenceId && (
              <TabsContent value="steps" className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewingSequenceId(null);
                      setCurrentTab('list');
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la liste
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

