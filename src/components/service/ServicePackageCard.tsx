/**
 * Service Package Card Component
 * Date: 1 Février 2025
 * 
 * Carte pour afficher un package de services
 */

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Calendar, Gift, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

export interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  sessions_count: number;
  price: number;
  compare_at_price?: number;
  expires_in_days?: number;
  image_url?: string;
  is_featured?: boolean;
  total_credits: number;
}

interface ServicePackageCardProps {
  package: ServicePackage;
  onPurchase?: (packageId: string) => void;
  className?: string;
  showPurchaseButton?: boolean;
}

export const ServicePackageCard = ({
  package: pkg,
  onPurchase,
  className,
  showPurchaseButton = true,
}: ServicePackageCardProps) => {
  const discountPercentage = pkg.compare_at_price
    ? Math.round(((pkg.compare_at_price - pkg.price) / pkg.compare_at_price) * 100)
    : 0;

  const pricePerSession = pkg.price / pkg.sessions_count;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-lg',
        pkg.is_featured && 'border-primary border-2',
        className
      )}
    >
      {pkg.is_featured && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="default" className="gap-1">
            <Gift className="h-3 w-3" />
            Populaire
          </Badge>
        </div>
      )}

      {pkg.image_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <OptimizedImage
            src={pkg.image_url}
            alt={pkg.name}
            className="w-full h-full object-cover"
            width={400}
            height={200}
          />
          {discountPercentage > 0 && (
            <div className="absolute top-2 left-2">
              <Badge variant="destructive" className="gap-1">
                -{discountPercentage}%
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {pkg.name}
          {pkg.is_featured && (
            <Badge variant="secondary" className="ml-auto">
              Recommandé
            </Badge>
          )}
        </CardTitle>
        {pkg.description && (
          <CardDescription>{pkg.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sessions Info */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            <strong>{pkg.sessions_count}</strong> séance{pkg.sessions_count > 1 ? 's' : ''} incluses
          </span>
        </div>

        {/* Credits Info */}
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <span>
            <strong>{pkg.total_credits}</strong> crédit{pkg.total_credits > 1 ? 's' : ''} total
          </span>
        </div>

        {/* Expiration */}
        {pkg.expires_in_days && (
          <div className="text-xs text-muted-foreground">
            Valable {pkg.expires_in_days} jour{pkg.expires_in_days > 1 ? 's' : ''} après achat
          </div>
        )}

        {/* Price */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">
              {pkg.price.toLocaleString('fr-FR')} XOF
            </span>
            {pkg.compare_at_price && (
              <span className="text-sm text-muted-foreground line-through">
                {pkg.compare_at_price.toLocaleString('fr-FR')} XOF
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {pricePerSession.toLocaleString('fr-FR')} XOF par séance
          </div>
        </div>
      </CardContent>

      {showPurchaseButton && (
        <CardFooter>
          <Button
            className="w-full gap-2"
            onClick={() => onPurchase?.(pkg.id)}
          >
            <ShoppingCart className="h-4 w-4" />
            Acheter le package
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

