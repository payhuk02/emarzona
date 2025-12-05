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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateEmailWorkflow, useUpdateEmailWorkflow } from '@/hooks/email/useEmailWorkflows';
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

  return (
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="trigger">Déclencheur</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            {/* Onglet Général */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Statut
                </Label>
                <Select value={status} onValueChange={(value: WorkflowStatus) => setStatus(value)}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="paused">En pause</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {/* Onglet Déclencheur */}
            <TabsContent value="trigger" className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="triggerType" className="text-right">
                  Type *
                </Label>
                <Select
                  value={triggerType}
                  onValueChange={(value: WorkflowTriggerType) => setTriggerType(value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Événement</SelectItem>
                    <SelectItem value="time">Temps</SelectItem>
                    <SelectItem value="condition">Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <WorkflowTriggerEditor
                triggerType={triggerType}
                config={triggerConfig}
                onChange={setTriggerConfig}
              />
            </TabsContent>

            {/* Onglet Actions */}
            <TabsContent value="actions" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Actions du workflow</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddAction}>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createWorkflow.isPending || updateWorkflow.isPending || !name.trim()}
            >
              {(createWorkflow.isPending || updateWorkflow.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

