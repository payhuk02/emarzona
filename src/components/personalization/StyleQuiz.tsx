/**
 * Quiz de Style Personnalisé - Emarzona
 * Système de recommandation intelligente basé sur les préférences utilisateur
 * Date: Janvier 2026
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Heart, Zap, Crown, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStylePreferences } from '@/hooks/useStylePreferences';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { logger } from '@/lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  QUIZ_BUDGET_TIERS,
  formatBudgetRangeLabel,
  getQuizCurrencyCodes,
  getQuizCurrencyLabel,
} from '@/lib/quiz-budget-ranges';
import { updateExchangeRates } from '@/lib/currency-converter';
import type { Database } from '@/integrations/supabase/types';

type QuizRecommendedProduct = Database['public']['Tables']['products']['Row'];

interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'scale';
  options: Array<{
    id: string;
    label: string;
    value: string;
    icon?: string;
    weight: Record<string, number>; // Poids pour chaque catégorie de style
  }>;
  category: string;
}

interface StyleProfile {
  aesthetic: 'minimalist' | 'bohemian' | 'luxury' | 'streetwear' | 'classic' | 'avantgarde';
  colorPalette: 'warm' | 'cool' | 'neutral' | 'vibrant' | 'pastel' | 'monochrome';
  budgetRange: 'budget' | 'midrange' | 'premium' | 'luxury';
  occasionFocus: 'casual' | 'work' | 'special' | 'all';
  sustainability: 'not_important' | 'somewhat' | 'very_important';
}

interface StyleQuizProps {
  onComplete: (profile: StyleProfile, recommendations: QuizRecommendedProduct[]) => void;
  onSkip?: () => void;
  className?: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'style_preference',
    question: 'Quel style vous attire le plus ?',
    type: 'single',
    category: 'aesthetic',
    options: [
      {
        id: 'minimalist',
        label: 'Sobre et épuré',
        value: 'minimalist',
        weight: { minimalist: 10, classic: 3 },
      },
      {
        id: 'bohemian',
        label: 'Artistique et bohème',
        value: 'bohemian',
        weight: { bohemian: 10, avantgarde: 3 },
      },
      {
        id: 'luxury',
        label: 'Élégant et raffiné',
        value: 'luxury',
        weight: { luxury: 10, classic: 4 },
      },
      {
        id: 'streetwear',
        label: 'Urbain et décontracté',
        value: 'streetwear',
        weight: { streetwear: 10, casual: 3 },
      },
    ],
  },
  {
    id: 'color_preference',
    question: 'Quelle palette de couleurs préférez-vous ?',
    type: 'single',
    category: 'colorPalette',
    options: [
      {
        id: 'warm',
        label: 'Couleurs chaudes (rouge, orange, jaune)',
        value: 'warm',
        weight: { warm: 10, vibrant: 3 },
      },
      {
        id: 'cool',
        label: 'Couleurs froides (bleu, vert, violet)',
        value: 'cool',
        weight: { cool: 10, neutral: 2 },
      },
      {
        id: 'neutral',
        label: 'Tons neutres (beige, gris, blanc)',
        value: 'neutral',
        weight: { neutral: 10, minimalist: 2 },
      },
      {
        id: 'vibrant',
        label: 'Couleurs vives et audacieuses',
        value: 'vibrant',
        weight: { vibrant: 10, avantgarde: 3 },
      },
    ],
  },
  {
    id: 'budget_range',
    question: 'Quel est votre budget habituel pour un achat ?',
    type: 'single',
    category: 'budgetRange',
    options: [
      {
        id: 'budget',
        label: '',
        value: 'budget',
        weight: { budget: 10, streetwear: 2 },
      },
      {
        id: 'midrange',
        label: '',
        value: 'midrange',
        weight: { midrange: 10, classic: 2 },
      },
      {
        id: 'premium',
        label: '',
        value: 'premium',
        weight: { premium: 10, luxury: 3 },
      },
      {
        id: 'luxury',
        label: '',
        value: 'luxury',
        weight: { luxury: 10, premium: 4 },
      },
    ],
  },
  {
    id: 'occasion_focus',
    question: 'Pour quelles occasions achetez-vous principalement ?',
    type: 'single',
    category: 'occasionFocus',
    options: [
      {
        id: 'casual',
        label: 'Quotidien et décontracté',
        value: 'casual',
        weight: { casual: 10, streetwear: 3 },
      },
      {
        id: 'work',
        label: 'Professionnel et formel',
        value: 'work',
        weight: { work: 10, classic: 4, minimalist: 2 },
      },
      {
        id: 'special',
        label: 'Événements spéciaux',
        value: 'special',
        weight: { special: 10, luxury: 3, bohemian: 2 },
      },
      {
        id: 'all',
        label: 'Toutes les occasions',
        value: 'all',
        weight: { all: 10, classic: 2 },
      },
    ],
  },
  {
    id: 'sustainability',
    question: 'À quel point le développement durable est-il important pour vous ?',
    type: 'single',
    category: 'sustainability',
    options: [
      {
        id: 'not_important',
        label: 'Pas important',
        value: 'not_important',
        weight: { not_important: 10 },
      },
      {
        id: 'somewhat',
        label: 'Assez important',
        value: 'somewhat',
        weight: { somewhat: 10, bohemian: 1 },
      },
      {
        id: 'very_important',
        label: 'Très important',
        value: 'very_important',
        weight: { very_important: 10, bohemian: 2, minimalist: 1 },
      },
    ],
  },
];

const StyleQuiz: React.FC<StyleQuizProps> = ({ onComplete, onSkip, className }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const quizCurrencyCodes = useMemo(() => getQuizCurrencyCodes(), []);

  const [displayCurrency, setDisplayCurrency] = useState(() => {
    const saved = localStorage.getItem('quiz_display_currency');
    const codes = getQuizCurrencyCodes();
    return saved && codes.includes(saved) ? saved : 'XOF';
  });
  const [ratesReady, setRatesReady] = useState(false);
  const { toast } = useToast();
  const { saveStylePreferences } = useStylePreferences();
  const { getPersonalizedRecommendations } = useProductRecommendations();

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;
  const isBudgetQuestion = currentQuestion.id === 'budget_range';

  const getOptionLabel = useCallback(
    (optionId: string, fallbackLabel: string) => {
      if (!isBudgetQuestion) return fallbackLabel;
      const tier = QUIZ_BUDGET_TIERS.find(t => t.id === optionId);
      return tier ? formatBudgetRangeLabel(tier, displayCurrency) : fallbackLabel;
    },
    [isBudgetQuestion, displayCurrency]
  );

  const handleDisplayCurrencyChange = useCallback(
    (code: string) => {
      if (!quizCurrencyCodes.includes(code)) return;
      setDisplayCurrency(code);
      localStorage.setItem('quiz_display_currency', code);
    },
    [quizCurrencyCodes]
  );

  useEffect(() => {
    updateExchangeRates()
      .then(() => setRatesReady(true))
      .catch(() => setRatesReady(true));
  }, []);

  // Calculer le profil de style basé sur les réponses
  const calculateStyleProfile = useCallback((): StyleProfile => {
    const scores: Record<string, number> = {
      // Aesthetic
      minimalist: 0,
      bohemian: 0,
      luxury: 0,
      streetwear: 0,
      classic: 0,
      avantgarde: 0,
      // Color Palette
      warm: 0,
      cool: 0,
      neutral: 0,
      vibrant: 0,
      pastel: 0,
      monochrome: 0,
      // Budget Range
      budget: 0,
      midrange: 0,
      premium: 0,
      luxury_budget: 0,
      // Occasion Focus
      casual: 0,
      work: 0,
      special: 0,
      all: 0,
      // Sustainability
      not_important: 0,
      somewhat: 0,
      very_important: 0,
    };

    // Calculer les scores pour chaque réponse
    Object.entries(answers).forEach(([questionId, selectedOptions]) => {
      const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
      if (!question) return;

      selectedOptions.forEach(optionId => {
        const option = question.options.find(o => o.id === optionId);
        if (option) {
          Object.entries(option.weight).forEach(([category, weight]) => {
            scores[category] += weight;
          });
        }
      });
    });

    // Déterminer les préférences dominantes
    const aesthetic = [
      'minimalist',
      'bohemian',
      'luxury',
      'streetwear',
      'classic',
      'avantgarde',
    ].reduce((a, b) => (scores[a] > scores[b] ? a : b)) as StyleProfile['aesthetic'];

    const colorPalette = ['warm', 'cool', 'neutral', 'vibrant', 'pastel', 'monochrome'].reduce(
      (a, b) => (scores[a] > scores[b] ? a : b)
    ) as StyleProfile['colorPalette'];

    const budgetRange = ['budget', 'midrange', 'premium', 'luxury'].reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    ) as StyleProfile['budgetRange'];

    const occasionFocus = ['casual', 'work', 'special', 'all'].reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    ) as StyleProfile['occasionFocus'];

    const sustainability = ['not_important', 'somewhat', 'very_important'].reduce((a, b) =>
      scores[a] > scores[b] ? a : b
    ) as StyleProfile['sustainability'];

    return {
      aesthetic,
      colorPalette,
      budgetRange,
      occasionFocus,
      sustainability,
    };
  }, [answers]);

  const handleAnswer = useCallback(
    (optionId: string) => {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: [optionId], // Pour l'instant single choice
      }));
    },
    [currentQuestion.id]
  );

  const handleComplete = useCallback(async () => {
    try {
      setIsCompleting(true);

      const profile = calculateStyleProfile();
      logger.info('Style quiz completed', { profile });

      await saveStylePreferences(profile);

      const recommendations = await getPersonalizedRecommendations(profile);

      toast({
        title: 'Quiz terminé ! 🎉',
        description: `Nous avons trouvé ${recommendations.length} produits parfaits pour votre style.`,
      });

      onComplete(profile, recommendations);
    } catch (error) {
      logger.error('Error completing style quiz', { error });
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsCompleting(false);
    }
  }, [
    calculateStyleProfile,
    saveStylePreferences,
    getPersonalizedRecommendations,
    onComplete,
    toast,
  ]);

  const handleNext = useCallback(async () => {
    if (!answers[currentQuestion.id]?.length) {
      toast({
        title: 'Réponse requise',
        description: 'Veuillez sélectionner une réponse avant de continuer.',
        variant: 'destructive',
      });
      return;
    }

    if (isLastQuestion) {
      await handleComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [answers, currentQuestion.id, isLastQuestion, handleComplete, toast]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Effet pour logger le progrès
  useEffect(() => {
    logger.info('Style quiz progress', {
      questionIndex: currentQuestionIndex,
      progress: Math.round(progress),
      totalQuestions: QUIZ_QUESTIONS.length,
    });
  }, [currentQuestionIndex, progress]);

  return (
    <Card className={cn('max-w-2xl mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-primary mr-2" />
          <CardTitle className="text-2xl">Découvrez Votre Style</CardTitle>
        </div>
        <p className="text-muted-foreground">
          Répondez à quelques questions pour recevoir des recommandations personnalisées
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {currentQuestionIndex + 1} sur {QUIZ_QUESTIONS.length}
            </span>
            <span>{Math.round(progress)}% terminé</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-center">{currentQuestion.question}</h3>

          {isBudgetQuestion && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Montants affichés en devise de votre choix (référence FCFA)
              </p>
              <div className="w-full sm:w-[280px]">
                <Select
                  value={quizCurrencyCodes.includes(displayCurrency) ? displayCurrency : 'XOF'}
                  onValueChange={handleDisplayCurrencyChange}
                >
                  <SelectTrigger
                    aria-label="Devise d'affichage du budget"
                    className="bg-background text-foreground [&>span]:text-foreground"
                  >
                    <span className="flex-1 truncate text-left font-medium text-foreground">
                      {getQuizCurrencyLabel(
                        quizCurrencyCodes.includes(displayCurrency) ? displayCurrency : 'XOF'
                      )}
                    </span>
                    <SelectValue className="sr-only" aria-hidden />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(320px,50vh)] overflow-y-auto">
                    {quizCurrencyCodes.map(code => (
                      <SelectItem key={code} value={code}>
                        {getQuizCurrencyLabel(code)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!ratesReady && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Taux indicatifs — mise à jour en cours…
                </p>
              )}
            </div>
          )}

          {/* Options */}
          <RadioGroup
            value={answers[currentQuestion.id]?.[0] || ''}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {currentQuestion.options.map(option => (
              <div key={option.id} className="flex items-center space-x-3">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <Label
                  htmlFor={option.id}
                  className="flex-1 cursor-pointer p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {option.icon && <div className="text-2xl">{option.icon}</div>}
                    <span className="font-medium">{getOptionLabel(option.id, option.label)}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
            Précédent
          </Button>

          <div className="flex space-x-3">
            {onSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Passer le quiz
              </Button>
            )}

            <Button onClick={handleNext} disabled={isCompleting} className="min-w-[120px]">
              {isCompleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyse...
                </>
              ) : isLastQuestion ? (
                <>
                  <Crown className="h-4 w-4 mr-2" />
                  Terminer
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Suivant
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-muted-foreground flex items-center justify-center">
            <Heart className="h-4 w-4 mr-1 text-red-500" />
            Vos réponses nous aident à vous recommander les produits parfaits
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(StyleQuiz);
export type { StyleProfile, StyleQuizProps };
