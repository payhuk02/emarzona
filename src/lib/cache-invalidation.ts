/**
 * Cache Invalidation Intelligente
 * Date: 28 Janvier 2025
 * 
 * Système intelligent pour invalider le cache React Query
 * basé sur les relations entre entités
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

/**
 * Types d'entités dans le système
 */
export enum EntityType {
  PRODUCT = 'product',
  DIGITAL_PRODUCT = 'digital_product',
  PHYSICAL_PRODUCT = 'physical_product',
  SERVICE = 'service',
  COURSE = 'course',
  ORDER = 'order',
  CART = 'cart',
  REVIEW = 'review',
  CUSTOMER = 'customer',
  STORE = 'store',
  BOOKING = 'booking',
  SUBSCRIPTION = 'subscription',
  LICENSE = 'license',
  UPDATE = 'update',
  STATS = 'stats',
  ANALYTICS = 'analytics',
}

/**
 * Types d'actions sur les entités
 */
export enum EntityAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  UNPUBLISH = 'unpublish',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
}

/**
 * Relation entre entités
 */
export interface EntityRelation {
  source: EntityType;
  target: EntityType;
  action: EntityAction[];
  condition?: (entityId: string, context?: Record<string, unknown>) => boolean;
}

/**
 * Définition des relations entre entités
 * Quand une entité est modifiée, quelles autres entités doivent être invalidées ?
 */
const ENTITY_RELATIONS: EntityRelation[] = [
  // Produit → Reviews, Cart, Stats, Analytics
  {
    source: EntityType.PRODUCT,
    target: EntityType.REVIEW,
    action: [EntityAction.UPDATE, EntityAction.DELETE],
  },
  {
    source: EntityType.PRODUCT,
    target: EntityType.CART,
    action: [EntityAction.UPDATE, EntityAction.DELETE, EntityAction.DEACTIVATE],
  },
  {
    source: EntityType.PRODUCT,
    target: EntityType.STATS,
    action: [EntityAction.CREATE, EntityAction.UPDATE, EntityAction.DELETE],
  },
  {
    source: EntityType.PRODUCT,
    target: EntityType.ANALYTICS,
    action: [EntityAction.CREATE, EntityAction.UPDATE, EntityAction.DELETE],
  },

  // Digital Product → Updates, Licenses, Subscriptions, Downloads
  {
    source: EntityType.DIGITAL_PRODUCT,
    target: EntityType.UPDATE,
    action: [EntityAction.UPDATE, EntityAction.DELETE],
  },
  {
    source: EntityType.DIGITAL_PRODUCT,
    target: EntityType.LICENSE,
    action: [EntityAction.UPDATE, EntityAction.DELETE],
  },
  {
    source: EntityType.DIGITAL_PRODUCT,
    target: EntityType.SUBSCRIPTION,
    action: [EntityAction.UPDATE, EntityAction.DELETE, EntityAction.DEACTIVATE],
  },
  {
    source: EntityType.DIGITAL_PRODUCT,
    target: EntityType.CART,
    action: [EntityAction.UPDATE, EntityAction.DELETE, EntityAction.DEACTIVATE],
  },

  // Update → Digital Product
  {
    source: EntityType.UPDATE,
    target: EntityType.DIGITAL_PRODUCT,
    action: [EntityAction.CREATE, EntityAction.UPDATE, EntityAction.PUBLISH],
  },

  // Order → Cart, Stats, Analytics
  {
    source: EntityType.ORDER,
    target: EntityType.CART,
    action: [EntityAction.CREATE],
  },
  {
    source: EntityType.ORDER,
    target: EntityType.STATS,
    action: [EntityAction.CREATE, EntityAction.UPDATE],
  },
  {
    source: EntityType.ORDER,
    target: EntityType.ANALYTICS,
    action: [EntityAction.CREATE, EntityAction.UPDATE],
  },

  // Booking → Service, Stats, Analytics
  {
    source: EntityType.BOOKING,
    target: EntityType.SERVICE,
    action: [EntityAction.CREATE, EntityAction.UPDATE, EntityAction.DELETE],
  },
  {
    source: EntityType.BOOKING,
    target: EntityType.STATS,
    action: [EntityAction.CREATE, EntityAction.UPDATE, EntityAction.DELETE],
  },

  // Course → Enrollments, Stats, Analytics
  {
    source: EntityType.COURSE,
    target: EntityType.STATS,
    action: [EntityAction.CREATE, EntityAction.UPDATE, EntityAction.DELETE, EntityAction.PUBLISH],
  },
  {
    source: EntityType.COURSE,
    target: EntityType.ANALYTICS,
    action: [EntityAction.CREATE, EntityAction.UPDATE, EntityAction.DELETE],
  },

  // Store → Products, Orders, Stats
  {
    source: EntityType.STORE,
    target: EntityType.PRODUCT,
    action: [EntityAction.UPDATE],
  },
  {
    source: EntityType.STORE,
    target: EntityType.ORDER,
    action: [EntityAction.UPDATE],
  },
  {
    source: EntityType.STORE,
    target: EntityType.STATS,
    action: [EntityAction.UPDATE],
  },
];

/**
 * Mapping des entités vers les query keys
 */
const ENTITY_QUERY_KEY_MAP: Record<EntityType, (id?: string, context?: Record<string, unknown>) => unknown[][]> = {
  [EntityType.PRODUCT]: (id, context) => {
    const keys: unknown[][] = [['products']];
    if (id) keys.push(['product', id]);
    if (context?.storeId) keys.push(['products', context.storeId]);
    return keys;
  },
  [EntityType.DIGITAL_PRODUCT]: (id, context) => {
    const keys: unknown[][] = [['digitalProducts']];
    if (id) {
      keys.push(['digitalProduct', id]);
      keys.push(['productUpdates', id]);
    }
    if (context?.storeId) keys.push(['digitalProducts', context.storeId]);
    return keys;
  },
  [EntityType.PHYSICAL_PRODUCT]: (id, context) => {
    const keys: unknown[][] = [['physicalProducts']];
    if (id) keys.push(['physicalProduct', id]);
    if (context?.storeId) keys.push(['physicalProducts', context.storeId]);
    return keys;
  },
  [EntityType.SERVICE]: (id, context) => {
    const keys: unknown[][] = [['services']];
    if (id) {
      keys.push(['service', id]);
      keys.push(['service-bookings', id]);
    }
    if (context?.storeId) keys.push(['services', context.storeId]);
    return keys;
  },
  [EntityType.COURSE]: (id) => {
    const keys: unknown[][] = [['courses'], ['course-stats']];
    if (id) {
      keys.push(['course', id]);
      keys.push(['enrollments', id]);
    }
    return keys;
  },
  [EntityType.ORDER]: (id, context) => {
    const keys: unknown[][] = [['orders']];
    if (id) keys.push(['order', id]);
    if (context?.storeId) keys.push(['orders', context.storeId]);
    return keys;
  },
  [EntityType.CART]: () => [['cart']],
  [EntityType.REVIEW]: (id, context) => {
    const keys: unknown[][] = [];
    if (context?.productId) {
      keys.push(['product-reviews', context.productId]);
      keys.push(['product-review-stats', context.productId]);
    }
    return keys;
  },
  [EntityType.CUSTOMER]: (id) => {
    const keys: unknown[][] = [['customers']];
    if (id) keys.push(['customer', id]);
    return keys;
  },
  [EntityType.STORE]: (id) => {
    const keys: unknown[][] = [['stores']];
    if (id) keys.push(['store', id]);
    return keys;
  },
  [EntityType.BOOKING]: (id, context) => {
    const keys: unknown[][] = [['bookings'], ['service-bookings']];
    if (id) keys.push(['booking', id]);
    if (context?.serviceId) keys.push(['service-bookings', context.serviceId]);
    return keys;
  },
  [EntityType.SUBSCRIPTION]: (id, context) => {
    const keys: unknown[][] = [['subscriptions'], ['customerSubscriptions']];
    if (id) keys.push(['subscription', id]);
    if (context?.productId) keys.push(['subscriptions', context.productId]);
    return keys;
  },
  [EntityType.LICENSE]: (id, context) => {
    const keys: unknown[][] = [['licenses']];
    if (id) keys.push(['license', id]);
    if (context?.productId) keys.push(['licenses', context.productId]);
    return keys;
  },
  [EntityType.UPDATE]: (id, context) => {
    const keys: unknown[][] = [];
    if (context?.digitalProductId) {
      keys.push(['productUpdates', context.digitalProductId]);
      keys.push(['digitalProduct', context.digitalProductId]);
    }
    if (id) keys.push(['productUpdate', id]);
    return keys;
  },
  [EntityType.STATS]: (context) => {
    const keys: unknown[][] = [];
    if (context?.storeId) keys.push(['dashboard-stats', context.storeId]);
    if (context?.productId) keys.push(['product-stats', context.productId]);
    return keys;
  },
  [EntityType.ANALYTICS]: (context) => {
    const keys: unknown[][] = [];
    if (context?.storeId) keys.push(['analytics', context.storeId]);
    if (context?.productId) keys.push(['product-analytics', context.productId]);
    return keys;
  },
};

/**
 * Invalider intelligemment le cache basé sur les relations
 */
export function invalidateRelatedCache(
  queryClient: QueryClient,
  entityType: EntityType,
  action: EntityAction,
  entityId?: string,
  context?: Record<string, unknown>
): void {
  // Trouver toutes les relations concernées
  const relations = ENTITY_RELATIONS.filter(
    (relation) =>
      relation.source === entityType &&
      relation.action.includes(action) &&
      (!relation.condition || relation.condition(entityId || '', context))
  );

  // Invalider les query keys de l'entité source
  const sourceKeys = ENTITY_QUERY_KEY_MAP[entityType](entityId, context);
  sourceKeys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: key });
  });

  // Invalider les query keys des entités cibles
  relations.forEach((relation) => {
    const targetKeys = ENTITY_QUERY_KEY_MAP[relation.target](entityId, {
      ...context,
      [getEntityIdKey(relation.target)]: entityId,
    });

    targetKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  });

  logger.debug('Cache invalidated intelligently', {
    entityType,
    action,
    entityId,
    relationsCount: relations.length,
  });
}

/**
 * Obtenir la clé d'ID pour une entité
 */
function getEntityIdKey(entityType: EntityType): string {
  const mapping: Record<EntityType, string> = {
    [EntityType.PRODUCT]: 'productId',
    [EntityType.DIGITAL_PRODUCT]: 'digitalProductId',
    [EntityType.PHYSICAL_PRODUCT]: 'physicalProductId',
    [EntityType.SERVICE]: 'serviceId',
    [EntityType.COURSE]: 'courseId',
    [EntityType.ORDER]: 'orderId',
    [EntityType.CART]: 'cartId',
    [EntityType.REVIEW]: 'reviewId',
    [EntityType.CUSTOMER]: 'customerId',
    [EntityType.STORE]: 'storeId',
    [EntityType.BOOKING]: 'bookingId',
    [EntityType.SUBSCRIPTION]: 'subscriptionId',
    [EntityType.LICENSE]: 'licenseId',
    [EntityType.UPDATE]: 'updateId',
    [EntityType.STATS]: 'statsId',
    [EntityType.ANALYTICS]: 'analyticsId',
  };
  return mapping[entityType];
}

/**
 * Helper pour invalider le cache d'un produit
 */
export function invalidateProductCache(
  queryClient: QueryClient,
  productId: string,
  action: EntityAction,
  storeId?: string
): void {
  invalidateRelatedCache(queryClient, EntityType.PRODUCT, action, productId, { storeId });
}

/**
 * Helper pour invalider le cache d'un produit digital
 */
export function invalidateDigitalProductCache(
  queryClient: QueryClient,
  digitalProductId: string,
  action: EntityAction,
  storeId?: string
): void {
  invalidateRelatedCache(queryClient, EntityType.DIGITAL_PRODUCT, action, digitalProductId, {
    storeId,
    digitalProductId,
  });
}

/**
 * Helper pour invalider le cache d'une commande
 */
export function invalidateOrderCache(
  queryClient: QueryClient,
  orderId: string,
  action: EntityAction,
  storeId?: string
): void {
  invalidateRelatedCache(queryClient, EntityType.ORDER, action, orderId, { storeId });
}

/**
 * Helper pour invalider le cache d'un service
 */
export function invalidateServiceCache(
  queryClient: QueryClient,
  serviceId: string,
  action: EntityAction,
  storeId?: string
): void {
  invalidateRelatedCache(queryClient, EntityType.SERVICE, action, serviceId, { storeId, serviceId });
}

/**
 * Helper pour invalider le cache d'une réservation
 */
export function invalidateBookingCache(
  queryClient: QueryClient,
  bookingId: string,
  action: EntityAction,
  serviceId?: string
): void {
  invalidateRelatedCache(queryClient, EntityType.BOOKING, action, bookingId, { serviceId });
}

/**
 * Helper pour invalider le cache d'une mise à jour
 */
export function invalidateUpdateCache(
  queryClient: QueryClient,
  updateId: string,
  action: EntityAction,
  digitalProductId: string
): void {
  invalidateRelatedCache(queryClient, EntityType.UPDATE, action, updateId, { digitalProductId });
}

/**
 * Invalider sélectivement plusieurs entités
 */
export function invalidateMultipleEntities(
  queryClient: QueryClient,
  invalidations: Array<{
    entityType: EntityType;
    action: EntityAction;
    entityId?: string;
    context?: Record<string, unknown>;
  }>
): void {
  invalidations.forEach(({ entityType, action, entityId, context }) => {
    invalidateRelatedCache(queryClient, entityType, action, entityId, context);
  });
}

/**
 * Précharger les données liées après une mutation
 */
export async function prefetchRelatedData(
  queryClient: QueryClient,
  entityType: EntityType,
  entityId: string,
  context?: Record<string, unknown>
): Promise<void> {
  const relations = ENTITY_RELATIONS.filter((relation) => relation.source === entityType);

  // Précharger les entités liées les plus importantes
  const importantTargets = [
    EntityType.STATS,
    EntityType.ANALYTICS,
    EntityType.REVIEW,
  ];

  for (const relation of relations) {
    if (importantTargets.includes(relation.target)) {
      const targetKeys = ENTITY_QUERY_KEY_MAP[relation.target](entityId, {
        ...context,
        [getEntityIdKey(relation.target)]: entityId,
      });

      // Précharger seulement la première query key (la plus importante)
      if (targetKeys.length > 0) {
        await queryClient.prefetchQuery({
          queryKey: targetKeys[0],
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    }
  }
}

