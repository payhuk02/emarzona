import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import type { StoreOnboardingStep } from '@/lib/commerce/store-vertical-config';

interface StoreOnboardingChecklistProps {
  steps: StoreOnboardingStep[];
  title?: string;
  description?: string;
}

function StepRow({ step }: { step: StoreOnboardingStep }) {
  return (
    <li className="flex gap-3 items-start rounded-lg border bg-card/50 p-3">
      <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" aria-hidden />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{step.title}</p>
          {step.optional && (
            <Badge variant="secondary" className="text-xs">
              Optionnel
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{step.description}</p>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
          <Link to={step.href}>
            Commencer
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function StoreOnboardingChecklist({
  steps,
  title = 'Prochaines étapes',
  description = 'Complétez ces étapes pour lancer votre boutique.',
}: StoreOnboardingChecklistProps) {
  const requiredCount = steps.filter(s => !s.optional).length;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>
              {requiredCount} étape{requiredCount > 1 ? 's' : ''} recommandée
              {requiredCount > 1 ? 's' : ''}
              {description ? ` · ${description}` : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 list-none p-0 m-0">
          {steps.map(step => (
            <StepRow key={step.id} step={step} />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
