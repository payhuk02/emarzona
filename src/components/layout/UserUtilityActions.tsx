/**
 * Langue + déconnexion — barre utilitaire en haut à droite (hors sidebar).
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut } from '@/components/icons';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type UserUtilityActionsProps = {
  /** Style intégré à la topnav sombre */
  variant?: 'floating' | 'topnav';
  className?: string;
};

export function UserUtilityActions({ variant = 'floating', className }: UserUtilityActionsProps) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: t('auth.signOutSuccess', 'Déconnexion réussie'),
        description: t('auth.signOutSuccessDescription', 'Vous avez été déconnecté avec succès.'),
      });
      navigate('/');
    } catch {
      toast({
        title: t('common.error', 'Erreur'),
        description: t('auth.signOutError', 'Une erreur est survenue lors de la déconnexion.'),
        variant: 'destructive',
      });
    }
  };

  const isTopnav = variant === 'topnav';

  return (
    <div
      className={cn(
        'flex items-center gap-1 sm:gap-1.5 shrink-0',
        !isTopnav &&
          'rounded-lg border border-border/70 bg-background/95 backdrop-blur-sm px-1.5 py-1 shadow-sm',
        className
      )}
    >
      {isTopnav ? (
        <LanguageSwitcher display="nav" />
      ) : (
        <LanguageSwitcher variant="outline" showLabel={false} className="h-9" />
      )}
      <Button
        type="button"
        variant={isTopnav ? 'ghost' : 'outline'}
        size="sm"
        onClick={handleSignOut}
        className={cn(
          'h-9 gap-1.5 touch-manipulation',
          isTopnav && 'topnav-icon-btn text-muted-foreground hover:text-white px-2.5'
        )}
        aria-label={t('auth.signOut', 'Déconnexion')}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        <span
          className={cn('text-sm font-medium', isTopnav ? 'hidden lg:inline' : 'hidden sm:inline')}
        >
          {t('auth.signOut', 'Déconnexion')}
        </span>
      </Button>
    </div>
  );
}
