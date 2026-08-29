import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, FileText } from 'lucide-react';
import {
  formatBriefAnswerValue,
  parseServiceProjectOrderMetadata,
  resolveBriefAnswerLabel,
  type ServiceProjectOrderSummary,
} from '@/lib/service/service-project-order-summary';
import type { ServiceBriefField } from '@/lib/services/service-delivery-commerce';

interface ServiceProjectOrderSummaryProps {
  itemMetadata: unknown;
  briefFieldDefinitions?: ServiceBriefField[];
  currency?: string;
  className?: string;
  /** Pre-parsed summary (skip parse when already loaded). */
  summary?: ServiceProjectOrderSummary | null;
}

export function ServiceProjectOrderSummary({
  itemMetadata,
  briefFieldDefinitions,
  currency = 'XOF',
  className,
  summary: summaryProp,
}: ServiceProjectOrderSummaryProps) {
  const summary = summaryProp ?? parseServiceProjectOrderMetadata(itemMetadata);
  if (!summary) return null;

  const briefEntries = Object.entries(summary.briefAnswers).filter(
    ([, value]) => value !== '' && value !== undefined
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          Commande projet
        </CardTitle>
        <CardDescription>Formule, délai et brief client</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-2">
          {summary.packageName && <Badge variant="secondary">{summary.packageName}</Badge>}
          {summary.deliveryDays != null && Number.isFinite(summary.deliveryDays) && (
            <Badge variant="outline">{summary.deliveryDays} j ouvrés</Badge>
          )}
          {summary.extrasTotal != null && summary.extrasTotal > 0 && (
            <Badge variant="outline">
              Extras +{summary.extrasTotal.toLocaleString('fr-FR')} {currency}
            </Badge>
          )}
        </div>

        {summary.serverQuotedTotal != null && summary.serverQuotedTotal > 0 && (
          <p className="text-muted-foreground">
            Devis serveur :{' '}
            <span className="font-medium text-foreground">
              {summary.serverQuotedTotal.toLocaleString('fr-FR')} {currency}
            </span>
          </p>
        )}

        {briefEntries.length > 0 && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Brief client
            </p>
            <dl className="space-y-2">
              {briefEntries.map(([fieldId, value]) => (
                <div key={fieldId}>
                  <dt className="text-xs text-muted-foreground">
                    {resolveBriefAnswerLabel(fieldId, briefFieldDefinitions)}
                  </dt>
                  <dd className="whitespace-pre-wrap">{formatBriefAnswerValue(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
