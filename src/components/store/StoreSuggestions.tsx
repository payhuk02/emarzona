/**
 * Composant affichant des suggestions automatiques pour améliorer le formulaire
 */

import { useState } from 'react';
import { Sparkles, X, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  suggestSlugAlternatives, 
  suggestMetaTitle, 
  suggestMetaDescription,
  suggestColorPalette,
  suggestCustomDomain,
  suggestKeywords,
} from '@/lib/store-suggestions';

interface StoreSuggestionsProps {
  name?: string;
  slug?: string;
  description?: string;
  slugAvailable?: boolean | null;
  onSlugSuggestion?: (suggestion: string) => void;
  onMetaTitleSuggestion?: (suggestion: string) => void;
  onMetaDescriptionSuggestion?: (suggestion: string) => void;
  onColorSuggestion?: (colors: { primary: string; secondary: string; accent: string; background: string; text: string }) => void;
  onKeywordSuggestion?: (keywords: string[]) => void;
  className?: string;
}

export const StoreSuggestions = ({
  name = '',
  slug = '',
  description = '',
  slugAvailable,
  onSlugSuggestion,
  onMetaTitleSuggestion,
  onMetaDescriptionSuggestion,
  onColorSuggestion,
  onKeywordSuggestion,
  className = '',
}: StoreSuggestionsProps) => {
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [showSuggestions, setShowSuggestions] = useState(true);

  if (!showSuggestions || !name) return null;

  const  suggestions: Array<{
    id: string;
    type: 'slug' | 'meta' | 'colors' | 'domain' | 'keywords';
    title: string;
    description: string;
    actions: Array<{ label: string; value: string | { primary: string; secondary: string; accent: string; background: string; text: string }; onClick: () => void }>;
  }> = [];

  // Suggestion de slug alternatif si indisponible
  if (slugAvailable === false && slug) {
    const alternatives = suggestSlugAlternatives(slug);
    if (alternatives.length > 0) {
      suggestions.push({
        id: 'slug-alternatives',
        type: 'slug',
        title: 'Slug non disponible',
        description: 'Voici des alternatives disponibles :',
        actions: alternatives.slice(0, 3).map(alt => ({
          label: alt,
          value: alt,
          onClick: () => {
            onSlugSuggestion?.(alt);
            setDismissedSuggestions(prev => new Set([...prev, 'slug-alternatives']));
          },
        })),
      });
    }
  }

  // Suggestions SEO
  if (name) {
    const suggestedTitle = suggestMetaTitle(name, description);
    const suggestedDescription = suggestMetaDescription(name, description);
    
    if (suggestedTitle !== name || suggestedDescription !== description) {
      suggestions.push({
        id: 'meta-suggestions',
        type: 'meta',
        title: 'Optimisation SEO',
        description: 'Suggéré pour améliorer votre référencement :',
        actions: [
          {
            label: 'Appliquer le titre SEO',
            value: suggestedTitle,
            onClick: () => {
              onMetaTitleSuggestion?.(suggestedTitle);
            },
          },
          {
            label: 'Appliquer la description SEO',
            value: suggestedDescription,
            onClick: () => {
              onMetaDescriptionSuggestion?.(suggestedDescription);
            },
          },
        ],
      });
    }
  }

  // Suggestions de couleurs (si logo détecté)
  if (name && !description) {
    const colors = suggestColorPalette('#3b82f6');
    suggestions.push({
      id: 'color-palette',
      type: 'colors',
      title: 'Palette de couleurs suggérée',
      description: 'Couleurs harmonieuses pour votre boutique :',
      actions: [
        {
          label: 'Appliquer la palette',
          value: colors,
          onClick: () => {
            onColorSuggestion?.(colors);
          },
        },
      ],
    });
  }

  // Suggestions de domaines personnalisés
  if (slug && slugAvailable === true) {
    const domains = suggestCustomDomain(slug);
    suggestions.push({
      id: 'custom-domains',
      type: 'domain',
      title: 'Domaines personnalisés suggérés',
      description: 'Vous pourrez configurer ces domaines plus tard :',
      actions: domains.slice(0, 3).map(domain => ({
        label: domain,
        value: domain,
        onClick: () => {
          // Logique pour suggérer le domaine
        },
      })),
    });
  }

  // Suggestions de mots-clés
  if (name && description) {
    const keywords = suggestKeywords(name, description);
    if (keywords.length > 0) {
      suggestions.push({
        id: 'keywords',
        type: 'keywords',
        title: 'Mots-clés SEO suggérés',
        description: 'Mots-clés pertinents pour votre boutique :',
        actions: [
          {
            label: `Utiliser : ${keywords.slice(0, 5).join(', ')}`,
            value: keywords,
            onClick: () => {
              onKeywordSuggestion?.(keywords);
            },
          },
        ],
      });
    }
  }

  // Filtrer les suggestions déjà rejetées
  const visibleSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.id));

  if (visibleSuggestions.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedSuggestions(prev => new Set([...prev, id]));
  };

  const handleDismissAll = () => {
    setShowSuggestions(false);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Suggestions intelligentes</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissAll}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          Des suggestions pour améliorer votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleSuggestions.map((suggestion) => (
          <Alert key={suggestion.id} className="relative">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{suggestion.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type}
                  </Badge>
                </div>
                <AlertDescription className="text-xs mb-2">
                  {suggestion.description}
                </AlertDescription>
                <div className="flex flex-wrap gap-2">
                  {suggestion.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={action.onClick}
                      className="text-xs h-7"
                    >
                      {action.type === 'slug' ? (
                        <>
                          {action.label}
                          <Check className="h-3 w-3 ml-1" />
                        </>
                      ) : (
                        <>
                          {action.label}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(suggestion.id)}
                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};







