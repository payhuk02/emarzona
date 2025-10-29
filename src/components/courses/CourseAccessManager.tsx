import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Lock,
  Unlock,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  GraduationCap,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Type de contenu drip
 */
export type DripContentType = 'immediate' | 'scheduled' | 'sequential';

/**
 * Leçon avec contrôle d'accès
 */
export interface AccessControlledLesson {
  id: string;
  title: string;
  order: number;
  isLocked: boolean;
  unlockDate?: Date | string;
  prerequisiteLessons?: string[];
  estimatedDuration: number; // minutes
}

/**
 * Prérequis de cours
 */
export interface CoursePrerequisite {
  id: string;
  courseId: string;
  courseName: string;
  isCompleted: boolean;
  completionRate: number;
}

/**
 * Restriction géographique
 */
export interface GeoRestriction {
  type: 'allowed' | 'blocked';
  countries: string[]; // codes ISO
}

/**
 * Configuration d'accès
 */
export interface AccessConfig {
  // Drip content
  dripContentEnabled: boolean;
  dripContentType: DripContentType;
  dripInterval?: number; // jours entre chaque leçon
  dripStartDate?: Date | string;
  
  // Prérequis
  prerequisitesEnabled: boolean;
  prerequisites: CoursePrerequisite[];
  
  // Limitations temporelles
  timeLimitEnabled: boolean;
  accessStartDate?: Date | string;
  accessEndDate?: Date | string;
  
  // Restrictions géographiques
  geoRestrictionEnabled: boolean;
  geoRestriction?: GeoRestriction;
  
  // Autres
  requireEmailVerification: boolean;
  maxDevices?: number;
}

/**
 * Props pour CourseAccessManager
 */
export interface CourseAccessManagerProps {
  /** ID du cours */
  courseId: string;
  
  /** Configuration actuelle */
  currentConfig: AccessConfig;
  
  /** Leçons du cours */
  lessons: AccessControlledLesson[];
  
  /** Callback de mise à jour */
  onUpdateConfig?: (config: AccessConfig) => void;
  
  /** Callback de mise à jour des leçons */
  onUpdateLessons?: (lessons: AccessControlledLesson[]) => void;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * CourseAccessManager - Gestionnaire de contrôle d'accès aux cours
 * 
 * @example
 * ```tsx
 * <CourseAccessManager 
 *   courseId="CRS-001"
 *   currentConfig={accessConfig}
 *   lessons={courseLessons}
 *   onUpdateConfig={(config) => saveConfig(config)}
 * />
 * ```
 */
export const CourseAccessManager: React.FC<CourseAccessManagerProps> = ({
  courseId,
  currentConfig,
  lessons,
  onUpdateConfig,
  onUpdateLessons,
  className,
}) => {
  const [config, setConfig] = useState<AccessConfig>(currentConfig);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Mettre à jour la configuration
  const updateConfig = (updates: Partial<AccessConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onUpdateConfig?.(newConfig);
  };

  // Verrouiller/Déverrouiller une leçon
  const toggleLessonLock = (lessonId: string) => {
    const updatedLessons = lessons.map((lesson) =>
      lesson.id === lessonId ? { ...lesson, isLocked: !lesson.isLocked } : lesson
    );
    onUpdateLessons?.(updatedLessons);
  };

  // Formater la date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'dd MMM yyyy', { locale: fr });
  };

  // Compter les leçons verrouillées/déverrouillées
  const unlockedCount = lessons.filter((l) => !l.isLocked).length;
  const lockedCount = lessons.filter((l) => l.isLocked).length;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Contrôle d'Accès au Cours</h2>
        <p className="text-muted-foreground">
          Gérez qui peut accéder au cours et quand
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Unlock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Déverrouillé</p>
              <p className="text-xl font-bold">{unlockedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Verrouillé</p>
              <p className="text-xl font-bold">{lockedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total leçons</p>
              <p className="text-xl font-bold">{lessons.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Drip Content */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Drip Content</h3>
              <p className="text-sm text-muted-foreground">
                Libérez le contenu progressivement
              </p>
            </div>
          </div>
          <Switch
            checked={config.dripContentEnabled}
            onCheckedChange={(checked) => updateConfig({ dripContentEnabled: checked })}
          />
        </div>

        {config.dripContentEnabled && (
          <>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type de libération</Label>
                <Select
                  value={config.dripContentType}
                  onValueChange={(value: DripContentType) =>
                    updateConfig({ dripContentType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immédiat (tout déverrouillé)</SelectItem>
                    <SelectItem value="scheduled">Planifié (dates fixes)</SelectItem>
                    <SelectItem value="sequential">Séquentiel (après complétion)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.dripContentType === 'scheduled' && (
                <>
                  <div className="space-y-2">
                    <Label>Date de démarrage</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {config.dripStartDate
                            ? formatDate(config.dripStartDate)
                            : 'Sélectionner une date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            config.dripStartDate
                              ? new Date(config.dripStartDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            updateConfig({ dripStartDate: date?.toISOString() })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Intervalle (jours entre chaque leçon)</Label>
                    <Input
                      type="number"
                      value={config.dripInterval || 1}
                      onChange={(e) =>
                        updateConfig({ dripInterval: parseInt(e.target.value) || 1 })
                      }
                      min={1}
                    />
                  </div>
                </>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-700">Comment ça fonctionne ?</p>
                    <p className="text-blue-600 mt-1">
                      {config.dripContentType === 'immediate' &&
                        'Toutes les leçons sont accessibles immédiatement après inscription.'}
                      {config.dripContentType === 'scheduled' &&
                        'Les leçons se débloquent selon un calendrier fixe.'}
                      {config.dripContentType === 'sequential' &&
                        'Chaque leçon se débloque après complétion de la précédente.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Prérequis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Prérequis</h3>
              <p className="text-sm text-muted-foreground">
                Cours requis avant inscription
              </p>
            </div>
          </div>
          <Switch
            checked={config.prerequisitesEnabled}
            onCheckedChange={(checked) => updateConfig({ prerequisitesEnabled: checked })}
          />
        </div>

        {config.prerequisitesEnabled && config.prerequisites.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              {config.prerequisites.map((prereq) => (
                <div
                  key={prereq.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{prereq.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      Complétion: {prereq.completionRate}%
                    </p>
                  </div>
                  {prereq.isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Limitations temporelles */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Limitations Temporelles</h3>
              <p className="text-sm text-muted-foreground">
                Période d'accès au cours
              </p>
            </div>
          </div>
          <Switch
            checked={config.timeLimitEnabled}
            onCheckedChange={(checked) => updateConfig({ timeLimitEnabled: checked })}
          />
        </div>

        {config.timeLimitEnabled && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {config.accessStartDate
                        ? formatDate(config.accessStartDate)
                        : 'Début'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        config.accessStartDate
                          ? new Date(config.accessStartDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        updateConfig({ accessStartDate: date?.toISOString() })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {config.accessEndDate
                        ? formatDate(config.accessEndDate)
                        : 'Fin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        config.accessEndDate
                          ? new Date(config.accessEndDate)
                          : undefined
                      }
                      onSelect={(date) =>
                        updateConfig({ accessEndDate: date?.toISOString() })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Restrictions géographiques */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Globe className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Restrictions Géographiques</h3>
              <p className="text-sm text-muted-foreground">
                Limiter l'accès par pays
              </p>
            </div>
          </div>
          <Switch
            checked={config.geoRestrictionEnabled}
            onCheckedChange={(checked) =>
              updateConfig({ geoRestrictionEnabled: checked })
            }
          />
        </div>

        {config.geoRestrictionEnabled && (
          <>
            <Separator className="my-4" />
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-700">Fonctionnalité Avancée</p>
                  <p className="text-yellow-600 mt-1">
                    La restriction géographique nécessite une configuration backend
                    supplémentaire.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Autres paramètres */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autres Paramètres de Sécurité
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Vérification email requise</p>
              <p className="text-xs text-muted-foreground">
                L'étudiant doit vérifier son email avant d'accéder
              </p>
            </div>
            <Switch
              checked={config.requireEmailVerification}
              onCheckedChange={(checked) =>
                updateConfig({ requireEmailVerification: checked })
              }
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Nombre maximum d'appareils</Label>
            <Input
              type="number"
              value={config.maxDevices || ''}
              onChange={(e) =>
                updateConfig({ maxDevices: parseInt(e.target.value) || undefined })
              }
              placeholder="Illimité"
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour autoriser un nombre illimité d'appareils
            </p>
          </div>
        </div>
      </Card>

      {/* Gestion des leçons */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Gestion des Leçons Individuelles</h3>
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                lesson.isLocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded',
                    lesson.isLocked ? 'bg-red-100' : 'bg-green-100'
                  )}
                >
                  {lesson.isLocked ? (
                    <Lock className="h-4 w-4 text-red-600" />
                  ) : (
                    <Unlock className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{lesson.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Leçon #{lesson.order} • {lesson.estimatedDuration}min
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleLessonLock(lesson.id)}
              >
                {lesson.isLocked ? 'Déverrouiller' : 'Verrouiller'}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

CourseAccessManager.displayName = 'CourseAccessManager';

export default CourseAccessManager;

