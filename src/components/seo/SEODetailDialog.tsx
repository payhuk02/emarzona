import React, { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SEOPageData } from '@/hooks/useSEOAnalysis';
import { getScoreColor } from '@/lib/seo-analyzer';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SEODetailDialogProps {
  page: SEOPageData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEODetailDialogComponent = ({ page, open, onOpenChange }: SEODetailDialogProps) => {
  const navigate = useNavigate();

  const handleEdit = useCallback(() => {
    if (!page) return;
    onOpenChange(false);
    if (page.type === 'product') {
      navigate(`/dashboard/products/${page.id}/edit`);
    } else {
      navigate('/dashboard/store');
    }
  }, [page, onOpenChange, navigate]);

  if (!page) return null;

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base sm:text-lg">
            <span className="truncate">Analyse SEO : {page.name}</span>
            <span
              className={`text-xl sm:text-2xl font-bold ${getScoreColor(page.analysis.score.overall)}`}
            >
              {page.analysis.score.overall}/100
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {page.type === 'product' ? 'Produit' : 'Boutique'} • Analysé le{' '}
            {page.lastAnalyzed.toLocaleDateString('fr-FR')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Scores par catégorie */}
          <div className="space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Scores détaillés</h3>
            {Object.entries(page.analysis.score).map(([key, value]) => {
              if (key === 'overall') return null;

              const labels: Record<string, string> = {
                structure: 'Structure',
                content: 'Contenu',
                images: 'Images',
                performance: 'Performance',
                readability: 'Lisibilité',
              };

              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>{labels[key]}</span>
                    <span className={`font-semibold ${getScoreColor(value)}`}>{value}/100</span>
                  </div>
                  <Progress value={value} className="h-2" />
                </div>
              );
            })}
          </div>

          {/* Points forts */}
          {page.analysis.strengths.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Points forts
              </h3>
              <div className="grid gap-2">
                {page.analysis.strengths.map((strength, index) => (
                  <Alert key={index} className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    <AlertDescription className="text-xs sm:text-sm text-green-900">
                      {strength}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Problèmes et recommandations */}
          {page.analysis.issues.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                Recommandations
              </h3>
              <div className="grid gap-2 sm:gap-3">
                {page.analysis.issues.map((issue, index) => (
                  <Alert
                    key={index}
                    className={
                      issue.type === 'error'
                        ? 'bg-red-50 border-red-200'
                        : issue.type === 'warning'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-blue-50 border-blue-200'
                    }
                  >
                    <div className="flex items-start gap-2">
                      {getPriorityIcon(issue.priority)}
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {issue.category}
                          </Badge>
                          <Badge
                            variant={
                              issue.priority === 'high'
                                ? 'destructive'
                                : issue.priority === 'medium'
                                  ? 'secondary'
                                  : 'default'
                            }
                            className="text-xs"
                          >
                            {issue.priority === 'high'
                              ? 'Priorité haute'
                              : issue.priority === 'medium'
                                ? 'Priorité moyenne'
                                : 'Priorité faible'}
                          </Badge>
                        </div>
                        <AlertDescription
                          className={
                            issue.type === 'error'
                              ? 'text-red-900'
                              : issue.type === 'warning'
                                ? 'text-orange-900'
                                : 'text-blue-900'
                          }
                        >
                          <p className="font-medium text-xs sm:text-sm">{issue.message}</p>
                          {issue.recommendation && (
                            <p className="text-xs sm:text-sm mt-1 opacity-80">
                              💡 {issue.recommendation}
                            </p>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Mots-clés suggérés */}
          {page.analysis.keywords.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm sm:text-base">Mots-clés détectés</h3>
              <div className="flex flex-wrap gap-2">
                {page.analysis.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="pt-3 sm:pt-4 border-t">
            <Button
              onClick={handleEdit}
              className="w-full h-9 sm:h-10 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Corriger maintenant
              <ArrowRight className="ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

SEODetailDialogComponent.displayName = 'SEODetailDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const SEODetailDialog = React.memo(SEODetailDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.page?.id === nextProps.page?.id &&
    prevProps.page?.analysis.score.overall === nextProps.page?.analysis.score.overall
  );
});

SEODetailDialog.displayName = 'SEODetailDialog';
