/**
 * Composant de visualisation de workflow avec diagramme
 * Date: 2 Février 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Mail, Clock, Tag, Users, Play } from 'lucide-react';
import type { EmailWorkflow, WorkflowAction } from '@/lib/email/email-workflow-service';
import { cn } from '@/lib/utils';

interface WorkflowVisualizerProps {
  workflow: EmailWorkflow;
  className?: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  send_email: <Mail className="h-4 w-4" />,
  wait: <Clock className="h-4 w-4" />,
  add_tag: <Tag className="h-4 w-4" />,
  remove_tag: <Tag className="h-4 w-4" />,
  update_segment: <Users className="h-4 w-4" />,
};

const ACTION_LABELS: Record<string, string> = {
  send_email: 'Envoyer email',
  wait: 'Attendre',
  add_tag: 'Ajouter tag',
  remove_tag: 'Retirer tag',
  update_segment: 'Mettre à jour segment',
};

const TRIGGER_LABELS: Record<string, string> = {
  event: 'Événement',
  time: 'Temps',
  condition: 'Condition',
};

export const WorkflowVisualizer = ({ workflow, className }: WorkflowVisualizerProps) => {
  const sortedActions = [...(workflow.actions || [])].sort((a, b) => a.order - b.order);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Prévisualisation du workflow</CardTitle>
          <Badge variant="outline" className={cn(
            workflow.status === 'active' && 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
            workflow.status === 'paused' && 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
            workflow.status === 'archived' && 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
          )}>
            {workflow.status === 'active' ? 'Actif' : workflow.status === 'paused' ? 'En pause' : 'Archivé'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trigger */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
            <Play className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {TRIGGER_LABELS[workflow.trigger_type] || workflow.trigger_type}
            </span>
            {workflow.trigger_type === 'event' && workflow.trigger_config?.event_name && (
              <Badge variant="secondary" className="ml-2">
                {workflow.trigger_config.event_name}
              </Badge>
            )}
          </div>
          {sortedActions.length > 0 && (
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {sortedActions.map((action, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 w-full px-4 py-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    {ACTION_ICONS[action.type] || <Mail className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {ACTION_LABELS[action.type] || action.type}
                    </div>
                    {action.type === 'send_email' && action.config?.template_id && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Template: {action.config.template_id}
                      </div>
                    )}
                    {action.type === 'wait' && action.config?.duration && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {action.config.duration} minutes
                      </div>
                    )}
                    {(action.type === 'add_tag' || action.type === 'remove_tag') && action.config?.tag && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Tag: {action.config.tag}
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Étape {action.order}
                  </Badge>
                </div>
              </div>
              {index < sortedActions.length - 1 && (
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {sortedActions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <p className="text-sm">Aucune action configurée</p>
            <p className="text-xs mt-1">Ajoutez des actions pour voir la prévisualisation</p>
          </div>
        )}

        {/* Stats */}
        {workflow.execution_count > 0 && (
          <div className="pt-4 border-t space-y-2">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{workflow.execution_count}</div>
                <div className="text-xs text-muted-foreground">Exécutions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{workflow.success_count}</div>
                <div className="text-xs text-muted-foreground">Réussies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{workflow.error_count}</div>
                <div className="text-xs text-muted-foreground">Erreurs</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

