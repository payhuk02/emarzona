/**
 * Page principale pour la gestion des séquences email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  EmailSequenceManager,
  EmailSequenceBuilder,
  SequenceStepsList,
  SequenceStepEditor,
  SequenceEnrollmentsPanel,
  EmailDashboardLayout,
} from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Mail, ArrowLeft } from 'lucide-react';
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
  const [currentTab, setCurrentTab] = useState<'list' | 'steps' | 'enrollments'>('list');
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
    const maxOrder = Math.max(...viewingSteps.map(step => step.step_order));
    return maxOrder + 1;
  };

  return (
    <EmailDashboardLayout
      title={t('emails.sequences.title')}
      subtitle={t('emails.sequences.subtitle')}
      icon={Mail}
      noStoreMessage={t('emails.sequences.noStore')}
      infoAlert={{
        title: t('emails.sequences.alert.title'),
        description: t('emails.sequences.alert.description'),
      }}
    >
      {store ? (
        <>
          {/* Main Content with Tabs */}
          <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Tabs
              value={currentTab}
              onValueChange={v => setCurrentTab(v as 'list' | 'steps' | 'enrollments')}
            >
              <TabsList
                className={`grid w-full h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto ${
                  viewingSequenceId ? 'grid-cols-3' : 'grid-cols-1'
                }`}
              >
                <TabsTrigger
                  value="list"
                  className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t('emails.sequences.tabs.list')}
                </TabsTrigger>
                {viewingSequenceId && (
                  <>
                    <TabsTrigger
                      value="steps"
                      className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                    >
                      <span className="hidden sm:inline">{t('emails.sequences.tabs.steps')}: </span>
                      <span className="truncate">{viewingSequence?.name || '...'}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="enrollments"
                      className="flex-1 sm:flex-none px-2 sm:px-3 py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                    >
                      {t('emails.sequences.tabs.enrollments', 'Inscriptions')}
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent
                value="list"
                className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <EmailSequenceManager
                  storeId={store.id}
                  onCreateSequence={handleCreateSequence}
                  onEditSequence={handleEditSequence}
                  onViewSteps={handleViewSteps}
                />
              </TabsContent>

              {viewingSequenceId && (
                <TabsContent
                  value="steps"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
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

              {viewingSequenceId && viewingSequence && (
                <TabsContent
                  value="enrollments"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6"
                >
                  <SequenceEnrollmentsPanel sequence={viewingSequence} storeId={store.id} />
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
        </>
      ) : null}
    </EmailDashboardLayout>
  );
};
