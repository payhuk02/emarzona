import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_SERVICE_PROJECT_MILESTONES,
  type ServiceProjectMilestoneDraft,
  validateServiceProjectMilestones,
} from '@/lib/service/service-project-milestones';

interface ServiceProjectMilestonesFormProps {
  enabled: boolean;
  milestones: ServiceProjectMilestoneDraft[];
  onChange: (patch: {
    use_project_milestones?: boolean;
    project_milestones?: ServiceProjectMilestoneDraft[];
  }) => void;
  productPrice?: number;
}

export function ServiceProjectMilestonesForm({
  enabled,
  milestones,
  onChange,
  productPrice = 0,
}: ServiceProjectMilestonesFormProps) {
  const rows = milestones.length > 0 ? milestones : DEFAULT_SERVICE_PROJECT_MILESTONES;
  const errors = enabled ? validateServiceProjectMilestones(rows) : [];
  const totalPct = rows.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0);

  const updateRow = (index: number, patch: Partial<ServiceProjectMilestoneDraft>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange({ project_milestones: next });
  };

  return (
    <Card className="border-yellow-200 dark:border-yellow-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Jalons de paiement (projet)</CardTitle>
            <CardDescription>
              Répartissez le paiement sécurisé en plusieurs étapes pour les commandes formules.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor="use-milestones" className="text-sm">
              Activer
            </Label>
            <Switch
              id="use-milestones"
              checked={enabled}
              onCheckedChange={v =>
                onChange({
                  use_project_milestones: v,
                  project_milestones: v ? rows : [],
                })
              }
            />
          </div>
        </div>
      </CardHeader>
      {enabled && (
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Le client paie le(s) jalon(s) « à la commande » immédiatement (escrow). Les jalons « à
              la livraison » sont facturés après validation de la prestation.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.id || index}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end rounded-lg border p-3"
              >
                <div className="sm:col-span-4 space-y-1">
                  <Label className="text-xs">Libellé</Label>
                  <Input
                    value={row.label}
                    onChange={e => updateRow(index, { label: e.target.value })}
                    placeholder="Ex. Démarrage"
                  />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-xs">%</Label>
                  <Input
                    type="number"
                    min={5}
                    max={95}
                    value={row.percentage}
                    onChange={e => updateRow(index, { percentage: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="sm:col-span-4 space-y-1">
                  <Label className="text-xs">Échéance</Label>
                  <Select
                    value={row.trigger}
                    onValueChange={v =>
                      updateRow(index, {
                        trigger: v as ServiceProjectMilestoneDraft['trigger'],
                      })
                    }
                  >
                    <SelectTrigger className="min-h-[40px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="order_placed">À la commande</SelectItem>
                      <SelectItem value="delivery_approved">À la livraison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={rows.length <= 2}
                    onClick={() =>
                      onChange({
                        project_milestones: rows.filter((_, i) => i !== index),
                      })
                    }
                    aria-label="Supprimer le jalon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {productPrice > 0 && (
                  <p className="sm:col-span-12 text-xs text-muted-foreground">
                    ≈ {Math.round((productPrice * row.percentage) / 100).toLocaleString()} sur le
                    devis
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Total : {totalPct} %</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rows.length >= 5}
              onClick={() =>
                onChange({
                  project_milestones: [
                    ...rows,
                    {
                      label: `Jalon ${rows.length + 1}`,
                      percentage: Math.max(5, 100 - totalPct),
                      trigger: 'delivery_approved',
                    },
                  ],
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter un jalon
            </Button>
          </div>

          {errors.length > 0 && (
            <ul className="text-sm text-destructive space-y-1">
              {errors.map(msg => (
                <li key={msg}>• {msg}</li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
