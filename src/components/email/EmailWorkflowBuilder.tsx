/**
 * Composant pour créer/éditer un workflow email
 * Date: 1er Février 2025
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { WorkflowActionEditor } from './WorkflowActionEditor';
import { logger } from '@/lib/logger';

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
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [status, setStatus] = useState<WorkflowStatus>('active');

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

    const payload: CreateWorkflowPayload = {
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

  const handleAddAction = () => {
    const newAction: WorkflowAction = {
      type: 'send_email',
      config: {},
      order: actions.length + 1,
    };
    setActions([...actions, newAction]);
  };

  const handleUpdateAction = (index: number, updatedAction: WorkflowAction) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    setActions(newActions);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    // Réordonner les actions
    setActions(newActions.map((action, i) => ({ ...action, order: i + 1 })));
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="trigger">Déclencheur</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-4">
          <MobileFormField
            label="Nom"
            name="name"
            type="text"
            value={name}
            onChange={setName}
            required
          />
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
            onChange={(value) => setStatus(value as WorkflowStatus)}
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
            onChange={(value) => setTriggerType(value as WorkflowTriggerType)}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <Label>Actions du workflow</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddAction} className="w-full sm:w-auto">
              Ajouter une action
            </Button>
          </div>
          {actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Aucune action configurée</p>
              <p className="text-sm mt-2">Ajoutez une action pour démarrer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <WorkflowActionEditor
                  key={index}
                  action={action}
                  index={index}
                  onUpdate={(updatedAction) => handleUpdateAction(index, updatedAction)}
                  onRemove={() => handleRemoveAction(index)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
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
              <DialogTitle>{isEditing ? 'Modifier le workflow' : 'Créer un nouveau workflow'}</DialogTitle>
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

