import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Edit,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  X,
  Save,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Champs modifiables en bulk
 */
export type BulkUpdateField =
  | 'price'
  | 'duration'
  | 'isActive'
  | 'category'
  | 'maxClients'
  | 'assignedStaff';

/**
 * Mode de mise à jour
 */
export type BulkUpdateMode = 'set' | 'adjust';

/**
 * Service à mettre à jour
 */
export interface BulkServiceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  isActive: boolean;
  maxClients?: number;
  assignedStaff?: string[];
}

/**
 * Changements à appliquer
 */
export interface BulkUpdateChanges {
  field: BulkUpdateField;
  mode: BulkUpdateMode;
  value: any;
}

/**
 * Props pour BulkServiceUpdate
 */
export interface BulkServiceUpdateProps {
  /** Services disponibles */
  services: BulkServiceItem[];
  
  /** Services pré-sélectionnés */
  selectedIds?: string[];
  
  /** Callback après mise à jour */
  onUpdate?: (updates: { id: string; changes: Partial<BulkServiceItem> }[]) => Promise<void>;
  
  /** Catégories disponibles */
  categories?: string[];
  
  /** Staff disponible */
  staffMembers?: string[];
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Afficher l'import CSV */
  enableCsvImport?: boolean;
}

/**
 * BulkServiceUpdate - Mise à jour groupée de services
 * 
 * @example
 * ```tsx
 * <BulkServiceUpdate 
 *   services={services}
 *   selectedIds={['1', '2', '3']}
 *   onUpdate={async (updates) => {
 *     await saveUpdates(updates);
 *   }}
 *   categories={['Coaching', 'Consultation']}
 *   staffMembers={['Dr. Martin', 'Sophie']}
 *   enableCsvImport={true}
 * />
 * ```
 */
export const BulkServiceUpdate: React.FC<BulkServiceUpdateProps> = ({
  services,
  selectedIds: initialSelectedIds = [],
  onUpdate,
  categories = [],
  staffMembers = [],
  className,
  enableCsvImport = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedIds)
  );
  const [updateField, setUpdateField] = useState<BulkUpdateField>('price');
  const [updateMode, setUpdateMode] = useState<BulkUpdateMode>('set');
  const [updateValue, setUpdateValue] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === services.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(services.map((s) => s.id)));
    }
  };

  // Calculer les changements
  const calculateChanges = () => {
    return Array.from(selectedIds).map((id) => {
      const service = services.find((s) => s.id === id)!;
      const changes: Partial<BulkServiceItem> = {};

      switch (updateField) {
        case 'price':
          if (updateMode === 'set') {
            changes.price = parseFloat(updateValue);
          } else {
            // Adjust mode: +/- percentage or fixed amount
            const adjustment = updateValue.includes('%')
              ? service.price * (parseFloat(updateValue) / 100)
              : parseFloat(updateValue);
            changes.price = Math.max(0, service.price + adjustment);
          }
          break;

        case 'duration':
          if (updateMode === 'set') {
            changes.duration = parseInt(updateValue);
          } else {
            changes.duration = Math.max(0, service.duration + parseInt(updateValue));
          }
          break;

        case 'isActive':
          changes.isActive = updateValue === 'true';
          break;

        case 'category':
          changes.category = updateValue;
          break;

        case 'maxClients':
          if (updateMode === 'set') {
            changes.maxClients = parseInt(updateValue);
          } else {
            changes.maxClients = Math.max(
              0,
              (service.maxClients || 0) + parseInt(updateValue)
            );
          }
          break;

        case 'assignedStaff':
          // For staff, value is comma-separated
          changes.assignedStaff = updateValue.split(',').map((s) => s.trim());
          break;
      }

      return { id, changes };
    });
  };

  // Appliquer les changements
  const handleApply = async () => {
    if (!onUpdate) return;

    setIsUpdating(true);
    setUpdateProgress(0);

    const changes = calculateChanges();
    
    try {
      // Simuler un progress (en production, utiliser un vrai callback de progression)
      for (let i = 0; i <= 100; i += 10) {
        setUpdateProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      await onUpdate(changes);
      setShowConfirm(false);
      setSelectedIds(new Set());
      setUpdateValue('');
    } catch (error) {
      logger.error('Error updating services', { error, selectedIds: Array.from(selectedIds) });
    } finally {
      setIsUpdating(false);
      setUpdateProgress(0);
    }
  };

  // Preview changes
  const previewChanges = () => {
    const changes = calculateChanges();
    return changes.map((change) => {
      const service = services.find((s) => s.id === change.id)!;
      return {
        ...service,
        ...change.changes,
      };
    });
  };

  // Export to CSV
  const handleExportCsv = () => {
    const selectedServices = services.filter((s) => selectedIds.has(s.id));
    const csv = [
      ['ID', 'Name', 'Category', 'Price', 'Duration', 'Active', 'MaxClients'].join(','),
      ...selectedServices.map((s) =>
        [
          s.id,
          s.name,
          s.category,
          s.price,
          s.duration,
          s.isActive,
          s.maxClients || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services-bulk-${Date.now()}.csv`;
    a.click();
  };

  // Get field config
  const getFieldConfig = (field: BulkUpdateField) => {
    switch (field) {
      case 'price':
        return {
          label: 'Prix',
          icon: DollarSign,
          placeholder: updateMode === 'set' ? '99' : '+10 ou -10%',
          unit: 'EUR',
        };
      case 'duration':
        return {
          label: 'Durée',
          icon: Clock,
          placeholder: updateMode === 'set' ? '60' : '+15',
          unit: 'min',
        };
      case 'isActive':
        return {
          label: 'Statut actif',
          icon: CheckCircle2,
          placeholder: 'true/false',
          unit: '',
        };
      case 'category':
        return {
          label: 'Catégorie',
          icon: Edit,
          placeholder: 'Sélectionner',
          unit: '',
        };
      case 'maxClients':
        return {
          label: 'Max clients',
          icon: Users,
          placeholder: updateMode === 'set' ? '10' : '+2',
          unit: '',
        };
      case 'assignedStaff':
        return {
          label: 'Staff assigné',
          icon: Users,
          placeholder: 'Noms séparés par virgule',
          unit: '',
        };
    }
  };

  const fieldConfig = getFieldConfig(updateField);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Mise à jour groupée
            </CardTitle>
            <CardDescription>
              Modifier plusieurs services en une seule fois
            </CardDescription>
          </div>
          {enableCsvImport && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Selection status */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">
            {selectedIds.size} service(s) sélectionné(s)
          </p>
          <Button variant="outline" size="sm" onClick={toggleSelectAll}>
            {selectedIds.size === services.length
              ? 'Désélectionner tout'
              : 'Sélectionner tout'}
          </Button>
        </div>

        {/* Services table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === services.length && services.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucun service disponible
                  </TableCell>
                </TableRow>
              ) : (
                services.map((service) => (
                  <TableRow
                    key={service.id}
                    className={cn(
                      selectedIds.has(service.id) && 'bg-muted/50'
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(service.id)}
                        onCheckedChange={() => toggleSelection(service.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.category}</Badge>
                    </TableCell>
                    <TableCell>{service.price} EUR</TableCell>
                    <TableCell>{service.duration} min</TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {selectedIds.size > 0 && (
          <>
            <Separator />

            {/* Update controls */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Modifications à appliquer</h3>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Field selector */}
                <div className="space-y-2">
                  <Label>Champ à modifier</Label>
                  <Select
                    value={updateField}
                    onValueChange={(value) => setUpdateField(value as BulkUpdateField)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Prix</SelectItem>
                      <SelectItem value="duration">Durée</SelectItem>
                      <SelectItem value="isActive">Statut actif</SelectItem>
                      <SelectItem value="category">Catégorie</SelectItem>
                      <SelectItem value="maxClients">Max clients</SelectItem>
                      <SelectItem value="assignedStaff">Staff assigné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mode selector (si applicable) */}
                {!['isActive', 'category', 'assignedStaff'].includes(updateField) && (
                  <div className="space-y-2">
                    <Label>Mode</Label>
                    <Select
                      value={updateMode}
                      onValueChange={(value) => setUpdateMode(value as BulkUpdateMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="set">Définir valeur</SelectItem>
                        <SelectItem value="adjust">Ajuster (+/-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Value input */}
                <div className="space-y-2">
                  <Label>
                    {fieldConfig.label}
                    {fieldConfig.unit && <span> ({fieldConfig.unit})</span>}
                  </Label>
                  {updateField === 'isActive' ? (
                    <Select value={updateValue} onValueChange={setUpdateValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Actif</SelectItem>
                        <SelectItem value="false">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : updateField === 'category' ? (
                    <Select value={updateValue} onValueChange={setUpdateValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={updateValue}
                      onChange={(e) => setUpdateValue(e.target.value)}
                      placeholder={fieldConfig.placeholder}
                    />
                  )}
                </div>
              </div>

              {/* Preview */}
              {updateValue && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        Aperçu des modifications
                      </p>
                      <p className="text-xs text-blue-700 mt-1">
                        {selectedIds.size} service(s) seront modifié(s)
                        {updateField === 'price' && updateMode === 'set' && <span> → {updateValue} EUR</span>}
                        {updateField === 'price' && updateMode === 'adjust' && <span> → {updateValue.includes('%') ? updateValue : updateValue + ' EUR'}</span>}
                        {updateField === 'duration' && updateMode === 'set' && <span> → {updateValue} min</span>}
                        {updateField === 'duration' && updateMode === 'adjust' && <span> → {updateValue} min</span>}
                        {updateField === 'isActive' && <span> → {updateValue === 'true' ? 'Actif' : 'Inactif'}</span>}
                        {updateField === 'category' && <span> → {updateValue}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedIds(new Set());
                    setUpdateValue('');
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!updateValue || selectedIds.size === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Appliquer ({selectedIds.size})
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de modifier {selectedIds.size} service(s).
              Cette action peut être irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Progress during update */}
          {isUpdating && (
            <div className="space-y-2">
              <Progress value={updateProgress} />
              <p className="text-xs text-center text-muted-foreground">
                Mise à jour en cours... {updateProgress}%
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

BulkServiceUpdate.displayName = 'BulkServiceUpdate';

export default BulkServiceUpdate;

