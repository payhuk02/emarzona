/**
 * Service unifié de création boutique — validation Zod, slug RPC, réservés.
 */

import { supabase } from '@/integrations/supabase/client';
import { STORE_COMMERCE_TYPES, type StoreCommerceType } from '@/constants/store-commerce-types';
import { generateSlug } from '@/lib/store-utils';
import { isSubdomainReserved } from '@/lib/subdomain-detector';
import { validateStoreCreate } from '@/lib/store-validation';
import { z } from 'zod';

export const storeCreateInputSchema = z.object({
  name: z.string().trim().min(1, 'Le nom de la boutique est requis'),
  slug: z.string().optional(),
  description: z.string().optional(),
  commerce_type: z.enum(STORE_COMMERCE_TYPES, {
    errorMap: () => ({ message: 'Le type de boutique est requis' }),
  }),
  default_currency: z.string().optional(),
});

export type StoreCreateInput = z.infer<typeof storeCreateInputSchema>;

export function normalizeStoreCreateInput(raw: StoreCreateInput) {
  const parsed = storeCreateInputSchema.parse(raw);
  const slug = generateSlug(parsed.slug?.trim() || parsed.name);

  return {
    name: parsed.name.trim(),
    slug,
    description: parsed.description?.trim() || '',
    commerce_type: parsed.commerce_type,
    default_currency: parsed.default_currency || 'XOF',
  };
}

export function validateNormalizedCreateInput(input: ReturnType<typeof normalizeStoreCreateInput>) {
  return validateStoreCreate({
    name: input.name,
    slug: input.slug,
    description: input.description,
    default_currency: input.default_currency,
    commerce_type: input.commerce_type,
  });
}

export async function isStoreSlugAvailable(
  slug: string,
  excludeStoreId?: string | null
): Promise<boolean> {
  const cleanSlug = generateSlug(slug);
  if (!cleanSlug || cleanSlug.length < 2) {
    return false;
  }

  if (isSubdomainReserved(cleanSlug)) {
    return false;
  }

  const { data, error } = await supabase.rpc('is_store_slug_available', {
    check_slug: cleanSlug,
    exclude_store_id: excludeStoreId ?? null,
  });

  if (error) {
    throw error;
  }

  return data === true;
}

export async function assertReadyToCreateStore(raw: StoreCreateInput) {
  const normalized = normalizeStoreCreateInput(raw);
  const validation = validateNormalizedCreateInput(normalized);

  if (!validation.valid || !validation.data) {
    const firstError = Object.values(validation.errors)[0] || 'Données invalides';
    throw new Error(firstError);
  }

  const slugAvailable = await isStoreSlugAvailable(normalized.slug);
  if (!slugAvailable) {
    throw new Error('Ce slug est déjà utilisé ou réservé. Choisissez une autre URL.');
  }

  return {
    ...validation.data,
    commerce_type: normalized.commerce_type,
  };
}
