/**
 * Composant amélioré pour gérer les actions avec drag-and-drop
 * Date: 2 Février 2025
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GripVertical, Plus, Trash2, Mail, Clock, Tag, Users } from 'lucide-react';
import type { WorkflowAction, WorkflowActionType } from '@/lib/email/email-workflow-service';
import { cn } from '@/lib/utils';
import { WorkflowActionEditor } from './WorkflowActionEditor';

interface WorkflowActionsListProps {
  actions: WorkflowAction[];
  onActionsChange: (actions: WorkflowAction[]) => void;
}

const ACTION_OPTIONS: { value: WorkflowActionType; label: string; icon: React.ReactNode }[] = [
  { value: 'send_email', label: 'Envoyer un email', icon: <Mail className="h-4 w-4" /> },
  { value: 'wait', label: 'Attendre', icon: <Clock className="h-4 w-4" /> },
  { value: 'add_tag', label: 'Ajouter un tag', icon: <Tag className="h-4 w-4" /> },
  { value: 'remove_tag', label: 'Retirer un tag', icon: <Tag className="h-4 w-4" /> },
  { value: 'update_segment', label: 'Mettre à jour un segment', icon: <Users className="h-4 w-4" /> },
];

export const WorkflowActionsList = ({ actions, onActionsChange }: WorkflowActionsListProps) => {
  const [expandedAction, setExpandedAction] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddAction = (type?: WorkflowActionType) => {
    const newAction: WorkflowAction = {
      type: type || 'send_email',
      config: {},
      order: actions.length + 1,
    };
    const newActions = [...actions, newAction];
    onActionsChange(newActions);
    setExpandedAction(newActions.length - 1);
  };

  const handleUpdateAction = (index: number, updatedAction: WorkflowAction) => {
    const newActions = [...actions];
    newActions[index] = updatedAction;
    onActionsChange(newActions);
  };

  const handleRemoveAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    // Réordonner les actions
    const reorderedActions = newActions.map((action, i) => ({ ...action, order: i + 1 }));
    onActionsChange(reorderedActions);
    if (expandedAction === index) {
      setExpandedAction(null);
    } else if (expandedAction !== null && expandedAction > index) {
      setExpandedAction(expandedAction - 1);
    }
  };

  const handleMoveAction = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newActions = [...actions];
    const [moved] = newActions.splice(fromIndex, 1);
    newActions.splice(toIndex, 0, moved);
    
    // Réordonner
    const reorderedActions = newActions.map((action, i) => ({ ...action, order: i + 1 }));
    onActionsChange(reorderedActions);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    handleMoveAction(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Actions du workflow</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {actions.length} action{actions.length !== 1 ? 's' : ''} configurée{actions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={(value) => handleAddAction(value as WorkflowActionType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ajouter une action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddAction()}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {actions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-2">Aucune action configurée</p>
            <p className="text-xs text-muted-foreground text-center mb-4">
              Ajoutez des actions pour créer votre workflow automatisé
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAddAction()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter votre première action
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {actions
            .sort((a, b) => a.order - b.order)
            .map((action, index) => {
              const isExpanded = expandedAction === index;
              const isDragging = draggedIndex === index;

              return (
                <Card
                  key={index}
                  className={cn(
                    'transition-all',
                    isDragging && 'opacity-50',
                    isExpanded && 'border-primary'
                  )}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <CardContent className="p-0">
                    <div
                      className="flex items-center gap-3 p-4 cursor-move hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedAction(isExpanded ? null : index)}
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 flex items-center gap-3">
                        <Badge variant="outline" className="flex-shrink-0">
                          {action.order}
                        </Badge>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {ACTION_OPTIONS.find(opt => opt.value === action.type)?.icon}
                            <span className="text-sm font-medium">
                              {ACTION_OPTIONS.find(opt => opt.value === action.type)?.label || action.type}
                            </span>
                          </div>
                          {!isExpanded && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {action.type === 'send_email' && action.config?.template_id && (
                                <>Template: {action.config.template_id}</>
                              )}
                              {action.type === 'wait' && action.config?.duration && (
                                <>{action.config.duration} minutes</>
                              )}
                              {(action.type === 'add_tag' || action.type === 'remove_tag') && action.config?.tag && (
                                <>Tag: {action.config.tag}</>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAction(index);
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t">
                        <WorkflowActionEditor
                          action={action}
                          index={index}
                          onUpdate={(updatedAction) => handleUpdateAction(index, updatedAction)}
                          onRemove={() => handleRemoveAction(index)}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
};

