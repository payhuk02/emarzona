/**
 * Composant pour afficher les résultats d'un test A/B
 * Date: 1er Février 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { useEmailABTest, useCalculateABTestWinner } from '@/hooks/email/useEmailABTests';
import type { EmailABTest } from '@/lib/email/email-ab-test-service';
import { cn } from '@/lib/utils';

interface ABTestResultsProps {
  abTestId: string;
}

export const ABTestResults = ({ abTestId }: ABTestResultsProps) => {
  const { data: abTest, isLoading } = useEmailABTest(abTestId);
  const calculateWinner = useCalculateABTestWinner();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!abTest) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Test A/B non trouvé</p>
        </CardContent>
      </Card>
    );
  }

  const variantA = abTest.variant_a;
  const variantB = abTest.variant_b;
  const resultsA = abTest.variant_a_results;
  const resultsB = abTest.variant_b_results;

  // Calculer les taux
  const openRateA = resultsA.delivered > 0 ? (resultsA.opened / resultsA.delivered) * 100 : 0;
  const openRateB = resultsB.delivered > 0 ? (resultsB.opened / resultsB.delivered) * 100 : 0;
  const clickRateA = resultsA.delivered > 0 ? (resultsA.clicked / resultsA.delivered) * 100 : 0;
  const clickRateB = resultsB.delivered > 0 ? (resultsB.clicked / resultsB.delivered) * 100 : 0;

  const hasWinner = !!abTest.winner;
  const isAVictory = abTest.winner === 'variant_a';
  const isBVictory = abTest.winner === 'variant_b';

  return (
    <div className="space-y-6">
      {/* En-tête avec gagnant */}
      {hasWinner && (
        <Card className={cn(
          'border-2',
          isAVictory ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' :
          'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
        )}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Trophy className={cn('h-6 w-6', isAVictory ? 'text-green-600' : 'text-blue-600')} />
                Gagnant : {isAVictory ? variantA.name || 'Variante A' : variantB.name || 'Variante B'}
              </CardTitle>
              {abTest.confidence_level && (
                <Badge variant="outline">
                  Confiance : {abTest.confidence_level.toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {abTest.decision_criteria && (
              <p className="text-sm text-muted-foreground">
                Décision basée sur : <strong>{abTest.decision_criteria}</strong>
              </p>
            )}
            {abTest.decided_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Décidé le : {new Date(abTest.decided_at).toLocaleString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparaison des variantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Variante A */}
        <Card className={cn(
          isAVictory && 'border-2 border-green-500'
        )}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{variantA.name || 'Variante A'}</span>
              {isAVictory && <Trophy className="h-5 w-5 text-green-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sujet</p>
              <p className="font-medium">{variantA.subject}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Envoyés</p>
                <p className="text-2xl font-bold">{resultsA.sent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Livrés</p>
                <p className="text-2xl font-bold">{resultsA.delivered}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ouverts</p>
                <p className="text-2xl font-bold">{resultsA.opened}</p>
                <p className="text-xs text-muted-foreground">
                  {openRateA.toFixed(2)}%
                </p>
                <Progress value={openRateA} className="mt-1 h-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clics</p>
                <p className="text-2xl font-bold">{resultsA.clicked}</p>
                <p className="text-xs text-muted-foreground">
                  {clickRateA.toFixed(2)}%
                </p>
                <Progress value={clickRateA} className="mt-1 h-2" />
              </div>
            </div>
            
            {resultsA.revenue > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-xl font-bold text-green-600">
                  {(resultsA.revenue / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variante B */}
        <Card className={cn(
          isBVictory && 'border-2 border-blue-500'
        )}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{variantB.name || 'Variante B'}</span>
              {isBVictory && <Trophy className="h-5 w-5 text-blue-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Sujet</p>
              <p className="font-medium">{variantB.subject}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Envoyés</p>
                <p className="text-2xl font-bold">{resultsB.sent}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Livrés</p>
                <p className="text-2xl font-bold">{resultsB.delivered}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ouverts</p>
                <p className="text-2xl font-bold">{resultsB.opened}</p>
                <p className="text-xs text-muted-foreground">
                  {openRateB.toFixed(2)}%
                </p>
                <Progress value={openRateB} className="mt-1 h-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clics</p>
                <p className="text-2xl font-bold">{resultsB.clicked}</p>
                <p className="text-xs text-muted-foreground">
                  {clickRateB.toFixed(2)}%
                </p>
                <Progress value={clickRateB} className="mt-1 h-2" />
              </div>
            </div>
            
            {resultsB.revenue > 0 && (
              <div>
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-xl font-bold text-green-600">
                  {(resultsB.revenue / 100).toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bouton pour calculer le gagnant */}
      {!hasWinner && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Aucun gagnant déterminé</p>
                <p className="text-sm text-muted-foreground">
                  Le test est toujours en cours ou n&apos;a pas assez de données
                </p>
              </div>
              <Button
                onClick={() => calculateWinner.mutate(abTestId)}
                disabled={calculateWinner.isPending}
              >
                {calculateWinner.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Calculer le gagnant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

