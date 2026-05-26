/**
 * Résolution d'une collection publique par ID (UUID) ou slug (+ boutique optionnelle).
 */

import { supabase } from '@/integrations/supabase/client';
import type { CollectionItem, CollectionWithItems } from '@/hooks/artist/useCollections';

const ARTIST_COLLECTION_FIELDS =
  'id, store_id, artist_product_id, collection_name, collection_slug, collection_description, collection_short_description, collection_type, cover_image_url, cover_image_alt, display_order, is_featured, is_public, tags, metadata, created_at, updated_at';
const ARTIST_COLLECTION_ITEM_FIELDS =
  'id, collection_id, product_id, artist_product_id, display_order, is_featured_in_collection, collection_notes, added_at';

const COLLECTION_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isArtistCollectionId(value: string): boolean {
  return COLLECTION_ID_REGEX.test(value);
}

async function attachCollectionItems(
  collection: CollectionWithItems
): Promise<CollectionWithItems> {
  const { data: items, error: itemsError } = await supabase
    .from('artist_collection_items')
    .select(ARTIST_COLLECTION_ITEM_FIELDS)
    .eq('collection_id', collection.id)
    .order('display_order', { ascending: true });

  if (itemsError && itemsError.code !== '42P01') {
    throw itemsError;
  }

  return {
    ...collection,
    items: (items || []) as CollectionItem[],
    items_count: items?.length || 0,
  };
}

/**
 * Charge une collection publique par UUID ou par slug (avec slug boutique pour désambiguïser).
 */
export async function fetchPublicArtistCollection(
  param: string,
  storeSlug?: string | null
): Promise<CollectionWithItems | null> {
  if (!param.trim()) return null;

  if (isArtistCollectionId(param)) {
    const { data, error } = await supabase
      .from('artist_collections')
      .select(ARTIST_COLLECTION_FIELDS)
      .eq('id', param)
      .eq('is_public', true)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null;
      throw error;
    }
    if (!data) return null;
    return attachCollectionItems(data as CollectionWithItems);
  }

  if (storeSlug) {
    const { data: store, error: storeError } = await supabase
      .from('stores_public')
      .select('id')
      .eq('slug', storeSlug)
      .maybeSingle();

    if (storeError) throw storeError;
    if (!store?.id) return null;

    const { data, error } = await supabase
      .from('artist_collections')
      .select(ARTIST_COLLECTION_FIELDS)
      .eq('collection_slug', param)
      .eq('store_id', store.id)
      .eq('is_public', true)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') return null;
      throw error;
    }
    if (!data) return null;
    return attachCollectionItems(data as CollectionWithItems);
  }

  const { data: rows, error } = await supabase
    .from('artist_collections')
    .select(ARTIST_COLLECTION_FIELDS)
    .eq('collection_slug', param)
    .eq('is_public', true)
    .limit(2);

  if (error) {
    if (error.code === '42P01') return null;
    throw error;
  }

  if (!rows?.length) return null;
  if (rows.length > 1) {
    throw new Error(
      'Plusieurs collections correspondent à ce lien. Ouvrez la collection depuis la galerie marketplace.'
    );
  }

  return attachCollectionItems(rows[0] as CollectionWithItems);
}
