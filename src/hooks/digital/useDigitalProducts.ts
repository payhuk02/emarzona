import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

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
 * useDigitalProducts - Hook pour lister les produits digitaux
 * Avec jointure sur products pour avoir toutes les infos
 * Support pagination côté serveur pour performance optimale
 */
export const useDigitalProducts = (
  storeId?: string,
  paginationOptions?: DigitalProductsPaginationOptions
) => {
  const { page = 1, itemsPerPage = 12, sortBy = 'recent', sortOrder = 'desc' } = paginationOptions || {};

  return useQuery({
    queryKey: ['digitalProducts', storeId, page, itemsPerPage, sortBy, sortOrder],
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

        if (storeId) {
          // Si storeId est fourni, obtenir tous les products de ce store
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .eq('store_id', storeId);

          if (productsError) {
            logger.error('Erreur lors de la récupération des products', {
              error: productsError.message,
              code: productsError.code,
              storeId,
            });
            throw new Error('Erreur lors de la récupération des produits: ' + productsError.message);
          }
          productIds = products?.map(p => p.id) || [];
        } else {
          // Sinon, obtenir tous les stores de l'utilisateur, puis leurs products
          const { data: stores, error: storesError } = await supabase
            .from('stores')
            .select('id')
            .eq('user_id', user.id);

          if (storesError) {
            logger.error('Erreur lors de la récupération des stores', {
              error: storesError.message,
              code: storesError.code,
              userId: user.id,
            });
            throw new Error('Erreur lors de la récupération des boutiques: ' + storesError.message);
          }

          if (stores && stores.length > 0) {
            const storeIds = stores.map(s => s.id);
            const { data: products, error: productsError } = await supabase
              .from('products')
              .select('id')
              .in('store_id', storeIds);

            if (productsError) {
              logger.error('Erreur lors de la récupération des products pour les stores', {
                error: productsError.message,
                code: productsError.code,
                storeIds: storeIds.length,
              });
              throw new Error('Erreur lors de la récupération des produits: ' + productsError.message);
            }
            productIds = products?.map(p => p.id) || [];
          } else {
            // Pas de stores, retourner structure paginée vide
            logger.debug('Aucune boutique trouvée pour l\'utilisateur', {
              userId: user.id,
            });
            return {
              data: [],
              total: 0,
              page,
              itemsPerPage,
              totalPages: 0,
            };
          }
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
          const mappedAltData = (altData || []).map((item: any) => {
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
            };
          }).filter((item: any) => item !== null && item.product !== null);
          
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
            data: mappedAltData as any[],
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
        const mappedData = (data || []).map((item: any) => {
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
          };
        }).filter((item: any) => item !== null && item.product !== null); // Filtrer les items sans produit associé

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
          data: mappedData as any[],
          total: totalCount || 0,
          page,
          itemsPerPage,
          totalPages: Math.ceil((totalCount || 0) / itemsPerPage),
        };
      } catch (error: any) {
        console.error('Erreur dans useDigitalProducts:', error);
        // Re-lancer l'erreur avec un message plus clair
        throw new Error(error.message || 'Impossible de charger les produits digitaux. Veuillez réessayer.');
      }
    },
    enabled: true,
    retry: 1, // Réessayer une fois en cas d'erreur
    retryDelay: 1000, // Attendre 1 seconde avant de réessayer
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
 */
export const useHasDownloadAccess = (digitalProductId: string | undefined) => {
  return useQuery({
    queryKey: ['digitalProduct', digitalProductId, 'hasAccess'],
    queryFn: async () => {
      if (!digitalProductId) throw new Error('ID produit manquant');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      // Étape 1: Récupérer le product_id depuis digital_products
      const { data: digitalProduct, error: digitalError } = await supabase
        .from('digital_products')
        .select('product_id')
        .eq('id', digitalProductId)
        .single();

      if (digitalError || !digitalProduct) {
        logger.warn('Digital product not found', { digitalProductId });
        return { hasAccess: false, purchaseCount: 0, paymentStatus: 'unknown' };
      }

      // Étape 2: Vérifier l'accès via order_items avec vérification explicite du paiement
      // Vérification par email
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
        .eq('product_id', digitalProduct.product_id)
        .eq('orders.payment_status', 'paid') // ⚠️ CRITIQUE: Vérification explicite paiement
        .eq('orders.status', 'completed') // Status commande doit être complété
        .eq('orders.customers.email', user.email)
        .limit(1);

      // Vérification alternative par customer_id si disponible
      let orderItemsByCustomer = null;
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .limit(1);

      if (customer && customer.length > 0) {
        const { data: orderItemsByCustomerId } = await supabase
          .from('order_items')
          .select(`
            id,
            orders!inner (
              id,
              payment_status,
              status,
              customer_id
            )
          `)
          .eq('product_id', digitalProduct.product_id)
          .eq('orders.payment_status', 'paid') // ⚠️ CRITIQUE: Vérification explicite paiement
          .eq('orders.status', 'completed')
          .eq('orders.customer_id', customer[0].id)
          .limit(1);

        orderItemsByCustomer = orderItemsByCustomerId;
      }

      // Utiliser les résultats de l'une ou l'autre vérification
      const orderItems = orderItemsByEmail || orderItemsByCustomer;
      const error = emailError;

      if (error) {
        logger.error('Error checking download access', { error, digitalProductId });
        throw error;
      }

      const hasAccess = orderItems && orderItems.length > 0;
      const paymentStatus = orderItems && orderItems.length > 0 
        ? orderItems[0].orders?.payment_status || 'unknown'
        : 'not_paid';

      // Log pour debugging
      if (!hasAccess) {
        logger.debug('User does not have download access', {
          digitalProductId,
          userId: user.id,
          userEmail: user.email,
          paymentStatus,
        });
      }

      return {
        hasAccess,
        purchaseCount: orderItems?.length || 0,
        paymentStatus, // Retourner le statut pour debug
      };
    },
    enabled: !!digitalProductId,
  });
};
