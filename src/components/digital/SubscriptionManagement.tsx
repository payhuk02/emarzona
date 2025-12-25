/**
 * Subscription Management Component
 * Date: 2025-01-27
 * 
 * Composant pour gérer les subscriptions : essais gratuits, pauses, upgrades/downgrades
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Gift,
  Calendar,
  Info,
} from 'lucide-react';
import { usePauseSubscription, useResumeSubscription, useStartTrial, useSchedulePlanChange } from '@/hooks/digital/useSubscriptionEnhancements';
import { DigitalProductSubscription } from '@/hooks/digital/useDigitalSubscriptions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SubscriptionManagementProps {
  subscription: DigitalProductSubscription;
  availablePlans?: Array<{
    id: string;
    name: string;
    price: number;
    interval: string;
  }>;
  onUpdate?: () => void;
}

export const SubscriptionManagement = ({
  subscription,
  availablePlans = [],
  onUpdate,
}: SubscriptionManagementProps) => {
  const [trialDays, setTrialDays] = useState(7);
  const [pauseUntil, setPauseUntil] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [planChangeType, setPlanChangeType] = useState<'upgrade' | 'downgrade' | 'switch'>('upgrade');
  
  const startTrial = useStartTrial();
  const pauseSubscription = usePauseSubscription();
  const resumeSubscription = useResumeSubscription();
  const schedulePlanChange = useSchedulePlanChange();

  const isInTrial = subscription.status === 'trialing' || subscription.is_in_trial;
  const isPaused = subscription.is_paused || subscription.status === 'paused';

  const handleStartTrial = async () => {
    await startTrial.mutateAsync({
      subscriptionId: subscription.id,
      trialDays,
    });
    onUpdate?.();
  };

  const handlePause = async () => {
    if (!pauseUntil) {
      return;
    }
    await pauseSubscription.mutateAsync({
      subscriptionId: subscription.id,
      pausedUntil: pauseUntil,
      reason: pauseReason || undefined,
    });
    onUpdate?.();
  };

  const handleResume = async () => {
    await resumeSubscription.mutateAsync(subscription.id);
    onUpdate?.();
  };

  const handleSchedulePlanChange = async () => {
    if (!selectedPlanId) {
      return;
    }
    await schedulePlanChange.mutateAsync({
      subscriptionId: subscription.id,
      newSubscriptionId: selectedPlanId,
      changeType: planChangeType,
    });
    onUpdate?.();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestion de l'abonnement</CardTitle>
          <CardDescription>
            Gérez l'essai gratuit, les pauses et les changements de plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statut actuel */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Statut actuel</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                  {subscription.status}
                </Badge>
                {isInTrial && <Badge variant="outline">Essai gratuit</Badge>}
                {isPaused && <Badge variant="destructive">En pause</Badge>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Période actuelle</p>
              <p className="text-sm font-semibold">
                {format(new Date(subscription.current_period_start), 'dd/MM/yyyy', { locale: fr })} - {format(new Date(subscription.current_period_end), 'dd/MM/yyyy', { locale: fr })}
              </p>
            </div>
          </div>

          {/* Essai gratuit */}
          {!isInTrial && subscription.status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Essai gratuit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre de jours d'essai</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={trialDays}
                    onChange={(e) => setTrialDays(Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleStartTrial}
                  disabled={startTrial.isPending}
                  variant="outline"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Démarrer l'essai gratuit
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pause / Reprendre */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? 'Reprendre' : 'Mettre en pause'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isPaused ? (
                <>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      En pause jusqu'au: {subscription.paused_until ? format(new Date(subscription.paused_until), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                    </p>
                    {subscription.pause_reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Raison: {subscription.pause_reason}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleResume}
                    disabled={resumeSubscription.isPending}
                    variant="default"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Reprendre l'abonnement
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <Label>Reprendre le</Label>
                    <Input
                      type="date"
                      value={pauseUntil}
                      onChange={(e) => setPauseUntil(e.target.value)}
                      className="mt-2"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label>Raison (optionnel)</Label>
                    <Textarea
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                      className="mt-2"
                      placeholder="Ex: Voyage, pause temporaire..."
                    />
                  </div>
                  <Button
                    onClick={handlePause}
                    disabled={pauseSubscription.isPending || !pauseUntil}
                    variant="outline"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Mettre en pause
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Upgrade/Downgrade */}
          {availablePlans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {planChangeType === 'upgrade' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  Changer de plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Type de changement</Label>
                  <Select
                    value={planChangeType}
                    onValueChange={(value: 'upgrade' | 'downgrade' | 'switch') => setPlanChangeType(value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upgrade">Upgrade (Améliorer)</SelectItem>
                      <SelectItem value="downgrade">Downgrade (Réduire)</SelectItem>
                      <SelectItem value="switch">Switch (Changer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nouveau plan</Label>
                  <Select
                    value={selectedPlanId}
                    onValueChange={setSelectedPlanId}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePlans
                        .filter(p => p.id !== subscription.id)
                        .map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - {plan.price.toLocaleString()} XOF / {plan.interval}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                      <p>
                        Le changement de plan sera appliqué à la fin de la période actuelle.
                        Un montant proraté sera calculé automatiquement.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSchedulePlanChange}
                  disabled={schedulePlanChange.isPending || !selectedPlanId}
                  variant="outline"
                >
                  {planChangeType === 'upgrade' ? (
                    <TrendingUp className="h-4 w-4 mr-2" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-2" />
                  )}
                  Planifier le changement
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

