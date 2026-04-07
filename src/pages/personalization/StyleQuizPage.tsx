/**
 * Page du Quiz de Style Personnalisé
 * Expérience complète de découverte de style avec recommandations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowRight, ShoppingBag, Heart, Star, TrendingUp } from 'lucide-react';
import StyleQuiz, { type StyleProfile } from '@/components/personalization/StyleQuiz';
import { useStylePreferences } from '@/hooks/useStylePreferences';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import { logger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'] & {
  store?: Database['public']['Tables']['stores']['Row'];
  average_rating?: number;
  total_reviews?: number;
};

const StyleQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasCompletedQuiz, updateRecommendationsViewed } = useStylePreferences();
  const { getPersonalizedRecommendations } = useProductRecommendations();

  const [quizCompleted, setQuizCompleted] = useState(false);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Rediriger si le quiz est déjà complété
  useEffect(() => {
    if (hasCompletedQuiz && !quizCompleted) {
      navigate('/personalization/recommendations');
    }
  }, [hasCompletedQuiz, quizCompleted, navigate]);

  const handleQuizComplete = async (profile: StyleProfile, products: Product[]) => {
    try {
      setStyleProfile(profile);
      setRecommendations(products);
      setQuizCompleted(true);
      setIsLoadingRecommendations(true);

      logger.info('Style quiz completed on page', { profile, productsCount: products.length });

      // Attendre un peu pour l'effet visuel
      setTimeout(() => {
        setShowRecommendations(true);
        setIsLoadingRecommendations(false);

        toast({
          title: "🎉 Découvrez votre style unique !",
          description: `Nous avons trouvé ${products.length} produits parfaits pour vous.`,
        });
      }, 2000);

    } catch (error) {
      logger.error('Error handling quiz completion', { error, profile });
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleSkipQuiz = () => {
    navigate('/marketplace');
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/product/${productId}`);
    // Marquer comme vu pour analytics
    updateRecommendationsViewed();
  };

  const handleShopSimilar = (productId: string) => {
    navigate(`/marketplace?similar_to=${productId}`);
  };

  const handleStartShopping = () => {
    navigate('/marketplace');
  };

  const getStyleDescription = (profile: StyleProfile): string => {
    const descriptions = {
      minimalist: "Sobre et raffiné",
      bohemian: "Artistique et libre",
      luxury: "Élégant et prestigieux",
      streetwear: "Urbain et contemporain",
      classic: "Timeless et versatile",
      avantgarde: "Innovant et audacieux"
    };
    return descriptions[profile.aesthetic] || "Unique";
  };

  if (quizCompleted && showRecommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
        <div className="container mx-auto px-4 py-8">
          {/* Header avec profil de style */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Votre profil de style</span>
            </div>

            {styleProfile && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold">
                  Style {getStyleDescription(styleProfile)}
                </h1>

                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {styleProfile.aesthetic}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {styleProfile.colorPalette}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {styleProfile.budgetRange}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {styleProfile.occasionFocus}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Recommandations */}
          <div className="space-y-6">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Produits recommandés pour vous</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucun produit trouvé pour le moment. Explorez notre marketplace !
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.slice(0, 9).map((product) => (
                      <Card key={product.id} className="group hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Image placeholder */}
                            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <ShoppingBag className="h-8 w-8 text-gray-400" />
                            </div>

                            {/* Product info */}
                            <div>
                              <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-1">
                                {product.store?.name || 'Boutique'}
                              </p>
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-primary">
                                {product.price ? `${product.price}€` : 'Prix sur demande'}
                              </span>
                              {product.average_rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs text-muted-foreground">
                                    {product.average_rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleViewProduct(product.id)}
                              >
                                Voir
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleShopSimilar(product.id)}
                              >
                                Similaires
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call to action */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleStartShopping}
                className="px-8 py-3"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Continuer mes achats
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingRecommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Analyse de vos préférences...</h3>
            <p className="text-muted-foreground">
              Nous préparons des recommandations personnalisées rien que pour vous.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Emarzona Personalization</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Découvrez Votre Style Unique
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Répondez à quelques questions et laissez-nous vous guider vers les produits parfaits pour votre style personnel.
          </p>
        </div>

        {/* Quiz */}
        <StyleQuiz
          onComplete={handleQuizComplete}
          onSkip={handleSkipQuiz}
        />

        {/* Benefits */}
        <div className="mt-12 text-center">
          <Separator className="mb-8" />
          <h2 className="text-2xl font-semibold mb-6">Pourquoi faire le quiz ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Recommandations personnalisées</h3>
              <p className="text-sm text-muted-foreground">
                Découvrez des produits qui correspondent vraiment à vos goûts
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Économisez du temps</h3>
              <p className="text-sm text-muted-foreground">
                Plus besoin de chercher, nous trouvons pour vous
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Découvrez de nouvelles tendances</h3>
              <p className="text-sm text-muted-foreground">
                Explorez des styles et produits que vous n'auriez pas envisagés
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleQuizPage;