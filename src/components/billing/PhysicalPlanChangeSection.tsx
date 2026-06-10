import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { PHYSICAL_PLAN_CARDS, physicalPlanLabel } from '@/lib/billing/physical-plan-display';
import {
  initiatePhysicalPlanChange,
  previewPhysicalPlanChange,
} from '@/lib/billing/physical-plan-change';
import type { PhysicalPlanSlug } from '@/lib/billing/physical-plan-capabilities';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';

type PhysicalPlanChangeSectionProps = {
  storeId: string;
  currentPlanSlug: PhysicalPlanSlug;
  subscriptionStatus: string;
  onChanged?: () => void;
};

const PLAN_RANK: Record<string, number> = {
  physical_basic: 1,
  physical_standard: 2,
  physical_premium: 3,
};

export function PhysicalPlanChangeSection({
  storeId,
  currentPlanSlug,
  subscriptionStatus,
  onChanged,
}: PhysicalPlanChangeSectionProps) {
  const { toast } = useToast();
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);

  if (!currentPlanSlug || !['active', 'trialing', 'past_due'].includes(subscriptionStatus)) {
    return null;
  }

  const currentRank = PLAN_RANK[currentPlanSlug] ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Changer de plan</CardTitle>
        <CardDescription>
          Plan actuel : <strong>{physicalPlanLabel(currentPlanSlug)}</strong>. Les upgrades sont
          facturés au prorata ; les downgrades prennent effet en fin de période.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {PHYSICAL_PLAN_CARDS.map(plan => {
          const rank = PLAN_RANK[plan.slug] ?? 0;
          const isCurrent = plan.slug === currentPlanSlug;
          const isUpgrade = rank > currentRank;
          const isDowngrade = rank < currentRank;

          return (
            <div
              key={plan.slug}
              className={`rounded-lg border p-3 space-y-2 ${
                isCurrent ? 'border-primary ring-1 ring-primary/20' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{plan.label}</p>
                {isCurrent && <Badge variant="secondary">Actuel</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">{plan.tagline}</p>
              <p className="text-lg font-bold">{formatCurrency(plan.price)}</p>
              <p className="text-xs text-muted-foreground">/ mois</p>

              {!isCurrent && (
                <Button
                  size="sm"
                  variant={isUpgrade ? 'default' : 'outline'}
                  className="w-full"
                  disabled={loadingSlug !== null}
                  onClick={async () => {
                    setLoadingSlug(plan.slug);
                    try {
                      const preview = await previewPhysicalPlanChange(storeId, plan.slug);

                      if (preview.change_type === 'same') return;

                      if (preview.change_type === 'downgrade') {
                        const proceed = window.confirm(
                          `Passer au plan ${plan.label} à la fin de votre période en cours ?`
                        );
                        if (!proceed) return;
                      }

                      if (preview.requires_payment && preview.prorated_amount > 0) {
                        const proceed = window.confirm(
                          `Upgrade vers ${plan.label} : prorata de ${formatCurrency(preview.prorated_amount)} ${preview.currency} (${preview.days_remaining} j. restants). Continuer ?`
                        );
                        if (!proceed) return;
                      }

                      const {
                        data: { user },
                      } = await supabase.auth.getUser();
                      if (!user?.email) throw new Error('Email requis');

                      const result = await initiatePhysicalPlanChange(
                        storeId,
                        plan.slug,
                        user.email,
                        (user.user_metadata?.full_name as string | undefined) ?? undefined
                      );

                      if (result.checkoutUrl) {
                        window.location.href = result.checkoutUrl;
                        return;
                      }

                      toast({
                        title: isUpgrade ? 'Plan mis à jour' : 'Changement planifié',
                        description:
                          result.message ??
                          (isDowngrade
                            ? 'Le nouveau plan sera actif à la fin de la période.'
                            : 'Votre plan a été mis à jour.'),
                      });
                      onChanged?.();
                    } catch (e: unknown) {
                      toast({
                        title: 'Erreur',
                        description: e instanceof Error ? e.message : 'Changement impossible',
                        variant: 'destructive',
                      });
                    } finally {
                      setLoadingSlug(null);
                    }
                  }}
                >
                  {loadingSlug === plan.slug ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isUpgrade ? (
                    <>
                      <ArrowUp className="h-3 w-3 mr-1" />
                      Upgrader
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-3 w-3 mr-1" />
                      Downgrader
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
