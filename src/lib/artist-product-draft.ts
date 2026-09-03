/**
 * Gestion des brouillons de produits artistes
 * Sauvegarde locale + serveur pour persistance
 * Date: 31 Janvier 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { ArtistProductFormData } from '@/types/artist-product';

const DRAFT_STORAGE_KEY = 'artist-product-draft';
const DRAFT_SYNC_INTERVAL = 30000; // 30 secondes

export interface DraftMetadata {
  storeId: string;
  lastSaved: string;
  step: number;
  version: number;
}

/**
 * Sauvegarde locale uniquement (rapide)
 */
export function saveDraftLocal(data: Partial<ArtistProductFormData>): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    logger.debug('Brouillon sauvegardé localement', { step: data });
  } catch (error) {
    logger.warn('Erreur sauvegarde locale brouillon', { error });
  }
}

/**
 * Charge le brouillon depuis le stockage local
 */
export function loadDraftLocal(): Partial<ArtistProductFormData> | null {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as Partial<ArtistProductFormData>;
  } catch (error) {
    logger.warn('Erreur chargement brouillon local', { error });
    return null;
  }
}

/**
 * Supprime le brouillon local
 */
export function clearDraftLocal(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (error) {
    logger.warn('Erreur suppression brouillon local', { error });
  }
}

/**
 * Sauvegarde le brouillon sur le serveur (Supabase)
 * Utilise la table user_drafts si elle existe, sinon crée un enregistrement temporaire
 */
export async function saveDraftServer(
  data: Partial<ArtistProductFormData>,
  storeId: string,
  step: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    // Vérifier si l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      logger.warn('Utilisateur non authentifié, sauvegarde serveur ignorée');
      return { success: false, error: 'Non authentifié' };
    }

    // Essayer de sauvegarder dans une table de brouillons (si elle existe)
    // Sinon, on utilise un storage bucket ou une table générique
    const draftData = {
      user_id: user.id,
      store_id: storeId,
      draft_type: 'artist_product',
      draft_data: data,
      step,
      updated_at: new Date().toISOString(),
    };

    // Essayer d'insérer/mettre à jour dans une table user_drafts
    // Si la table n'existe pas, on log juste l'erreur et on continue avec localStorage
    const { error } = await supabase
      .from('user_drafts')
      .upsert(
        {
          ...draftData,
          id: `${user.id}_${storeId}_artist_product`, // ID composite pour upsert
        },
        {
          onConflict: 'id',
        }
      )
      .select();

    if (error) {
      // Si la table n'existe pas, c'est OK, on continue avec localStorage
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        logger.debug("Table user_drafts n'existe pas, utilisation localStorage uniquement");
        return { success: true }; // On considère comme succès car localStorage fonctionne
      }
      throw error;
    }

    logger.info('Brouillon sauvegardé sur serveur', { storeId, step });
    return { success: true };
  } catch (error) {
    logger.error('Erreur sauvegarde serveur brouillon', { error });
    // Ne pas bloquer si la sauvegarde serveur échoue
    return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
}

/**
 * Charge le brouillon depuis le serveur
 */
export async function loadDraftServer(
  storeId: string
): Promise<Partial<ArtistProductFormData> | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_drafts')
      .select('draft_data, step, updated_at')
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .eq('draft_type', 'artist_product')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas de brouillon trouvé, c'est OK
        return null;
      }
      if (error.code === '42P01') {
        // Table n'existe pas, c'est OK
        return null;
      }
      throw error;
    }

    if (data?.draft_data) {
      logger.info('Brouillon chargé depuis serveur', { storeId, step: data.step });
      return data.draft_data as Partial<ArtistProductFormData>;
    }

    return null;
  } catch (error) {
    logger.warn('Erreur chargement brouillon serveur', { error });
    return null;
  }
}

/**
 * Sauvegarde hybride: locale (immédiate) + serveur (asynchrone)
 */
export async function saveDraftHybrid(
  data: Partial<ArtistProductFormData>,
  storeId: string,
  step: number = 1
): Promise<void> {
  // Sauvegarde locale immédiate
  saveDraftLocal(data);

  // Sauvegarde serveur asynchrone (ne bloque pas)
  saveDraftServer(data, storeId, step).catch(error => {
    logger.warn('Échec sauvegarde serveur brouillon (non bloquant)', { error });
  });
}

/**
 * Charge le brouillon: essaie serveur d'abord, puis local
 */
export async function loadDraftHybrid(storeId: string): Promise<{
  data: Partial<ArtistProductFormData> | null;
  source: 'server' | 'local' | null;
}> {
  // Essayer serveur d'abord
  const serverDraft = await loadDraftServer(storeId);
  if (serverDraft) {
    // Synchroniser avec localStorage
    saveDraftLocal(serverDraft);
    return { data: serverDraft, source: 'server' };
  }

  // Fallback sur localStorage
  const localDraft = loadDraftLocal();
  if (localDraft) {
    return { data: localDraft, source: 'local' };
  }

  return { data: null, source: null };
}

/**
 * Supprime le brouillon (local + serveur)
 */
export async function clearDraft(storeId: string): Promise<void> {
  clearDraftLocal();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_drafts')
      .delete()
      .eq('user_id', user.id)
      .eq('store_id', storeId)
      .eq('draft_type', 'artist_product');
  } catch (error) {
    // Ignorer si la table n'existe pas
    if (error && typeof error === 'object' && 'code' in error && error.code !== '42P01') {
      logger.warn('Erreur suppression brouillon serveur', { error });
    }
  }
}
