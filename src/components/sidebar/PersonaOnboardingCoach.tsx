/**
 * P1-2 — Coach onboarding personas sidebar (vendeur / acheteur / admin).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  SIDEBAR_PREF_KEYS,
  hasSidebarJsonPref,
  writeSidebarJsonPref,
} from '@/lib/navigation/sidebar-prefs-storage';
import type { SidebarPersona } from '@/config/navigation.types';

type PersonaOnboardingCoachProps = {
  children: ReactNode;
  isAdmin: boolean;
  enabled: boolean;
};

export function PersonaOnboardingCoach({
  children,
  isAdmin,
  enabled,
}: PersonaOnboardingCoachProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (enabled && !hasSidebarJsonPref(SIDEBAR_PREF_KEYS.personaOnboarded)) {
      setOpen(true);
    }
  }, [enabled]);

  const dismiss = () => {
    writeSidebarJsonPref(SIDEBAR_PREF_KEYS.personaOnboarded, true);
    setOpen(false);
  };

  if (!enabled) {
    return <>{children}</>;
  }

  const steps: { persona: SidebarPersona; title: string; description: string }[] = [
    {
      persona: 'seller',
      title: t('sidebar.onboarding.sellerTitle', 'Espace vendeur'),
      description: t(
        'sidebar.onboarding.sellerDescription',
        'Gérez votre boutique, commandes et analytics.'
      ),
    },
    {
      persona: 'buyer',
      title: t('sidebar.onboarding.buyerTitle', 'Espace acheteur'),
      description: t(
        'sidebar.onboarding.buyerDescription',
        'Suivez vos commandes digitales, physiques, cours et services.'
      ),
    },
  ];

  if (isAdmin) {
    steps.push({
      persona: 'admin',
      title: t('sidebar.onboarding.adminTitle', 'Administration'),
      description: t(
        'sidebar.onboarding.adminDescription',
        'Modération plateforme, audit et paramètres globaux.'
      ),
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start" side="bottom">
        <div className="space-y-3">
          <p className="text-sm font-semibold">
            {t('sidebar.onboarding.title', 'Choisissez votre mode de navigation')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(
              'sidebar.onboarding.subtitle',
              'Basculez entre vendeur et acheteur à tout moment via ces onglets.'
            )}
          </p>
          <ul className="space-y-2 text-xs">
            {steps.map(step => (
              <li key={step.persona} className="rounded-md border border-border/60 p-2">
                <p className="font-medium">{step.title}</p>
                <p className="text-muted-foreground mt-0.5">{step.description}</p>
              </li>
            ))}
          </ul>
          <Button size="sm" className="w-full" onClick={dismiss}>
            {t('sidebar.onboarding.dismiss', 'Compris')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
