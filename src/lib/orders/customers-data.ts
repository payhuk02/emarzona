/**
 * Couche d'accès données clients boutique — find-or-create par store + email.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type DbClient = SupabaseClient<Database>;

export interface StoreCustomerInput {
  storeId: string;
  email: string;
  name?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface StoreCustomerUpdate {
  name?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

/**
 * Récupère ou crée un client pour une boutique (upsert logique par email).
 */
export async function findOrCreateStoreCustomer(
  input: StoreCustomerInput,
  client: DbClient = supabase
): Promise<string> {
  const { data: existingCustomer } = await client
    .from('customers')
    .select('id')
    .eq('store_id', input.storeId)
    .eq('email', input.email)
    .maybeSingle();

  if (existingCustomer?.id) {
    const updates: StoreCustomerUpdate = {};
    if (input.address !== undefined) updates.address = input.address;
    if (input.city !== undefined) updates.city = input.city;
    if (input.country !== undefined) updates.country = input.country;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.name !== undefined) updates.name = input.name;

    if (Object.keys(updates).length > 0) {
      await client.from('customers').update(updates).eq('id', existingCustomer.id);
    }

    return existingCustomer.id;
  }

  const { data: newCustomer, error: customerError } = await client
    .from('customers')
    .insert({
      store_id: input.storeId,
      email: input.email,
      name: input.name ?? input.email.split('@')[0],
      phone: input.phone ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      country: input.country ?? null,
    })
    .select('id')
    .single();

  if (customerError || !newCustomer) {
    throw new Error('Erreur lors de la création du client');
  }

  return newCustomer.id;
}
