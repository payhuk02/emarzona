/**
 * Composant d'affichage de la validation SEO et du score
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { validateStoreSEO, type SEOValidationResult } from '@/lib/seo-validator';
import type { Store } from '@/hooks/useStores';

interface StoreSEOValidatorProps {
  store: Store;
}

export const StoreSEOValidator = ({ store }: StoreSEOValidatorProps) => {
  const validation = useMemo<SEOValidationResult>(() => {
    return validateStoreSEO({
      name: store.name,
      description: store.description || undefined,
      meta_title: store.meta_title || undefined,
      meta_description: store.meta_description || undefined,
      meta_keywords: store.meta_keywords || undefined,
      og_title: store.og_title || undefined,
      og_description: store.og_description || undefined,
      og_image: store.og_image || undefined,
      logo_url: store.logo_url || undefined,
      banner_url: store.banner_url || undefined,
      contact_email: store.contact_email || undefined,
      contact_phone: store.contact_phone || undefined,
      address_line1: store.address_line1 || undefined,
      city: store.city || undefined,
      country: store.country || undefined,
      facebook_url: store.facebook_url || undefined,
      instagram_url: store.instagram_url || undefined,
      twitter_url: store.twitter_url || undefined,
      linkedin_url: store.linkedin_url || undefined,
      slug: store.slug,
      about: store.about || undefined,
    });
  }, [store]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Validation SEO</span>
          <Badge 
            variant="outline" 
            className={`text-lg font-bold ${getScoreColor(validation.score)}`}
          >
            {validation.score}/100
          </Badge>
        </CardTitle>
        <CardDescription>
          Analyse de l'optimisation SEO de votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score et barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score SEO global</span>
            <span className={`font-semibold ${getScoreColor(validation.score)}`}>
              {validation.score}%
            </span>
          </div>
          <Progress 
            value={validation.score} 
            className="h-3"
          />
          <div className={`h-3 rounded-full ${getScoreBgColor(validation.score)} opacity-20`} 
               style={{ width: `${validation.score}%`, marginTop: '-0.75rem' }} />
        </div>

        {/* Points forts */}
        {validation.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Points forts
            </h4>
            <div className="flex flex-wrap gap-2">
              {validation.strengths.map((strength, index) => (
                <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Problèmes et recommandations */}
        {validation.issues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Points à améliorer</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {validation.issues.map((issue, index) => (
                <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-start gap-3">
                    {getIcon(issue.type)}
                    <div className="flex-1 space-y-1">
                      <AlertTitle className="text-sm font-medium">
                        {issue.field} - {issue.message}
                      </AlertTitle>
                      {issue.suggestion && (
                        <AlertDescription className="text-xs">
                          💡 {issue.suggestion}
                        </AlertDescription>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Priorité {issue.priority}/10
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Recommandations générales */}
        {validation.recommendations.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-semibold">Recommandations</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {validation.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Détails techniques */}
        <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Titre SEO:</span>{' '}
              {validation.metaTitleLength ? `${validation.metaTitleLength} caractères` : 'Non défini'}
            </div>
            <div>
              <span className="font-medium">Description SEO:</span>{' '}
              {validation.metaDescriptionLength ? `${validation.metaDescriptionLength} caractères` : 'Non définie'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Images:</span>{' '}
              {validation.hasValidImages ? '✓ Présentes' : '✗ Manquantes'}
            </div>
            <div>
              <span className="font-medium">Contact:</span>{' '}
              {validation.hasContactInfo ? '✓ Défini' : '✗ Non défini'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Réseaux sociaux:</span>{' '}
              {validation.hasSocialLinks ? '✓ Présents' : '✗ Absents'}
            </div>
            <div>
              <span className="font-medium">Données structurées:</span>{' '}
              {validation.hasStructuredData ? '✓ Activées' : '✗ Non activées'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};







