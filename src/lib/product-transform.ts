/**
 * Transformateurs pour convertir les produits de la base de données
 * vers le format UnifiedProduct
 */

import {
  UnifiedProduct,
  DigitalProduct,
  PhysicalProduct,
  ServiceProduct,
  CourseProduct,
  ArtistProduct,
  BaseProduct,
} from '@/types/unified-product';
import {
  minActiveDeliveryTierPrice,
  summarizeServicePackageListingMetrics,
} from '@/lib/service/service-pricing';

export function inferServiceCalendarAvailable(
  fulfillmentMode?: string | null,
  explicit?: boolean | null
): boolean | undefined {
  if (explicit != null) return Boolean(explicit);
  if (fulfillmentMode === 'appointment' || fulfillmentMode === 'both') return true;
  return undefined;
}

/**
 * Type pour un produit brut de la base de données (non typé)
 */
type DatabaseProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  price?: number;
  promotional_price?: number;
  currency?: string;
  image_url?: string;
  images?: string[];
  store_id?: string;
  stores?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  product_type?: 'digital' | 'physical' | 'service' | 'course' | 'artist';
  rating?: number;
  average_rating?: number;
  reviews_count?: number;
  total_reviews?: number;
  purchases_count?: number;
  tags?: string[];
  category?: string;
  is_active?: boolean;
  is_draft?: boolean;
  created_at: string;
  updated_at?: string;
  product_affiliate_settings?: Array<{
    affiliate_enabled: boolean;
    commission_rate: number;
  }>;
  [key: string]: unknown; // Pour les propriétés spécifiques à chaque type
};

/**
 * Transforme un produit de la base de données vers UnifiedProduct
 */
export function transformToUnifiedProduct(product: DatabaseProduct): UnifiedProduct {
  const base: Partial<BaseProduct> = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || product.short_description,
    price: product.price || 0,
    promo_price: product.promotional_price,
    currency: product.currency || 'FCFA',
    image_url: product.image_url,
    images: product.images || (product.image_url ? [product.image_url] : []),
    store_id: product.store_id || product.stores?.id,
    store: product.stores
      ? {
          id: product.stores.id,
          name: product.stores.name,
          slug: product.stores.slug,
          logo_url: product.stores.logo_url,
        }
      : undefined,
    type: product.product_type || 'digital',
    rating: product.rating || product.average_rating,
    review_count: product.reviews_count || product.total_reviews || 0,
    purchases_count: product.purchases_count || 0,
    tags: product.tags || [],
    category: product.category,
    status: product.is_active === false ? 'archived' : product.is_draft ? 'draft' : 'active',
    created_at: product.created_at,
    updated_at: product.updated_at || product.created_at,

    // Affiliation
    is_affiliate: product.product_affiliate_settings?.[0]?.affiliate_enabled || false,
    affiliate_percentage: product.product_affiliate_settings?.[0]?.commission_rate,
    affiliate_enabled: product.product_affiliate_settings?.[0]?.affiliate_enabled || false,
    product_affiliate_settings: product.product_affiliate_settings || null,
    payment_options: product.payment_options,
    whatsapp_number: (product.whatsapp_number as string | null | undefined) ?? null,
    whatsapp_enabled: Boolean(product.whatsapp_enabled),
  };

  // Transformer selon le type
  switch (product.product_type) {
    case 'digital':
      return {
        ...base,
        type: 'digital',
        digital_type: product.digital_type,
        license_type: product.license_type,
        files: product.downloadable_files || product.files || [],
        formats: product.formats || extractFormatsFromFiles(product.downloadable_files),
        file_size: product.file_size,
        instant_delivery: product.instant_delivery !== false,
        download_limit: product.download_limit,
        total_downloads: product.total_downloads,
        version: product.version,
        licensing_type: product.licensing_type,
      } as DigitalProduct;

    case 'physical':
      return {
        ...base,
        type: 'physical',
        stock: product.stock || product.quantity_available,
        weight: product.weight,
        dimensions: product.dimensions
          ? {
              length: product.dimensions.length || 0,
              width: product.dimensions.width || 0,
              height: product.dimensions.height || 0,
            }
          : undefined,
        shipping_required: product.collect_shipping_address !== false,
        variants: product.variants || [],
        sku: product.sku,
        barcode: product.barcode,
      } as PhysicalProduct;

    case 'service': {
      const nested = Array.isArray(product.service_products)
        ? (product.service_products[0] as Record<string, unknown> | undefined)
        : (product.service_products as Record<string, unknown> | undefined);
      return {
        ...base,
        type: 'service',
        duration: product.duration ?? nested?.duration_minutes,
        duration_unit: product.duration_unit || 'hour',
        booking_required: product.booking_required,
        calendar_available: inferServiceCalendarAvailable(
          (nested?.fulfillment_mode as string | undefined) ??
            (product.fulfillment_mode as string | undefined),
          (product.calendar_available ?? nested?.calendar_available) as boolean | null | undefined
        ),
        staff_required: product.staff_required ?? nested?.requires_staff,
        location_type: product.location_type ?? nested?.location_type,
        service_type: product.service_type ?? nested?.service_type,
        category_attributes:
          (product.category_attributes as ServiceProduct['category_attributes']) ||
          (nested?.category_attributes as ServiceProduct['category_attributes']) ||
          undefined,
        pricing_type: (product.pricing_type ?? nested?.pricing_type) as
          | ServiceProduct['pricing_type']
          | undefined,
        fulfillment_mode: (product.fulfillment_mode ?? nested?.fulfillment_mode) as
          | ServiceProduct['fulfillment_mode']
          | undefined,
        package_starting_price:
          product.package_starting_price != null
            ? Number(product.package_starting_price)
            : nested?.package_starting_price != null
              ? Number(nested.package_starting_price)
              : minActiveDeliveryTierPrice(
                  nested?.service_packages as
                    | Array<{
                        price?: number | null;
                        package_price?: number | null;
                        package_kind?: string | null;
                        is_active?: boolean | null;
                      }>
                    | undefined
                ),
        ...(() => {
          const metrics = summarizeServicePackageListingMetrics(
            (nested?.service_packages as
              | Array<{
                  package_kind?: string | null;
                  is_active?: boolean | null;
                  delivery_days?: number | null;
                  revisions?: number | null;
                }>
              | undefined) ??
              (product.service_packages as
                | Array<{
                    package_kind?: string | null;
                    is_active?: boolean | null;
                    delivery_days?: number | null;
                    revisions?: number | null;
                  }>
                | undefined)
          );
          return {
            package_min_delivery_days:
              product.package_min_delivery_days != null
                ? Number(product.package_min_delivery_days)
                : metrics.minDeliveryDays,
            package_max_delivery_days:
              product.package_max_delivery_days != null
                ? Number(product.package_max_delivery_days)
                : metrics.maxDeliveryDays,
            package_max_revisions:
              product.package_max_revisions != null
                ? Number(product.package_max_revisions)
                : metrics.maxRevisions,
          };
        })(),
      } as ServiceProduct;
    }

    case 'course':
      return {
        ...base,
        type: 'course',
        modules: product.modules || [],
        video_preview: product.video_preview,
        access_type: product.access_type || 'lifetime',
        enrollment_count: product.enrollment_count,
        total_duration: product.total_duration,
        difficulty: product.difficulty,
      } as CourseProduct;

    case 'artist': {
      // Récupérer les données artist depuis artist_products si disponible
      const artistData = product.artist || product.artist_products?.[0];
      return {
        ...base,
        type: 'artist',
        artist_type: artistData?.artist_type || 'other',
        artist_name: artistData?.artist_name,
        artist_bio: artistData?.artist_bio,
        artwork_title: artistData?.artwork_title || product.name,
        artwork_year: artistData?.artwork_year,
        artwork_medium: artistData?.artwork_medium,
        artwork_dimensions: artistData?.artwork_dimensions,
        edition_type: artistData?.artwork_edition_type,
        edition_number: artistData?.edition_number,
        total_editions: artistData?.total_editions,
        requires_shipping: artistData?.requires_shipping !== false,
        shipping_fragile: artistData?.shipping_fragile || false,
        shipping_insurance_required: artistData?.shipping_insurance_required || false,
        certificate_of_authenticity: artistData?.certificate_of_authenticity || false,
        signature_authenticated: artistData?.signature_authenticated || false,
      } as ArtistProduct;
    }

    default:
      // Par défaut, traiter comme digital
      return {
        ...base,
        type: 'digital',
        digital_type: 'other',
        instant_delivery: true,
      } as DigitalProduct;
  }
}

/**
 * Interface pour un fichier dans la liste
 */
interface FileItem {
  format?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Extrait les formats depuis les fichiers
 */
function extractFormatsFromFiles(files: FileItem[] | unknown[]): string[] {
  if (!files || !Array.isArray(files)) return [];

  const formats = new Set<string>();
  files.forEach(file => {
    const fileItem = file as FileItem;
    if (fileItem.format) {
      formats.add(fileItem.format);
    } else if (fileItem.name) {
      const ext = fileItem.name.split('.').pop()?.toUpperCase();
      if (ext) formats.add(ext);
    }
  });

  return Array.from(formats);
}

/**
 * Transforme un tableau de produits
 */
export function transformProducts(products: DatabaseProduct[]): UnifiedProduct[] {
  return products.map(transformToUnifiedProduct);
}
