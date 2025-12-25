import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useStoreContext } from '@/contexts/StoreContext';
import { shouldRetryError, getRetryDelay } from '@/lib/error-handling';

/**
 * Produit digital complet
 */
export interface DigitalProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  status: 'draft' | 'published' | 'active' | 'archived' | 'suspended';
  protectionLevel: 'basic' | 'standard' | 'advanced';
  version?: string;
  fileSize: number; // MB
  fileType: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  maxLicenses?: number;
  currentLicenses?: number;
  totalDownloads: number;
  recentDownloads?: number;
  revenue: number;
  createdAt: string;
  updatedAt?: string;
  userId: string;
}

/**
 * Données pour créer/mettre à jour un produit digital
 */
export interface DigitalProductData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category: string;
  status?: 'draft' | 'published' | 'active' | 'archived' | 'suspended';
  protectionLevel?: 'basic' | 'standard' | 'advanced';
  version?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  maxLicenses?: number;
}

/**
 * Options de pagination pour useDigitalProducts
 */
export interface DigitalProductsPaginationOptions {
  page?: number;
  itemsPerPage?: number;
  sortBy?: 'recent' | 'downloads' | 'price-asc' | 'price-desc' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Structure du produit associé depuis la jointure Supabase
 */
interface ProductFromJoin {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  currency?: string | null;
  is_active: boolean;
  image_url?: string | null;
  store_id: string;
}

/**
 * Structure d'un item digital_products avec jointure products
 */
interface DigitalProductWithJoin {
  id: string;
  product_id: string;
  [key: string]: unknown;
  products: ProductFromJoin | ProductFromJoin[] | null;
}

/**
 * Structure mappée finale avec product non-null
 */
interface MappedDigitalProduct {
  id: string;
  product_id: string;
  product: ProductFromJoin;
  [key: string]: unknown;
}

/**
 * useDigitalProducts - Hook pour lister les produits digitaux
 * Avec jointure sur products pour avoir toutes les infos
 * Support pagination côté serveur pour performance optimale
 */
export const useDigitalProducts = (
  storeId?: string,
  paginationOptions?: DigitalProductsPaginationOptions
) => {
  const { page = 1, itemsPerPage = 12, sortBy = 'recent', sortOrder = 'desc' } = paginationOptions || {};
  // Utiliser le contexte pour obtenir la boutique sélectionnée si storeId n'est pas fourni
  const { selectedStoreId } = useStoreContext();
  const effectiveStoreId = storeId || selectedStoreId;

  return useQuery({
    queryKey: ['digitalProducts', effectiveStoreId, page, itemsPerPage, sortBy, sortOrder],
    queryFn: async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) {
          logger.error('Erreur auth', {
            error: authError.message,
            code: authError.status,
          });
          throw new Error('Erreur d\'authentification: ' + authError.message);
        }
        if (!user) {
          throw new Error('Non authentifié');
        }

        // Étape 1: Obtenir les product_ids pertinents
        let productIds: string[] = [];

        if (effectiveStoreId) {
          // Si storeId est fourni (explicitement ou via contexte), obtenir tous les products de ce store
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .eq('store_id', effectiveStoreId);

          if (productsError) {
            logger.error('Erreur lors de la récupération des products', {
              error: productsError.message,
              code: productsError.code,
              storeId: effectiveStoreId,
            });
            throw new Error('Erreur lors de la récupération des produits: ' + productsError.message);
          }
          productIds = products?.map(p => p.id) || [];
        } else {
          // Pas de boutique sélectionnée, retourner structure paginée vide
          logger.debug('Aucune boutique sélectionnée', {
            userId: user.id,
            providedStoreId: storeId,
            selectedStoreId,
          });
          return {
            data: [],
            total: 0,
            page,
            itemsPerPage,
            totalPages: 0,
          };
        }

        // Si aucun product_id trouvé, retourner structure paginée vide
        if (productIds.length === 0) {
          logger.debug('Aucun produit trouvé pour les stores sélectionnés', {
            storeId,
            productIdsLength: 0,
          });
          return {
            data: [],
            total: 0,
            page,
            itemsPerPage,
            totalPages: 0,
          };
        }

        // Étape 2: Obtenir le total d'abord (pour pagination)
        const { count: totalCount, error: countError } = await supabase
          .from('digital_products')
          .select('*', { count: 'exact', head: true })
          .in('product_id', productIds);

        if (countError) {
          logger.error('Erreur lors du comptage des produits digitaux', {
            error: countError.message,
            productIdsLength: productIds.length,
          });
        }

        // Étape 3: Obtenir les digital_products avec jointure sur products
        // Utiliser la syntaxe de jointure Supabase avec la clé étrangère explicite
        // Note: La colonne est 'image_url', pas 'primary_image_url'
        
        // Calculer le range pour pagination côté serveur
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage - 1;

        // Construire la requête avec tri
        let query = supabase
          .from('digital_products')
          .select(`
            *,
            products!digital_products_product_id_fkey (
              id,
              name,
              slug,
              description,
              price,
              currency,
              is_active,
              image_url,
              store_id
            )
          `)
          .in('product_id', productIds);

        // Appliquer le tri selon sortBy
        switch (sortBy) {
          case 'recent':
            query = query.order('created_at', { ascending: sortOrder === 'asc' });
            break;
          case 'downloads':
            query = query.order('total_downloads', { ascending: sortOrder === 'asc' });
            break;
          case 'price-asc':
          case 'price-desc':
          case 'name':
            // Pour le tri par prix/nom, on doit trier côté client car c'est dans products
            // On laisse le tri par défaut (created_at) et on triera après
            query = query.order('created_at', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        // Appliquer pagination côté serveur
        query = query.range(startIndex, endIndex);

        const { data, error } = await query;
        
        // Si la jointure avec la clé explicite ne fonctionne pas, essayer sans
        if (error && error.code === 'PGRST116') {
          logger.warn('Tentative avec syntaxe alternative de jointure', {
            errorCode: error.code,
            productIdsLength: productIds.length,
          });
          const { data: altData, error: altError } = await supabase
            .from('digital_products')
            .select(`
              *,
              products (
                id,
                name,
                slug,
                description,
                price,
                currency,
                is_active,
                image_url,
                store_id
              )
            `)
            .in('product_id', productIds)
            .order('created_at', { ascending: false });
          
          if (altError) {
            logger.error('Erreur avec syntaxe alternative', {
              error: altError.message,
              code: altError.code,
              productIdsLength: productIds.length,
            });
            throw new Error('Erreur lors du chargement des produits digitaux: ' + altError.message);
          }
          
          // Utiliser les données de la requête alternative
          const mappedAltData = (altData || []).map((item: DigitalProductWithJoin): MappedDigitalProduct | null => {
            const productData = item.products;
            let product: ProductFromJoin | null = null;
            
            if (productData) {
              if (Array.isArray(productData)) {
                product = productData[0] || null;
              } else {
                product = productData;
              }
            }

            // Validation : si pas de produit associé, logger un warning
            if (!product) {
              logger.warn('Digital product without associated product (alt query)', {
                digitalProductId: item.id,
                productId: item.product_id,
              });
              return null;
            }

            // Validation : vérifier que le produit a les champs essentiels
            if (!product.id || !product.name) {
              logger.warn('Digital product with invalid product data (alt query)', {
                digitalProductId: item.id,
                productId: product.id,
                hasName: !!product.name,
              });
              return null;
            }

            return {
              ...item,
              product: product,
            } as MappedDigitalProduct;
          }).filter((item): item is MappedDigitalProduct => item !== null && item.product !== null);
          
          // Tri côté client pour prix et nom
          if (sortBy === 'price-asc' || sortBy === 'price-desc' || sortBy === 'name') {
            mappedAltData.sort((a, b) => {
              const productA = a.product;
              const productB = b.product;
              
              if (sortBy === 'price-asc') {
                return (productA?.price || 0) - (productB?.price || 0);
              } else if (sortBy === 'price-desc') {
                return (productB?.price || 0) - (productA?.price || 0);
              } else if (sortBy === 'name') {
                return (productA?.name || '').localeCompare(productB?.name || '');
              }
              return 0;
            });
          }
          
          return {
            data: mappedAltData,
            total: totalCount || 0,
            page,
            itemsPerPage,
            totalPages: Math.ceil((totalCount || 0) / itemsPerPage),
          };
        }
        
        if (error) {
          logger.error('Erreur lors de la récupération des digital_products', {
            code: error.code,
            message: error.message,
            details: error.details,
            productIdsLength: productIds.length,
            hint: error.hint,
            productIds: productIds.length
          });
          throw new Error('Erreur lors du chargement des produits digitaux: ' + error.message);
        }

        // Mapper les données pour avoir la structure attendue avec `product`
        const mappedData = (data || []).map((item: DigitalProductWithJoin): MappedDigitalProduct | null => {
          // S'assurer que products n'est pas null
          const productData = item.products;
          let product = null;
          
          if (productData) {
            if (Array.isArray(productData)) {
              product = productData[0] || null;
            } else {
              product = productData;
            }
          }

          // Validation : si pas de produit associé, logger un warning
          if (!product) {
            logger.warn('Digital product without associated product', {
              digitalProductId: item.id,
              productId: item.product_id,
            });
            return null; // Retourner null pour filtrage
          }

          // Validation : vérifier que le produit a les champs essentiels
          if (!product.id || !product.name) {
            logger.warn('Digital product with invalid product data', {
              digitalProductId: item.id,
              productId: product.id,
              hasName: !!product.name,
            });
            return null;
          }

          return {
            ...item,
            product: product,
          } as MappedDigitalProduct;
        }).filter((item): item is MappedDigitalProduct => item !== null && item.product !== null); // Filtrer les items sans produit associé

        // Tri côté client pour prix et nom (car les données sont dans products)
        if (sortBy === 'price-asc' || sortBy === 'price-desc' || sortBy === 'name') {
          mappedData.sort((a, b) => {
            const productA = a.product;
            const productB = b.product;
            
            if (sortBy === 'price-asc') {
              return (productA?.price || 0) - (productB?.price || 0);
            } else if (sortBy === 'price-desc') {
              return (productB?.price || 0) - (productA?.price || 0);
            } else if (sortBy === 'name') {
              return (productA?.name || '').localeCompare(productB?.name || '');
            }
            return 0;
          });
        }

        // Retourner avec métadonnées de pagination
        return {
          data: mappedData,
          total: totalCount || 0,
          page,
          itemsPerPage,
          totalPages: Math.ceil((totalCount || 0) / itemsPerPage),
        };
      } catch (error: unknown) {
        // Logger l'erreur avec contexte
        logger.error('Erreur dans useDigitalProducts', {
          error: error instanceof Error ? error.message : String(error),
          storeId,
          page,
          itemsPerPage,
          sortBy,
        });
        
        // Re-lancer l'erreur pour que React Query la gère
        throw error;
      }
    },
    enabled: true,
    retry: (failureCount, error) => {
      return shouldRetryError(error, failureCount);
    },
    retryDelay: (attemptIndex) => {
      return getRetryDelay(attemptIndex);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
  });
};

/**
 * useDigitalProduct - Hook pour récupérer un produit digital par ID
 */
export const useDigitalProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProduct', productId],
    queryFn: async () => {
      if (!productId) throw new Error('ID produit manquant');

      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    enabled: !!productId,
  });
};

/**
 * useCreateDigitalProduct - Hook pour créer un produit digital
 */
export const useCreateDigitalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: DigitalProductData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('digital_products')
        .insert({
          ...productData,
          user_id: user.id,
          total_downloads: 0,
          revenue: 0,
          current_licenses: 0,
          status: productData.status || 'draft',
          protection_level: productData.protectionLevel || 'basic',
          tags: productData.tags || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
    },
  });
};

/**
 * useUpdateDigitalProduct - Hook pour mettre à jour un produit digital
 */
export const useUpdateDigitalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: Partial<DigitalProductData> }) => {
      const { data, error } = await supabase
        .from('digital_products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data as DigitalProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
      queryClient.invalidateQueries({ queryKey: ['digitalProduct', variables.productId] });
    },
  });
};

/**
 * useDeleteDigitalProduct - Hook pour supprimer un produit digital
 */
export const useDeleteDigitalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
    },
  });
};

/**
 * useBulkUpdateDigitalProducts - Hook pour mettre à jour plusieurs produits
 */
export const useBulkUpdateDigitalProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productIds, updates }: { productIds: string[]; updates: Partial<DigitalProductData> }) => {
      const promises = productIds.map((id) =>
        supabase
          .from('digital_products')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`${errors.length} produit(s) n'ont pas pu être mis à jour`);
      }

      return results.map((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digitalProducts'] });
    },
  });
};

/**
 * useDigitalProductStats - Hook pour obtenir les statistiques d'un produit
 */
export const useDigitalProductStats = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProductStats', productId],
    queryFn: async () => {
      if (!productId) throw new Error('ID produit manquant');

      // Récupérer les statistiques (downloads, revenue, licenses)
      const { data: product, error: productError } = await supabase
        .from('digital_products')
        .select('total_downloads, revenue, current_licenses, max_licenses')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Récupérer les téléchargements récents (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentDownloads, error: downloadsError } = await supabase
        .from('download_logs')
        .select('id')
        .eq('product_id', productId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (downloadsError) throw downloadsError;

      // Récupérer le nombre de clients uniques
      const { data: customers, error: customersError } = await supabase
        .from('download_logs')
        .select('customer_id', { count: 'exact', head: false })
        .eq('product_id', productId);

      if (customersError) throw customersError;

      const uniqueCustomers = new Set(customers?.map((c) => c.customer_id) || []).size;

      return {
        totalDownloads: product.total_downloads || 0,
        recentDownloads: recentDownloads?.length || 0,
        revenue: product.revenue || 0,
        activeLicenses: product.current_licenses || 0,
        totalLicenses: product.max_licenses,
        activeCustomers: uniqueCustomers,
      };
    },
    enabled: !!productId,
  });
};

/**
 * useDigitalProductsByCategory - Hook pour filtrer par catégorie
 */
export const useDigitalProductsByCategory = (category: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProducts', 'category', category],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('digital_products')
        .select('*')
        .eq('user_id', user.id);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalProduct[];
    },
    enabled: category !== undefined,
  });
};

/**
 * useDigitalProductsByStatus - Hook pour filtrer par statut
 */
export const useDigitalProductsByStatus = (status: DigitalProduct['status'] | undefined) => {
  return useQuery({
    queryKey: ['digitalProducts', 'status', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      let query = supabase
        .from('digital_products')
        .select('*')
        .eq('user_id', user.id);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalProduct[];
    },
    enabled: status !== undefined,
  });
};

/**
 * useRemainingDownloads - Hook pour obtenir le nombre de téléchargements restants
 */
export const useRemainingDownloads = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProduct', digitalProductId, 'remainingDownloads'],
    queryFn: async () => {
      if (!digitalProductId) throw new Error('ID produit manquant');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Get product download limits
      const { data: product, error: productError } = await supabase
        .from('digital_products')
        .select('max_licenses, current_licenses')
        .eq('id', digitalProductId)
        .single();

      if (productError) throw productError;

      // Count user's downloads for this product
      const { count, error: countError } = await supabase
        .from('digital_product_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('digital_product_id', digitalProductId)
        .eq('user_id', user.id);

      if (countError) throw countError;

      const downloadCount = count || 0;
      const maxDownloads = product?.max_licenses || Infinity;
      const remaining = maxDownloads === Infinity ? Infinity : Math.max(0, maxDownloads - downloadCount);

      return {
        downloadCount,
        maxDownloads,
        remaining,
        hasRemainingDownloads: remaining > 0 || remaining === Infinity,
      };
    },
    enabled: !!digitalProductId,
  });
};

/**
 * useHasDownloadAccess - Hook pour vérifier si l'utilisateur a accès au téléchargement
 * Amélioré avec plusieurs méthodes de vérification pour plus de robustesse
 */
export const useHasDownloadAccess = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProduct', digitalProductId, 'hasAccess'],
    queryFn: async () => {
      if (!digitalProductId) {
        logger.warn('Digital product ID missing for access check');
        return { hasAccess: false, purchaseCount: 0, paymentStatus: 'unknown', method: 'none' };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        logger.debug('User not authenticated for access check');
        return { hasAccess: false, purchaseCount: 0, paymentStatus: 'not_authenticated', method: 'none' };
      }

      // Étape 1: Récupérer le product_id depuis digital_products
      const { data: digitalProduct, error: digitalError } = await supabase
        .from('digital_products')
        .select('product_id')
        .eq('id', digitalProductId)
        .single();

      if (digitalError || !digitalProduct) {
        logger.warn('Digital product not found', { digitalProductId, error: digitalError });
        return { hasAccess: false, purchaseCount: 0, paymentStatus: 'product_not_found', method: 'none' };
      }

      const productId = digitalProduct.product_id;

      // Étape 2: Méthode 1 - Vérification par customer_id (plus fiable)
      let hasAccessByCustomer = false;
      let purchaseCountByCustomer = 0;
      let paymentStatusByCustomer = 'unknown';

      // Récupérer le customer_id pour ce store
      const { data: stores } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Essayer de trouver le customer par email dans tous les stores
      const { data: customers } = await supabase
        .from('customers')
        .select('id, store_id, email')
        .eq('email', user.email);

      if (customers && customers.length > 0) {
        // Vérifier l'accès pour chaque customer trouvé
        for (const customer of customers) {
          const { data: orderItems, error: customerError } = await supabase
            .from('order_items')
            .select(`
              id,
              orders!inner (
                id,
                payment_status,
                status,
                customer_id,
                store_id
              )
            `)
            .eq('product_id', productId)
            .eq('orders.payment_status', 'paid')
            .eq('orders.status', 'completed')
            .eq('orders.customer_id', customer.id);

          if (!customerError && orderItems && orderItems.length > 0) {
            hasAccessByCustomer = true;
            purchaseCountByCustomer = orderItems.length;
            paymentStatusByCustomer = orderItems[0].orders?.payment_status || 'paid';
            logger.debug('Access found by customer_id', {
              customerId: customer.id,
              purchaseCount: purchaseCountByCustomer,
            });
            break;
          }
        }
      }

      // Étape 3: Méthode 2 - Vérification par email (fallback)
      let hasAccessByEmail = false;
      let purchaseCountByEmail = 0;
      let paymentStatusByEmail = 'unknown';

      if (!hasAccessByCustomer) {
        const { data: orderItemsByEmail, error: emailError } = await supabase
          .from('order_items')
          .select(`
            id,
            orders!inner (
              id,
              payment_status,
              status,
              customers!inner (
                id,
                email
              )
            )
          `)
          .eq('product_id', productId)
          .eq('orders.payment_status', 'paid')
          .eq('orders.status', 'completed')
          .eq('orders.customers.email', user.email);

        if (!emailError && orderItemsByEmail && orderItemsByEmail.length > 0) {
          hasAccessByEmail = true;
          purchaseCountByEmail = orderItemsByEmail.length;
          paymentStatusByEmail = orderItemsByEmail[0].orders?.payment_status || 'paid';
          logger.debug('Access found by email', {
            email: user.email,
            purchaseCount: purchaseCountByEmail,
          });
        }
      }

      // Étape 4: Méthode 3 - Vérification par user_id dans order_items metadata (si disponible)
      let hasAccessByUserId = false;
      let purchaseCountByUserId = 0;

      if (!hasAccessByCustomer && !hasAccessByEmail) {
        // Récupérer tous les order_items pour ce produit et filtrer côté client
        const { data: allOrderItems, error: metadataError } = await supabase
          .from('order_items')
          .select(`
            id,
            item_metadata,
            orders!inner (
              id,
              payment_status,
              status
            )
          `)
          .eq('product_id', productId)
          .eq('orders.payment_status', 'paid')
          .eq('orders.status', 'completed');

        if (!metadataError && allOrderItems) {
          // Filtrer côté client pour trouver ceux avec user_id dans metadata
          const matchingItems = allOrderItems.filter((item: { item_metadata?: { user_id?: string } }) => {
            const metadata = item.item_metadata;
            return metadata && typeof metadata === 'object' && metadata.user_id === user.id;
          });

          if (matchingItems.length > 0) {
            hasAccessByUserId = true;
            purchaseCountByUserId = matchingItems.length;
            logger.debug('Access found by user_id in metadata', {
              userId: user.id,
              purchaseCount: purchaseCountByUserId,
            });
          }
        }
      }

      // Résultat final : utiliser la première méthode qui a trouvé un accès
      const hasAccess = hasAccessByCustomer || hasAccessByEmail || hasAccessByUserId;
      const purchaseCount = hasAccessByCustomer 
        ? purchaseCountByCustomer 
        : hasAccessByEmail 
        ? purchaseCountByEmail 
        : purchaseCountByUserId;
      const paymentStatus = hasAccessByCustomer 
        ? paymentStatusByCustomer 
        : hasAccessByEmail 
        ? paymentStatusByEmail 
        : 'paid';
      const method = hasAccessByCustomer 
        ? 'customer_id' 
        : hasAccessByEmail 
        ? 'email' 
        : hasAccessByUserId 
        ? 'user_id_metadata' 
        : 'none';

      // Log pour debugging
      if (!hasAccess) {
        logger.debug('User does not have download access', {
          digitalProductId,
          productId,
          userId: user.id,
          userEmail: user.email,
          method: 'none',
          customerIdsChecked: customers?.map(c => c.id) || [],
        });
      } else {
        logger.debug('User has download access', {
          digitalProductId,
          productId,
          userId: user.id,
          method,
          purchaseCount,
          paymentStatus,
        });
      }

      return {
        hasAccess,
        purchaseCount,
        paymentStatus,
        method, // Retourner la méthode utilisée pour debug
      };
    },
    enabled: !!digitalProductId,
    retry: 1, // Réessayer une fois en cas d'erreur réseau
    retryDelay: 1000,
  });
};
