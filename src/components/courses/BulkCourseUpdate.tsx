import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Edit,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CourseStatus } from './CourseStatusIndicator';
import { CourseCategory } from './CoursesList';

/**
 * Champ modifiable pour les mises à jour groupées
 */
export type BulkUpdateField = 
  | 'price'
  | 'maxStudents'
  | 'status'
  | 'category'
  | 'isActive';

/**
 * Mode de mise à jour
 */
export type UpdateMode = 'set' | 'adjust';

/**
 * Cours à mettre à jour
 */
export interface BulkUpdateCourse {
  id: string;
  name: string;
  currentPrice: number;
  currentMaxStudents: number;
  currentStatus: CourseStatus;
  currentCategory: CourseCategory;
  isActive: boolean;
  enrolledStudents: number;
}

/**
 * Changement à appliquer
 */
export interface BulkUpdateChange {
  field: BulkUpdateField;
  mode: UpdateMode;
  value: string | number | boolean;
}

/**
 * Props pour BulkCourseUpdate
 */
export interface BulkCourseUpdateProps {
  /** Cours disponibles pour mise à jour */
  courses: BulkUpdateCourse[];
  
  /** Callback de mise à jour groupée */
  onBulkUpdate?: (courseIds: string[], changes: BulkUpdateChange) => void;
  
  /** Chargement en cours */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Afficher l'import/export CSV */
  showCsvFeatures?: boolean;
}

/**
 * Configuration des champs modifiables
 */
const FIELD_CONFIG: Record<
  BulkUpdateField,
  {
    label: string;
    icon: React.ElementType;
    supportsModes: UpdateMode[];
    unit?: string;
  }
> = {
  price: {
    label: 'Prix',
    icon: DollarSign,
    supportsModes: ['set', 'adjust'],
    unit: 'EUR',
  },
  maxStudents: {
    label: 'Capacité max',
    icon: Users,
    supportsModes: ['set', 'adjust'],
    unit: 'étudiants',
  },
  status: {
    label: 'Statut',
    icon: Tag,
    supportsModes: ['set'],
  },
  category: {
    label: 'Catégorie',
    icon: Tag,
    supportsModes: ['set'],
  },
  isActive: {
    label: 'Actif/Inactif',
    icon: Eye,
    supportsModes: ['set'],
  },
};

/**
 * Catégories de cours
 */
const CATEGORY_LABELS: Record<CourseCategory, string> = {
  development: 'Développement',
  design: 'Design',
  business: 'Business',
  marketing: 'Marketing',
  data_science: 'Data Science',
  personal_development: 'Développement Personnel',
  other: 'Autre',
};

/**
 * BulkCourseUpdate - Mise à jour groupée de cours
 * 
 * @example
 * ```tsx
 * <BulkCourseUpdate 
 *   courses={myCourses}
 *   onBulkUpdate={(ids, changes) => updateCourses(ids, changes)}
 *   showCsvFeatures={true}
 * />
 * ```
 */
export const BulkCourseUpdate: React.FC<BulkCourseUpdateProps> = ({
  courses,
  onBulkUpdate,
  isLoading = false,
  className,
  showCsvFeatures = true,
}) => {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [updateField, setUpdateField] = useState<BulkUpdateField>('price');
  const [updateMode, setUpdateMode] = useState<UpdateMode>('set');
  const [updateValue, setUpdateValue] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Sélection des cours
  const toggleCourseSelection = (courseId: string) => {
    const newSelection = new Set(selectedCourses);
    if (newSelection.has(courseId)) {
      newSelection.delete(courseId);
    } else {
      newSelection.add(courseId);
    }
    setSelectedCourses(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedCourses.size === courses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(courses.map((c) => c.id)));
    }
  };

  // Aperçu des changements
  const previewChanges = useMemo(() => {
    if (!updateValue) return [];

    return courses
      .filter((course) => selectedCourses.has(course.id))
      .map((course) => {
        let newValue: any;

        switch (updateField) {
          case 'price':
            if (updateMode === 'set') {
              newValue = parseFloat(updateValue);
            } else {
              const adjustment = updateValue.includes('%')
                ? course.currentPrice * (parseFloat(updateValue) / 100)
                : parseFloat(updateValue);
              newValue = course.currentPrice + adjustment;
            }
            break;

          case 'maxStudents':
            if (updateMode === 'set') {
              newValue = parseInt(updateValue);
            } else {
              newValue = course.currentMaxStudents + parseInt(updateValue);
            }
            break;

          case 'status':
            newValue = updateValue;
            break;

          case 'category':
            newValue = updateValue;
            break;

          case 'isActive':
            newValue = updateValue === 'true';
            break;
        }

        return {
          courseId: course.id,
          courseName: course.name,
          currentValue: course[`current${updateField.charAt(0).toUpperCase() + updateField.slice(1)}` as keyof BulkUpdateCourse] || course.isActive,
          newValue,
        };
      });
  }, [courses, selectedCourses, updateField, updateMode, updateValue]);

  // Valider et appliquer
  const handleApplyUpdate = () => {
    if (selectedCourses.size === 0 || !updateValue) {
      return;
    }

    const change: BulkUpdateChange = {
      field: updateField,
      mode: updateMode,
      value: updateValue.includes('%') ? updateValue : (updateField === 'isActive' ? updateValue === 'true' : updateField === 'price' || updateField === 'maxStudents' ? parseFloat(updateValue) : updateValue),
    };

    onBulkUpdate?.(Array.from(selectedCourses), change);
    setShowConfirmDialog(false);
    setSelectedCourses(new Set());
    setUpdateValue('');
  };

  // Export CSV template
  const handleExportTemplate = () => {
    const csvContent = [
      ['ID Cours', 'Nom', 'Prix', 'Capacité Max', 'Statut', 'Catégorie', 'Actif'],
      ...courses.map((course) => [
        course.id,
        course.name,
        course.currentPrice,
        course.currentMaxStudents,
        course.currentStatus,
        course.currentCategory,
        course.isActive ? 'true' : 'false',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courses-bulk-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV (simplified)
  const handleImportCSV = () => {
    alert('Fonctionnalité d\'import CSV - À implémenter avec votre backend');
  };

  // Obtenir l'icône de changement
  const getChangeIcon = (currentValue: any, newValue: any) => {
    if (updateField === 'price' || updateField === 'maxStudents') {
      if (newValue > currentValue) {
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      } else if (newValue < currentValue) {
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      }
    }
    return <Edit className="h-3 w-3 text-blue-600" />;
  };

  const fieldConfig = FIELD_CONFIG[updateField];
  const Icon = fieldConfig.icon;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mise à Jour Groupée de Cours</h2>
          <p className="text-muted-foreground">
            Modifiez plusieurs cours en une seule fois
          </p>
        </div>
        {showCsvFeatures && (
          <div className="flex gap-2">
            <Button variant="outline" size="default" onClick={handleExportTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template CSV
            </Button>
            <Button variant="outline" size="default" onClick={handleImportCSV}>
              <Upload className="h-4 w-4 mr-2" />
              Importer CSV
            </Button>
          </div>
        )}
      </div>

      {/* Configuration de la mise à jour */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Configuration de la mise à jour
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Champ à modifier */}
              <div className="space-y-2">
                <Label>Champ à modifier</Label>
                <Select
                  value={updateField}
                  onValueChange={(value: BulkUpdateField) => {
                    setUpdateField(value);
                    setUpdateMode(FIELD_CONFIG[value].supportsModes[0]);
                    setUpdateValue('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode de mise à jour */}
              {fieldConfig.supportsModes.length > 1 && (
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select value={updateMode} onValueChange={(value: UpdateMode) => setUpdateMode(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="set">Définir</SelectItem>
                      <SelectItem value="adjust">Ajuster</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Nouvelle valeur */}
              <div className="space-y-2">
                <Label>
                  Nouvelle valeur
                  {fieldConfig.unit && <span> ({fieldConfig.unit})</span>}
                </Label>
                {updateField === 'status' ? (
                  <Select value={updateValue} onValueChange={setUpdateValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="in_progress">En cours</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                ) : updateField === 'category' ? (
                  <Select value={updateValue} onValueChange={setUpdateValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : updateField === 'isActive' ? (
                  <Select value={updateValue} onValueChange={setUpdateValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'état" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actif</SelectItem>
                      <SelectItem value="false">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={updateValue}
                    onChange={(e) => setUpdateValue(e.target.value)}
                    placeholder={
                      updateMode === 'adjust'
                        ? 'Ex: +10, -5, +15%'
                        : 'Ex: 99'
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* Aide contextuelle */}
          {updateMode === 'adjust' && (updateField === 'price' || updateField === 'maxStudents') && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700">Mode Ajustement</p>
                  <p className="text-blue-600 mt-1">
                    Utilisez <strong>+10</strong> pour augmenter, <strong>-5</strong> pour diminuer,
                    ou <strong>+15%</strong> pour un pourcentage
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Aperçu */}
          {previewChanges.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">
                  Aperçu des modifications ({previewChanges.length})
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {previewChanges.map((preview) => (
                    <div
                      key={preview.courseId}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <span className="text-sm font-medium">{preview.courseName}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {String(preview.currentValue)}
                        </Badge>
                        {getChangeIcon(preview.currentValue, preview.newValue)}
                        <Badge variant="default">
                          {String(preview.newValue)}
                          {updateField === 'price' && <span> → {preview.newValue} EUR</span>}
                          {updateField === 'price' && updateMode === 'set' && <span> → {updateValue} EUR</span>}
                          {updateField === 'price' && updateMode === 'adjust' && <span> → {updateValue.includes('%') ? updateValue : updateValue + ' EUR'}</span>}
                          {updateField === 'maxStudents' && updateMode === 'set' && <span> → {updateValue} étudiants</span>}
                          {updateField === 'maxStudents' && updateMode === 'adjust' && <span> → {updateValue} étudiants</span>}
                          {updateField === 'isActive' && <span> → {updateValue === 'true' ? 'Actif' : 'Inactif'}</span>}
                          {updateField === 'category' && <span> → {CATEGORY_LABELS[updateValue as CourseCategory]}</span>}
                          {updateField === 'status' && <span> → {updateValue}</span>}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCourses(new Set());
                setUpdateValue('');
              }}
              disabled={selectedCourses.size === 0}
            >
              Réinitialiser
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={selectedCourses.size === 0 || !updateValue || isLoading}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Appliquer à {selectedCourses.size} cours
            </Button>
          </div>
        </div>
      </Card>

      {/* Table de sélection des cours */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Sélectionner les cours ({selectedCourses.size}/{courses.length})
            </h3>
            <Button variant="outline" size="sm" onClick={toggleSelectAll}>
              {selectedCourses.size === courses.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={selectedCourses.size === courses.length} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>Cours</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Capacité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>État</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((course) => (
                <TableRow
                  key={course.id}
                  className={cn(
                    'cursor-pointer',
                    selectedCourses.has(course.id) && 'bg-muted/50'
                  )}
                  onClick={() => toggleCourseSelection(course.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedCourses.has(course.id)}
                      onCheckedChange={() => toggleCourseSelection(course.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell>{course.currentPrice} EUR</TableCell>
                  <TableCell>
                    {course.enrolledStudents}/{course.currentMaxStudents}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.currentStatus}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{CATEGORY_LABELS[course.currentCategory]}</Badge>
                  </TableCell>
                  <TableCell>
                    {course.isActive ? (
                      <Badge variant="default" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Inactif
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Dialogue de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la mise à jour groupée</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de modifier <strong>{selectedCourses.size} cours</strong>.
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Résumé des modifications :</p>
            <ul className="text-sm space-y-1">
              <li>• Champ : <strong>{fieldConfig.label}</strong></li>
              <li>• Mode : <strong>{updateMode === 'set' ? 'Définir' : 'Ajuster'}</strong></li>
              <li>• Valeur : <strong>{updateValue}</strong></li>
              <li>• Cours affectés : <strong>{selectedCourses.size}</strong></li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleApplyUpdate}>
              Confirmer la mise à jour
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

BulkCourseUpdate.displayName = 'BulkCourseUpdate';

export default BulkCourseUpdate;

