/**
 * Enhanced Product Type Selector
 * Date: 27 octobre 2025
 * 
 * Sélecteur de type de produit amélioré avec :
 * - Design moderne et visuel
 * - Statistiques par type
 * - Templates suggérés
 * - Exemples de succès
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Package,
  Smartphone,
  Wrench,
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  Users,
  Clock,
  Download,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProductType {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  features: string[];
  color: string;
  gradient: string;
  popular: boolean;
  recommended?: boolean;
  examples: string[];
}

const PRODUCT_TYPES: ProductType[] = [
  {
    value: 'digital',
    label: 'Produit Digital',
    icon: Smartphone,
    description: 'Ebooks, logiciels, templates, fichiers téléchargeables',
    features: [
      'Téléchargement instantané',
      'Pas de gestion stock',
      'Livraison automatique',
      'Licences & DRM',
    ],
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    popular: true,
    recommended: true,
    examples: ['Ebook', 'Template', 'Plugin', 'Logiciel'],
  },
  {
    value: 'course',
    label: 'Cours en ligne',
    icon: GraduationCap,
    description: 'Formations vidéo structurées avec quiz et certificats',
    features: [
      'Vidéos HD',
      'Quiz & Certificats',
      'Suivi progression',
      'Discussions & Q&A',
    ],
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    popular: true,
    recommended: true,
    examples: ['Formation', 'Masterclass', 'Tutoriel', 'Webinar'],
  },
  {
    value: 'physical',
    label: 'Produit Physique',
    icon: Package,
    description: 'Vêtements, accessoires, objets artisanaux',
    features: [
      'Variants & Attributs',
      'Gestion inventaire',
      'Suivi livraison',
      'Options shipping',
    ],
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    popular: false,
    examples: ['Vêtements', 'Accessoires', 'Artisanat', 'Électronique'],
  },
  {
    value: 'service',
    label: 'Service',
    icon: Wrench,
    description: 'Consultations, coaching, prestations sur mesure',
    features: [
      'Calendrier réservations',
      'Sessions en ligne/présentiel',
      'Packages & Abonnements',
      'Disponibilités flexibles',
    ],
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    popular: false,
    examples: ['Consultation', 'Coaching', 'Design', 'Développement'],
  },
];

interface EnhancedProductTypeSelectorProps {
  onSelect: (type: string) => void;
  storeId: string;
}

interface ProductStats {
  digital: number;
  course: number;
  physical: number;
  service: number;
  total: number;
}

/**
 * Enhanced Product Type Selector
 * 
 * Affiche un sélecteur visuel avec statistiques et recommandations
 */
export const EnhancedProductTypeSelector = ({
  onSelect,
  storeId,
}: EnhancedProductTypeSelectorProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductStats>({
    digital: 0,
    course: 0,
    physical: 0,
    service: 0,
    total: 0,
  });
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  /**
   * Charger les statistiques de produits
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('product_type')
          .eq('store_id', storeId);

        if (error) throw error;

        const newStats: ProductStats = {
          digital: 0,
          course: 0,
          physical: 0,
          service: 0,
          total: data?.length || 0,
        };

        data?.forEach((product) => {
          const type = product.product_type as keyof ProductStats;
          if (type && type in newStats) {
            newStats[type]++;
          }
        });

        setStats(newStats);
      } catch (error) {
        console.error('Failed to load product stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [storeId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec stats globales */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
              <p className="text-sm text-muted-foreground">
                {stats.total === 0 ? 'Aucun produit' : stats.total === 1 ? '1 produit créé' : `${stats.total} produits créés`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {Object.entries(stats).map(([type, count]) => {
              if (type === 'total') return null;
              const productType = PRODUCT_TYPES.find(pt => pt.value === type);
              if (!productType || count === 0) return null;
              
              return (
                <div key={type} className="text-center">
                  <div className="text-xl font-semibold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {productType.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grid des types de produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRODUCT_TYPES.map((type) => {
          const Icon = type.icon;
          const count = stats[type.value as keyof ProductStats] || 0;
          const isHovered = hoveredType === type.value;

          return (
            <Card
              key={type.value}
              className={cn(
                'relative overflow-hidden transition-all duration-300 cursor-pointer group',
                'hover:shadow-xl hover:scale-[1.02] hover:border-primary/50',
                isHovered && 'ring-2 ring-primary'
              )}
              onMouseEnter={() => setHoveredType(type.value)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => onSelect(type.value)}
            >
              {/* Gradient background */}
              <div
                className={cn(
                  'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity',
                  'bg-gradient-to-br',
                  type.gradient
                )}
              />

              {/* Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                {type.popular && (
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-600 border-orange-500/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Populaire
                  </Badge>
                )}
                {type.recommended && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Recommandé
                  </Badge>
                )}
                {count > 0 && (
                  <Badge variant="outline">
                    {count}
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-3 rounded-xl transition-colors',
                    `bg-${type.color}-500/20 group-hover:bg-${type.color}-500/30`
                  )}>
                    <Icon className={cn('h-8 w-8', `text-${type.color}-500`)} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">{type.label}</CardTitle>
                    <CardDescription className="text-sm">
                      {type.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features list */}
                <div className="space-y-2">
                  {type.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={cn('h-4 w-4', `text-${type.color}-500`)} />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Examples */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Exemples :
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {type.examples.map((example, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className={cn(
                    'w-full mt-2',
                    `bg-${type.color}-500 hover:bg-${type.color}-600`
                  )}
                  onClick={() => onSelect(type.value)}
                >
                  Créer un {type.label.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help section */}
      <Card className="bg-muted/30">
        <CardContent className="flex items-start gap-4 py-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-1">Besoin d'aide pour choisir ?</h4>
            <p className="text-sm text-muted-foreground">
              Chaque type de produit est optimisé pour un cas d'usage spécifique. 
              Les <strong>Cours en ligne</strong> sont parfaits pour des formations structurées avec vidéos et quiz. 
              Les <strong>Produits digitaux</strong> pour des fichiers téléchargeables.
              Les <strong>Produits physiques</strong> nécessitent une livraison.
              Les <strong>Services</strong> pour des prestations avec réservations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


