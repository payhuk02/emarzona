/**
 * Helpers pour la transformation et l'affichage des produits
 * Gère les fallbacks intelligents et la logique d'affichage dynamique
 */

import { UnifiedProduct, ProductKeyInfo, ProductType } from '@/types/unified-product';
import {
  Download,
  Package,
  Clock,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Star,
  Percent,
  PenTool,
  Palette,
  Award,
  Shield,
  User,
} from 'lucide-react';

/**
 * Formate le prix avec devise
 */
export function formatPrice(price: number, currency: string = 'FCFA'): string {
  return `${price.toLocaleString('fr-FR')} ${currency}`;
}

/**
 * Calcule le pourcentage de réduction
 */
export function calculateDiscount(price: number, promoPrice?: number): number {
  if (!promoPrice || promoPrice >= price) return 0;
  return Math.round(((price - promoPrice) / price) * 100);
}

/**
 * Formate la durée
 */
export function formatDuration(minutes: number, unit?: 'minute' | 'hour' | 'day' | 'week'): string {
  if (unit === 'hour' && minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  if (unit === 'day' && minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
  if (unit === 'week' && minutes >= 10080) {
    const weeks = Math.floor(minutes / 10080);
    return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  return `${minutes} min`;
}

/**
 * Récupère les informations clés à afficher selon le type de produit
 */
export function getProductKeyInfo(product: UnifiedProduct): ProductKeyInfo[] {
  const  keyInfo: ProductKeyInfo[] = [];

  switch (product.type) {
    case 'digital':
      // Fichiers disponibles
      if (product.files && product.files.length > 0) {
        keyInfo.push({
          label: 'Fichiers',
          value: `${product.files.length} fichier${product.files.length > 1 ? 's' : ''}`,
          icon: FileText,
        });
      } else {
        keyInfo.push({
          label: 'Fichiers',
          value: 'En préparation',
          icon: FileText,
        });
      }

      // Formats supportés
      if (product.formats && product.formats.length > 0) {
        keyInfo.push({
          label: 'Formats',
          value: product.formats.slice(0, 2).join(', '),
          icon: Download,
        });
      }

      // Livraison instantanée
      if (product.instant_delivery) {
        keyInfo.push({
          label: 'Livraison',
          value: 'Instantanée',
          icon: Zap,
          badge: true,
        });
      }

      // Taille totale
      if (product.file_size) {
        const sizeMB = (product.file_size / (1024 * 1024)).toFixed(1);
        keyInfo.push({
          label: 'Taille',
          value: `${sizeMB} MB`,
        });
      }

      break;

    case 'physical':
      // Stock
      if (product.stock !== undefined) {
        if (product.stock === 0) {
          keyInfo.push({
            label: 'Stock',
            value: 'Rupture',
            icon: AlertTriangle,
            badge: true,
          });
        } else if (product.stock < 10) {
          keyInfo.push({
            label: 'Stock',
            value: `Stock faible (${product.stock})`,
            icon: AlertTriangle,
            badge: true,
          });
        } else {
          keyInfo.push({
            label: 'Stock',
            value: `En stock (${product.stock})`,
            icon: CheckCircle2,
            badge: true,
          });
        }
      } else {
        keyInfo.push({
          label: 'Stock',
          value: 'Stock limité',
          icon: Package,
        });
      }

      // Variations
      if (product.variants && product.variants.length > 0) {
        keyInfo.push({
          label: 'Variations',
          value: `${product.variants.length} option${product.variants.length > 1 ? 's' : ''}`,
          icon: Package,
        });
      }

      // Livraison
      if (product.shipping_required !== false) {
        keyInfo.push({
          label: 'Livraison',
          value: 'Livraison requise',
          icon: Package,
        });
      }

      break;

    case 'service':
      // Durée
      if (product.duration) {
        keyInfo.push({
          label: 'Durée',
          value: formatDuration(product.duration, product.duration_unit),
          icon: Clock,
        });
      } else {
        keyInfo.push({
          label: 'Durée',
          value: 'Sur mesure',
          icon: Clock,
        });
      }

      // Modalités
      if (product.location_type) {
        const  locationLabels: Record<string, string> = {
          online: 'En ligne',
          on_site: 'Sur site',
          customer_location: 'Chez vous',
        };
        keyInfo.push({
          label: 'Modalités',
          value: locationLabels[product.location_type] || 'Flexible',
          icon: Calendar,
        });
      }

      // Réservation
      if (product.booking_required) {
        keyInfo.push({
          label: 'Réservation',
          value: 'Requis',
          icon: Calendar,
          badge: true,
        });
      }

      // Calendrier
      if (product.calendar_available) {
        keyInfo.push({
          label: 'Calendrier',
          value: 'Disponible',
          icon: Calendar,
          badge: true,
        });
      }

      break;

    case 'course':
      // Modules
      if (product.modules && product.modules.length > 0) {
        keyInfo.push({
          label: 'Modules',
          value: `${product.modules.length} module${product.modules.length > 1 ? 's' : ''}`,
          icon: FileText,
        });
      } else {
        keyInfo.push({
          label: 'Modules',
          value: 'Contenu en préparation',
          icon: FileText,
        });
      }

      // Durée totale
      if (product.total_duration) {
        keyInfo.push({
          label: 'Durée',
          value: formatDuration(product.total_duration),
          icon: Clock,
        });
      }

      // Accès
      if (product.access_type) {
        const  accessLabels: Record<string, string> = {
          lifetime: 'Accès à vie',
          subscription: 'Abonnement',
        };
        keyInfo.push({
          label: 'Accès',
          value: accessLabels[product.access_type] || product.access_type,
          icon: Users,
          badge: true,
        });
      }

      // Vidéo preview
      if (product.video_preview) {
        keyInfo.push({
          label: 'Preview',
          value: 'Vidéo disponible',
          icon: TrendingUp,
          badge: true,
        });
      }

      // Inscrits
      if (product.enrollment_count) {
        keyInfo.push({
          label: 'Inscrits',
          value: `${product.enrollment_count} personne${product.enrollment_count > 1 ? 's' : ''}`,
          icon: Users,
        });
      }

      break;

    case 'artist':
      // Type d'artiste
      if (product.artist_type) {
        const  artistTypeLabels: Record<string, string> = {
          writer: 'Écrivain',
          musician: 'Musicien',
          visual_artist: 'Artiste visuel',
          designer: 'Designer',
          multimedia: 'Multimédia',
          other: 'Artiste',
        };
        keyInfo.push({
          label: 'Type',
          value: artistTypeLabels[product.artist_type] || 'Artiste',
          icon: PenTool,
        });
      }

      // Nom de l'artiste
      if (product.artist_name) {
        keyInfo.push({
          label: 'Artiste',
          value: product.artist_name,
          icon: User,
        });
      }

      // Type d'édition
      if (product.edition_type) {
        const  editionLabels: Record<string, string> = {
          original: 'Original',
          limited_edition: 'Édition limitée',
          print: 'Tirage',
          reproduction: 'Reproduction',
        };
        keyInfo.push({
          label: 'Édition',
          value: editionLabels[product.edition_type] || product.edition_type,
          icon: Palette,
        });
      }

      // Édition limitée
      if (product.edition_type === 'limited_edition' && product.edition_number && product.total_editions) {
        keyInfo.push({
          label: 'Numéro',
          value: `${product.edition_number}/${product.total_editions}`,
          icon: Award,
          badge: true,
        });
      }

      // Certificat d'authenticité
      if (product.certificate_of_authenticity) {
        keyInfo.push({
          label: 'Certificat',
          value: 'Authentifié',
          icon: Shield,
          badge: true,
        });
      }

      // Livraison fragile
      if (product.shipping_fragile) {
        keyInfo.push({
          label: 'Livraison',
          value: 'Fragile',
          icon: Package,
          badge: true,
        });
      }

      break;
  }

  return keyInfo;
}

/**
 * Récupère le badge de type de produit
 */
export function getProductTypeBadge(product: UnifiedProduct): {
  label: string;
  color: string;
  icon?: React.ComponentType<{ className?: string }>;
} {
  switch (product.type) {
    case 'digital': {
      const  digitalTypes: Record<string, string> = {
        software: 'Logiciel',
        ebook: 'E-book',
        template: 'Template',
        plugin: 'Plugin',
        music: 'Musique',
        video: 'Vidéo',
        graphic: 'Graphisme',
        game: 'Jeu',
        app: 'Application',
        document: 'Document',
        data: 'Données',
        other: 'Digital',
      };
      return {
        label: digitalTypes[product.digital_type || 'other'] || 'Digital',
        color: 'bg-blue-500',
        icon: Download,
      };
    }

    case 'physical':
      return {
        label: 'Physique',
        color: 'bg-green-500',
        icon: Package,
      };

    case 'service': {
      const  serviceTypes: Record<string, string> = {
        appointment: 'Rendez-vous',
        class: 'Cours',
        event: 'Événement',
        consultation: 'Consultation',
        other: 'Service',
      };
      return {
        label: serviceTypes[product.service_type || 'other'] || 'Service',
        color: 'bg-purple-500',
        icon: Calendar,
      };
    }

    case 'course':
      return {
        label: 'Cours',
        color: 'bg-orange-500',
        icon: FileText,
      };

    case 'artist': {
      const  artistTypeLabels: Record<string, string> = {
        writer: 'Écrivain',
        musician: 'Musicien',
        visual_artist: 'Artiste visuel',
        designer: 'Designer',
        multimedia: 'Multimédia',
        other: 'Artiste',
      };
      return {
        label: artistTypeLabels[product.artist_type || 'other'] || 'Artiste',
        color: 'bg-pink-500',
        icon: Palette,
      };
    }

    default:
      return {
        label: 'Produit',
        color: 'bg-gray-500',
      };
  }
}

/**
 * Récupère le label de licence pour produits digitaux
 */
export function getLicenseLabel(licenseType?: string): string {
  const  labels: Record<string, string> = {
    single: 'License Unique',
    multi: 'Multi-Devices',
    unlimited: 'Illimitée',
    subscription: 'Abonnement',
    lifetime: 'À vie',
  };
  return labels[licenseType || ''] || 'License Standard';
}

/**
 * Vérifie si le produit a une promotion
 */
export function hasPromotion(product: UnifiedProduct): boolean {
  return !!product.promo_price && product.promo_price < product.price;
}

/**
 * Récupère le prix à afficher (promo ou normal)
 */
export function getDisplayPrice(product: UnifiedProduct): {
  price: number;
  originalPrice?: number;
  discount?: number;
} {
  if (hasPromotion(product)) {
    return {
      price: product.promo_price!,
      originalPrice: product.price,
      discount: calculateDiscount(product.price, product.promo_price),
    };
  }
  return { price: product.price };
}

/**
 * Récupère l'URL de l'image avec fallback
 */
export function getProductImage(product: UnifiedProduct): string | undefined {
  if (product.image_url) return product.image_url;
  if (product.images && product.images.length > 0) return product.images[0];
  return undefined;
}

/**
 * Récupère le rating formaté
 */
export function getRatingDisplay(rating?: number, reviewCount?: number): {
  rating: number;
  display: string;
  hasRating: boolean;
} {
  if (!rating || rating === 0) {
    return {
      rating: 0,
      display: 'Aucun avis',
      hasRating: false,
    };
  }

  return {
    rating,
    display: `${rating.toFixed(1)} (${reviewCount || 0} avis)`,
    hasRating: true,
  };
}








