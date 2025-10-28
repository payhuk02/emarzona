/**
 * Digital Product Card - Professional
 * Date: 27 octobre 2025
 * 
 * Inspiré de: Gumroad, Lemonsqueezy
 */

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Download,
  Star,
  FileText,
  Shield,
  Clock,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface DigitalProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    currency: string;
    image_url?: string;
    digital_type: string;
    license_type: string;
    total_downloads: number;
    average_rating: number;
    total_reviews: number;
    version?: string;
  };
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onDownload?: () => void;
}

const DIGITAL_TYPE_ICONS = {
  software: '💻',
  ebook: '📚',
  template: '🎨',
  plugin: '🔌',
  music: '🎵',
  video: '🎬',
  graphic: '🖼️',
  game: '🎮',
  app: '📱',
  document: '📄',
  data: '📊',
  other: '📦',
};

const LICENSE_TYPE_LABELS = {
  single: 'License Unique',
  multi: 'Multi-Devices',
  unlimited: 'Illimitée',
  subscription: 'Abonnement',
  lifetime: 'À vie',
};

export const DigitalProductCard = ({
  product,
  variant = 'default',
  showActions = true,
  onDownload,
}: DigitalProductCardProps) => {
  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured';

  return (
    <Card 
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'hover:shadow-xl hover:scale-[1.02]',
        isFeatured && 'border-primary border-2',
        'cursor-pointer'
      )}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-primary text-primary-foreground">
            <Star className="h-3 w-3 mr-1 fill-current" />
            Populaire
          </Badge>
        </div>
      )}

      {/* Image/Icon */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-6xl">
              {DIGITAL_TYPE_ICONS[product.digital_type as keyof typeof DIGITAL_TYPE_ICONS] || DIGITAL_TYPE_ICONS.other}
            </span>
          </div>
        )}

        {/* Overlay avec info rapide */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          <Button size="sm" variant="secondary" asChild>
            <Link to={`/products/${product.slug}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir
            </Link>
          </Button>
          {showActions && onDownload && (
            <Button size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          )}
        </div>

        {/* Version badge */}
        {product.version && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-xs">
              v{product.version}
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link to={`/products/${product.slug}`}>
              <h3 className={cn(
                'font-semibold truncate hover:text-primary transition-colors',
                isCompact ? 'text-base' : 'text-lg'
              )}>
                {product.name}
              </h3>
            </Link>
            {!isCompact && product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {product.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* License & Type */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {LICENSE_TYPE_LABELS[product.license_type as keyof typeof LICENSE_TYPE_LABELS]}
          </Badge>
          <Badge variant="secondary" className="text-xs capitalize">
            {product.digital_type}
          </Badge>
        </div>

        {/* Stats */}
        {!isCompact && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {/* Downloads */}
            <div className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span className="font-medium">{product.total_downloads.toLocaleString()}</span>
            </div>

            {/* Rating */}
            {product.average_rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.average_rating.toFixed(1)}</span>
                <span className="text-xs">({product.total_reviews})</span>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            {product.price === 0 ? 'Gratuit' : `${product.price} ${product.currency}`}
          </span>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-3">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" asChild>
              <Link to={`/products/${product.slug}`}>
                <FileText className="h-4 w-4 mr-2" />
                Détails
              </Link>
            </Button>
            {onDownload ? (
              <Button className="flex-1" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            ) : (
              <Button className="flex-1" asChild>
                <Link to={`/products/${product.slug}`}>
                  Acheter
                </Link>
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

/**
 * Skeleton pour loading state
 */
export const DigitalProductCardSkeleton = () => {
  return (
    <Card>
      <div className="aspect-video bg-muted animate-pulse" />
      <CardHeader>
        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
          <div className="h-5 bg-muted rounded animate-pulse w-20" />
        </div>
        <div className="h-8 bg-muted rounded animate-pulse w-32" />
      </CardContent>
    </Card>
  );
};

/**
 * Grid de cards avec loading
 */
export const DigitalProductsGrid = ({
  products,
  loading,
  variant,
}: {
  products: any[];
  loading?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <DigitalProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit digital</h3>
          <p className="text-muted-foreground">
            Créez votre premier produit digital pour commencer
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn(
      "grid gap-6",
      variant === 'compact' 
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    )}>
      {products.map((product) => (
        <DigitalProductCard
          key={product.id}
          product={product}
          variant={variant}
        />
      ))}
    </div>
  );
};


