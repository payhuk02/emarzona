/**
 * Barre de progression du cours
 * Affiche le pourcentage de complétion
 * Date : 27 octobre 2025
 * Phase : 5 - Progression
 */

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Clock, CheckCircle2 } from '@/components/icons';
import { useCourseProgressPercentage } from '@/hooks/courses/useCourseProgress';

interface CourseProgressBarProps {
  enrollmentId: string;
  totalLessons: number;
}

export const CourseProgressBar = ({ enrollmentId, totalLessons }: CourseProgressBarProps) => {
  const { percentage, completedLessons } = useCourseProgressPercentage(enrollmentId);

  return (
    <Card className="p-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
      <div className="space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Votre progression</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {percentage}%
          </div>
        </div>

        {/* Barre de progression */}
        <Progress value={percentage} className="h-3" />

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>
              {completedLessons} / {totalLessons} leçons complétées
            </span>
          </div>

          {percentage === 100 && (
            <div className="flex items-center gap-2 text-green-600 font-semibold">
              <Trophy className="w-4 h-4" />
              Cours terminé ! 🎉
            </div>
          )}
        </div>

        {/* Message d'encouragement */}
        {percentage > 0 && percentage < 100 && (
          <p className="text-xs text-gray-500 italic">
            {percentage < 25 && "Vous venez de commencer, continuez comme ça !"}
            {percentage >= 25 && percentage < 50 && "Bon début ! Vous êtes sur la bonne voie."}
            {percentage >= 50 && percentage < 75 && "Plus de la moitié ! Vous y êtes presque."}
            {percentage >= 75 && percentage < 100 && "Dernière ligne droite ! Ne lâchez rien."}
          </p>
        )}
      </div>
    </Card>
  );
};

