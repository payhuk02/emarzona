/**
 * Composant pour configurer une action de workflow
 * Date: 1er Février 2025
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, GripVertical } from 'lucide-react';
import type { WorkflowAction, WorkflowActionType } from '@/lib/email/email-workflow-service';

interface WorkflowActionEditorProps {
  action: WorkflowAction;
  index: number;
  onUpdate: (action: WorkflowAction) => void;
  onRemove: () => void;
}

const  ACTION_TYPE_LABELS: Record<WorkflowActionType, string> = {
  send_email: 'Envoyer un email',
  wait: 'Attendre',
  add_tag: 'Ajouter un tag',
  remove_tag: 'Retirer un tag',
  update_segment: 'Mettre à jour un segment',
};

export const WorkflowActionEditor = ({
  action,
  index,
  onUpdate,
  onRemove,
}: WorkflowActionEditorProps) => {
  const updateAction = (updates: Partial<WorkflowAction>) => {
    onUpdate({ ...action, ...updates });
  };

  const updateConfig = (key: string, value: any) => {
    updateAction({
      config: { ...action.config, [key]: value },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">
              Action {index + 1}
            </CardTitle>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-red-600"
            aria-label="Supprimer cette action"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor={`actionType-${index}`} className="text-right">
            Type *
          </Label>
          <Select
            value={action.type}
            onValueChange={(value: WorkflowActionType) => updateAction({ type: value })}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Configuration selon le type d'action */}
        {action.type === 'send_email' && (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`templateId-${index}`} className="text-right">
                Template ID
              </Label>
              <Input
                id={`templateId-${index}`}
                value={action.config.template_id || ''}
                onChange={(e) => updateConfig('template_id', e.target.value)}
                className="col-span-3"
                placeholder="UUID du template"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor={`variables-${index}`} className="text-right pt-2">
                Variables (JSON)
              </Label>
              <textarea
                id={`variables-${index}`}
                value={JSON.stringify(action.config.variables || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    updateConfig('variables', parsed);
                  } catch {
                    // Invalid JSON, ignore
                  }
                }}
                className="col-span-3 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono text-xs"
                placeholder='{"user_name": "John", "order_id": "123"}'
              />
            </div>
          </>
        )}

        {action.type === 'wait' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`waitDuration-${index}`} className="text-right">
              Durée (minutes)
            </Label>
            <Input
              id={`waitDuration-${index}`}
              type="number"
              value={action.config.duration || ''}
              onChange={(e) => updateConfig('duration', parseInt(e.target.value) || 0)}
              className="col-span-3"
              placeholder="60"
            />
          </div>
        )}

        {(action.type === 'add_tag' || action.type === 'remove_tag') && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`tagName-${index}`} className="text-right">
              Nom du tag
            </Label>
            <Input
              id={`tagName-${index}`}
              value={action.config.tag || ''}
              onChange={(e) => updateConfig('tag', e.target.value)}
              className="col-span-3"
              placeholder="ex: vip, newsletter"
            />
          </div>
        )}

        {action.type === 'update_segment' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`segmentId-${index}`} className="text-right">
              Segment ID
            </Label>
            <Input
              id={`segmentId-${index}`}
              value={action.config.segment_id || ''}
              onChange={(e) => updateConfig('segment_id', e.target.value)}
              className="col-span-3"
              placeholder="UUID du segment"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};







