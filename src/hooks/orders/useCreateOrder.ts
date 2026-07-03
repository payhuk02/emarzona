/**
 * Hook universel pour créer une commande
 * Date: 28 octobre 2025
 *
 * Router intelligent qui utilise le pattern Strategy pour créer une commande
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { type CreateDigitalOrderOptions } from './useCreateDigitalOrder';
import { type CreatePhysicalOrderOptions } from './useCreatePhysicalOrder';
import { type CreateServiceOrderOptions } from './useCreateServiceOrder';
import { type CreateCourseOrderOptions } from './useCreateCourseOrder';
import { type CreateArtistOrderOptions } from './useCreateArtistOrder';
import { orderStrategyRegistry } from './strategies/registry';
import { logger } from '@/lib/logger';

const GENERIC_PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, product_type';

export interface CreateOrderOptions {
  productId: string;
  storeId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  quantity?: number;

  digitalOptions?: Partial<CreateDigitalOrderOptions>;
  physicalOptions?: Partial<CreatePhysicalOrderOptions>;
  serviceOptions?: Partial<CreateServiceOrderOptions>;
  courseOptions?: Partial<CreateCourseOrderOptions>;
  artistOptions?: Partial<CreateArtistOrderOptions>;
}

export const useCreateOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: CreateOrderOptions) => {
      const {
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        quantity = 1,
        digitalOptions,
        physicalOptions,
        serviceOptions,
        courseOptions,
        artistOptions,
      } = options;

      const { data: product, error: productError } = await supabase
        .from('products')
        .select(GENERIC_PRODUCT_FIELDS)
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      const productType = product.product_type;

      let typeOptions: Record<string, unknown> | undefined;
      switch (productType) {
        case 'digital': typeOptions = digitalOptions; break;
        case 'physical': typeOptions = physicalOptions; break;
        case 'service': typeOptions = serviceOptions; break;
        case 'course': typeOptions = courseOptions; break;
        case 'artist': typeOptions = artistOptions; break;
      }

      if (productType === 'generic') {
        toast({
          title: 'ℹ️ Type de produit',
          description: `Utilisation du flux générique pour ${productType}`,
        });
      }

      const strategy = orderStrategyRegistry.getStrategy(productType);

      return await strategy.createOrder({
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        quantity,
        productType,
        productRecord: product,
        options: typeOptions,
      });
    },

    onError: (error: Error) => {
      logger.error('Order creation error', { error: error.message });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la commande',
        variant: 'destructive',
      });
    },
  });
};
