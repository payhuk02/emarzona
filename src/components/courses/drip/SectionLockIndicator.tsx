/**
 * Section Lock Indicator Component
 * Affiche l'état de verrouillage d'une section avec countdown
 */

import { Lock, Clock, Unlock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSectionUnlockStatus, useNextUnlockDate } from '@/hooks/courses/useDripContent';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SectionLockIndicatorProps {
  sectionId: string;
  enrollmentId: string;
  className?: string;
}

export const SectionLockIndicator = ({
  sectionId,
  enrollmentId,
  className,
}: SectionLockIndicatorProps) => {
  const { data: unlockStatus, isLoading } = useSectionUnlockStatus(sectionId, enrollmentId);
  const { data: nextUnlockDate } = useNextUnlockDate(
    unlockStatus?.course_id,
    sectionId,
    enrollmentId
  );

  if (isLoading) {
    return (
      <Badge variant="secondary" className={cn('', className)}>
        <Clock className="h-3 w-3 mr-1 animate-pulse" />
        Chargement...
      </Badge>
    );
  }

  if (!unlockStatus) {
    return null;
  }

  if (unlockStatus.is_unlocked) {
    return (
      <Badge variant="default" className={cn('bg-green-600', className)}>
        <Unlock className="h-3 w-3 mr-1" />
        Déverrouillée
      </Badge>
    );
  }

  if (nextUnlockDate) {
    const unlockDate = new Date(nextUnlockDate);
    const timeUntilUnlock = formatDistanceToNow(unlockDate, {
      locale: fr,
      addSuffix: true,
    });

    return (
      <Badge variant="secondary" className={cn('', className)}>
        <Lock className="h-3 w-3 mr-1" />
        Déverrouillage {timeUntilUnlock}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn('', className)}>
      <Lock className="h-3 w-3 mr-1" />
      Verrouillée
    </Badge>
  );
};

