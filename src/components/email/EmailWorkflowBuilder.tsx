/**
 * Composant pour créer/éditer un workflow email
 * Date: 1er Février 2025
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateEmailWorkflow, useUpdateEmailWorkflow } from '@/hooks/email/useEmailWorkflows';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';
import type {
  EmailWorkflow,
  CreateWorkflowPayload,
  WorkflowTriggerType,
  WorkflowStatus,
  WorkflowAction,
} from '@/lib/email/email-workflow-service';
import { Loader2 } from 'lucide-react';
import { WorkflowTriggerEditor } from './WorkflowTriggerEditor';
import { WorkflowActionsList } from './WorkflowActionsList';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { WORKFLOW_TEMPLATES, type WorkflowTemplate } from '@/lib/email/workflow-templates';
import { logger } from '@/lib/logger';
import { Sparkles } from 'lucide-react';

interface EmailWorkflowBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  workflow?: EmailWorkflow | null;
  onSuccess?: () => void;
}

export const EmailWorkflowBuilder = ({
  open,
  onOpenChange,
  storeId,
  workflow,
  onSuccess,
}: EmailWorkflowBuilderProps) => {
  const { useBottomSheet } = useResponsiveModal();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>('event');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [status, setStatus] = useState<WorkflowStatus>('active');
  const [showTemplates, setShowTemplates] = useState(!workflow);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const createWorkflow = useCreateEmailWorkflow();
  const updateWorkflow = useUpdateEmailWorkflow();

  const isEditing = !!workflow;

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setTriggerType(workflow.trigger_type);
      setTriggerConfig(workflow.trigger_config);
      setActions(workflow.actions || []);
      setStatus(workflow.status);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setTriggerType('event');
      setTriggerConfig({});
      setActions([]);
      setStatus('active');
    }
  }, [workflow, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateWorkflow()) {
      return;
    }

    const  payload: CreateWorkflowPayload = {
      store_id: storeId,
      name,
      description,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      actions,
      status,
    };

    try {
      if (isEditing) {
        await updateWorkflow.mutateAsync({
          workflowId: workflow!.id,
          payload,
        });
      } else {
        await createWorkflow.mutateAsync(payload);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      logger.error('Failed to save workflow', { error });
      // Toast handled by hook
    }
  };

  const handleUseTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setName(template.workflow.name);
    setDescription(template.workflow.description || '');
    setTriggerType(template.workflow.trigger_type);
    setTriggerConfig(template.workflow.trigger_config);
    setActions(template.workflow.actions || []);
    setStatus(template.workflow.status);
    setShowTemplates(false);
    setValidationErrors({});
  };

  const validateWorkflow = (): boolean => {
    const  errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Le nom est requis';
    }

    if (triggerType === 'event' && !triggerConfig?.event_name) {
      errors.trigger = "Le nom de l'événement est requis";
    }

    if (actions.length === 0) {
      errors.actions = 'Au moins une action est requise';
    }

    // Valider chaque action
    actions.forEach((action, index) => {
      if (action.type === 'send_email' && !action.config?.template_id) {
        errors[`action_${index}`] = "Le template ID est requis pour l'envoi d'email";
      }
      if (action.type === 'wait' && !action.config?.duration) {
        errors[`action_${index}`] = "La durée est requise pour l'action d'attente";
      }
      if ((action.type === 'add_tag' || action.type === 'remove_tag') && !action.config?.tag) {
        errors[`action_${index}`] = 'Le nom du tag est requis';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const  currentWorkflow: EmailWorkflow | null = workflow || {
    id: '',
    store_id: storeId,
    name,
    description: description || undefined,
    trigger_type: triggerType,
    trigger_config: triggerConfig,
    actions,
    status,
    is_active: status === 'active',
    execution_count: 0,
    success_count: 0,
    error_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Templates */}
      {showTemplates && !isEditing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Templates prêts à l'emploi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WORKFLOW_TEMPLATES.map(template => (
              <Card
                key={template.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleUseTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button type="button" variant="outline" onClick={() => setShowTemplates(false)}>
              Créer un workflow personnalisé
            </Button>
          </div>
        </div>
      )}

      {(!showTemplates || isEditing) && (
        <>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="trigger">Déclencheur</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="preview">Prévisualisation</TabsTrigger>
            </TabsList>

            {/* Onglet Général */}
            <TabsContent value="general" className="space-y-4">
              {selectedTemplate && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">
                    Template utilisé: {selectedTemplate.name}
                  </span>
                </div>
              )}
              <MobileFormField
                label="Nom"
                name="name"
                type="text"
                value={name}
                onChange={setName}
                required
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600">{validationErrors.name}</p>
              )}
              <MobileFormField
                label="Description"
                name="description"
                type="textarea"
                value={description}
                onChange={setDescription}
                fieldProps={{
                  rows: 3,
                }}
              />
              <MobileFormField
                label="Statut"
                name="status"
                type="select"
                value={status}
                onChange={value => setStatus(value as WorkflowStatus)}
                selectOptions={[
                  { value: 'active', label: 'Actif' },
                  { value: 'paused', label: 'En pause' },
                  { value: 'archived', label: 'Archivé' },
                ]}
              />
            </TabsContent>

            {/* Onglet Déclencheur */}
            <TabsContent value="trigger" className="space-y-4">
              <MobileFormField
                label="Type"
                name="triggerType"
                type="select"
                value={triggerType}
                onChange={value => setTriggerType(value as WorkflowTriggerType)}
                required
                selectOptions={[
                  { value: 'event', label: 'Événement' },
                  { value: 'time', label: 'Temps' },
                  { value: 'condition', label: 'Condition' },
                ]}
              />
              <WorkflowTriggerEditor
                triggerType={triggerType}
                config={triggerConfig}
                onChange={setTriggerConfig}
              />
            </TabsContent>

            {/* Onglet Actions */}
            <TabsContent value="actions" className="space-y-4">
              <WorkflowActionsList actions={actions} onActionsChange={setActions} />
              {validationErrors.actions && (
                <p className="text-sm text-red-600">{validationErrors.actions}</p>
              )}
            </TabsContent>

            {/* Onglet Prévisualisation */}
            <TabsContent value="preview" className="space-y-4">
              <WorkflowVisualizer workflow={currentWorkflow} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={createWorkflow.isPending || updateWorkflow.isPending || !name.trim()}
          className="w-full sm:w-auto"
        >
          {(createWorkflow.isPending || updateWorkflow.isPending) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditing ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title={isEditing ? 'Modifier le workflow' : 'Créer un nouveau workflow'}
            description={
              isEditing
                ? 'Modifiez les détails de votre workflow automatisé.'
                : 'Créez un workflow automatisé pour vos emails.'
            }
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Modifier le workflow' : 'Créer un nouveau workflow'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Modifiez les détails de votre workflow automatisé.'
                  : 'Créez un workflow automatisé pour vos emails.'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};






