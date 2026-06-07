/**
 * Langue + déconnexion — barre utilitaire (topnav, shell, ou topnav mobile sheet).
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
  /** topnav = barre sombre | shell = zone contenu claire | floating = sheet mobile */
  variant?: 'shell' | 'topnav' | 'floating';
  className?: string;
};

export function UserUtilityActions({ variant = 'shell', className }: UserUtilityActionsProps) {
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
  const isShell = variant === 'shell' || variant === 'floating';

  return (
    <div
      className={cn(
        'flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap justify-end max-w-full',
        variant === 'floating' && 'w-full justify-between',
        className
      )}
    >
      <LanguageSwitcher
        display={isTopnav ? 'nav' : isShell ? 'shell' : 'default'}
        variant={isTopnav ? 'ghost' : 'ghost'}
        className="shrink-0"
      />

      <span
        className={cn('hidden sm:block h-5 w-px bg-border/60 shrink-0', isTopnav && 'bg-white/15')}
        aria-hidden
      />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className={cn(
          'h-9 min-h-9 gap-1.5 touch-manipulation shrink-0 rounded-lg',
          'text-muted-foreground hover:text-foreground hover:bg-accent/60',
          isTopnav &&
            'topnav-icon-btn text-muted-foreground hover:text-white hover:bg-white/10 px-2.5',
          isShell && 'px-2 sm:px-2.5'
        )}
        aria-label={t('auth.signOut', 'Déconnexion')}
      >
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        <span
          className={cn('text-sm font-medium', isTopnav ? 'hidden lg:inline' : 'hidden md:inline')}
        >
          {t('auth.signOut', 'Déconnexion')}
        </span>
      </Button>
    </div>
  );
}
