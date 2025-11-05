/**
 * Drip Content Configuration Component
 * Interface pour configurer le drip content avec calendrier visuel
 */

import { useState, useMemo } from 'react';
import { Calendar, Clock, Lock, Unlock, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCourseDetail } from '@/hooks/courses/useCourseDetail';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, addWeeks, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface DripContentConfigProps {
  courseId: string;
  onSuccess?: () => void;
}

export const DripContentConfig = ({ courseId, onSuccess }: DripContentConfigProps) => {
  const { data: courseData } = useCourseDetail(courseId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const course = courseData?.course;
  const sections = courseData?.sections || [];
  const [isUpdating, setIsUpdating] = useState(false);

  const [dripEnabled, setDripEnabled] = useState(course?.drip_enabled || false);
  const [dripType, setDripType] = useState<'daily' | 'weekly' | 'none'>(
    (course?.drip_type as 'daily' | 'weekly' | 'none') || 'none'
  );
  const [dripInterval, setDripInterval] = useState(course?.drip_interval || 1);

  // Calculer le calendrier de déverrouillage
  const unlockSchedule = useMemo(() => {
    if (!dripEnabled || dripType === 'none' || !courseData) {
      return [];
    }

    const schedule: Array<{
      sectionId: string;
      sectionTitle: string;
      orderIndex: number;
      unlockAfterDays: number;
      unlockDate: Date | null;
      isLocked: boolean;
    }> = [];

    sections.forEach((section, index) => {
      let unlockAfterDays = 0;
      
      if (dripType === 'daily') {
        unlockAfterDays = dripInterval * (index + 1);
      } else if (dripType === 'weekly') {
        unlockAfterDays = dripInterval * 7 * (index + 1);
      }

      schedule.push({
        sectionId: section.id,
        sectionTitle: section.title,
        orderIndex: section.order_index,
        unlockAfterDays,
        unlockDate: dripEnabled ? new Date(Date.now() + unlockAfterDays * 24 * 60 * 60 * 1000) : null,
        isLocked: section.is_locked,
      });
    });

    return schedule;
  }, [dripEnabled, dripType, dripInterval, sections, courseData]);

  const handleSave = async () => {
    if (!course) return;

    setIsUpdating(true);

    try {
      // Mettre à jour le cours
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          drip_enabled: dripEnabled,
          drip_type: dripType,
          drip_interval: dripInterval,
        })
        .eq('id', course.id);

      if (courseError) throw courseError;

      // Mettre à jour les sections si nécessaire
      if (dripEnabled && dripType !== 'none') {
        for (const item of unlockSchedule) {
          const { error: sectionError } = await supabase
            .from('course_sections')
            .update({
              is_locked: item.orderIndex > 0, // Première section toujours déverrouillée
              unlock_after_days: item.unlockAfterDays,
            })
            .eq('id', item.sectionId);

          if (sectionError) {
            logger.error('Error updating section', { error: sectionError, sectionId: item.sectionId });
          }
        }
      } else {
        // Si drip désactivé, déverrouiller toutes les sections
        const { error: unlockError } = await supabase
          .from('course_sections')
          .update({ is_locked: false })
          .eq('course_id', course.id);

        if (unlockError) {
          logger.error('Error unlocking sections', { error: unlockError, courseId: course.id });
        }
      }

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      queryClient.invalidateQueries({ queryKey: ['unlocked-sections'] });

      toast({
        title: '✅ Configuration sauvegardée',
        description: 'Le drip content a été configuré avec succès',
      });

      onSuccess?.();
    } catch (error: unknown) {
      logger.error('Error saving drip content config', { error, courseId });
      const errorMessage = error instanceof Error ? error.message : 'Impossible de sauvegarder la configuration';
      toast({
        title: '❌ Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuration Drip Content
        </CardTitle>
        <CardDescription>
          Configurez la libération progressive du contenu de votre cours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="drip-enabled">Activer le Drip Content</Label>
            <p className="text-sm text-muted-foreground">
              Libérer le contenu progressivement au fil du temps
            </p>
          </div>
          <Switch
            id="drip-enabled"
            checked={dripEnabled}
            onCheckedChange={setDripEnabled}
          />
        </div>

        {dripEnabled && (
          <>
            {/* Drip Type */}
            <div className="space-y-2">
              <Label htmlFor="drip-type">Type de déverrouillage</Label>
              <Select value={dripType} onValueChange={(value: 'daily' | 'weekly' | 'none') => setDripType(value)}>
                <SelectTrigger id="drip-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Drip Interval */}
            {(dripType === 'daily' || dripType === 'weekly') && (
              <div className="space-y-2">
                <Label htmlFor="drip-interval">
                  Intervalle ({dripType === 'daily' ? 'jours' : 'semaines'})
                </Label>
                <Input
                  id="drip-interval"
                  type="number"
                  min={1}
                  value={dripInterval}
                  onChange={(e) => setDripInterval(parseInt(e.target.value) || 1)}
                />
                <p className="text-xs text-muted-foreground">
                  {dripType === 'daily'
                    ? `Chaque section sera déverrouillée tous les ${dripInterval} jour(s)`
                    : `Chaque section sera déverrouillée toutes les ${dripInterval} semaine(s)`}
                </p>
              </div>
            )}

            {/* Schedule Calendar */}
            {unlockSchedule.length > 0 && (
              <div className="space-y-4">
                <Label>Calendrier de déverrouillage</Label>
                <div className="border rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto">
                  {unlockSchedule.map((item, index) => (
                    <div
                      key={item.sectionId}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        item.isLocked ? 'bg-muted/50' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {item.isLocked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Unlock className="h-5 w-5 text-green-600" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.sectionTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            Section {item.orderIndex + 1}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.unlockDate && (
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {format(item.unlockDate, 'dd MMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              J+{item.unlockAfterDays}
                            </p>
                          </div>
                        )}
                        <Badge variant={item.isLocked ? 'secondary' : 'default'}>
                          {item.isLocked ? 'Verrouillée' : 'Déverrouillée'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Alert */}
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Le contenu sera déverrouillé automatiquement selon le calendrier ci-dessus.
                La première section sera toujours disponible immédiatement après l'inscription.
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="flex-1"
          >
            {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

