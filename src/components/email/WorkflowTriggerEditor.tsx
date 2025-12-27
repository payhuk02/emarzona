/**
 * Composant pour configurer le déclencheur d'un workflow
 * Date: 1er Février 2025
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { WorkflowTriggerType } from '@/lib/email/email-workflow-service';

interface WorkflowTriggerEditorProps {
  triggerType: WorkflowTriggerType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export const WorkflowTriggerEditor = ({
  triggerType,
  config,
  onChange,
}: WorkflowTriggerEditorProps) => {
  const updateConfig = (key: string, value: unknown) => {
    onChange({ ...config, [key]: value });
  };

  switch (triggerType) {
    case 'event':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="eventName" className="text-right">
              Nom de l'événement *
            </Label>
            <Input
              id="eventName"
              value={config.event_name || ''}
              onChange={e => updateConfig('event_name', e.target.value)}
              className="col-span-3"
              placeholder="ex: order.completed, cart.abandoned"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="eventFilters" className="text-right pt-2">
              Filtres (JSON)
            </Label>
            <Textarea
              id="eventFilters"
              value={JSON.stringify(config.filters || {}, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateConfig('filters', parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="col-span-3 font-mono text-xs"
              rows={4}
              placeholder='{"store_id": "uuid", "product_type": "physical"}'
            />
          </div>
        </div>
      );

    case 'time':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="scheduleType" className="text-right">
              Type de planification *
            </Label>
            <select
              id="scheduleType"
              value={config.schedule_type || 'daily'}
              onChange={e => updateConfig('schedule_type', e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px] touch-manipulation cursor-pointer"
            >
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="custom">Personnalisé (Cron)</option>
            </select>
          </div>
          {config.schedule_type === 'custom' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cronExpression" className="text-right">
                Expression Cron
              </Label>
              <Input
                id="cronExpression"
                value={config.cron_expression || ''}
                onChange={e => updateConfig('cron_expression', e.target.value)}
                className="col-span-3"
                placeholder="0 9 * * *"
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeOfDay" className="text-right">
              Heure d'exécution
            </Label>
            <Input
              id="timeOfDay"
              type="time"
              value={config.time_of_day || '09:00'}
              onChange={e => updateConfig('time_of_day', e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
      );

    case 'condition':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="conditionExpression" className="text-right pt-2">
              Expression de condition (JSON) *
            </Label>
            <Textarea
              id="conditionExpression"
              value={JSON.stringify(config.condition || {}, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateConfig('condition', parsed);
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              className="col-span-3 font-mono text-xs"
              rows={6}
              placeholder={`{
  "field": "user.order_count",
  "operator": "greater_than",
  "value": 3
}`}
            />
          </div>
          <p className="text-sm text-muted-foreground col-span-4">
            Configurez les conditions qui doivent être remplies pour déclencher le workflow.
          </p>
        </div>
      );

    default:
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Sélectionnez un type de déclencheur</p>
        </div>
      );
  }
};






