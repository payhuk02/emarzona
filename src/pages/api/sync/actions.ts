/**
 * API Endpoint pour la synchronisation des actions offline-first
 * Reçoit les actions locales et les applique au backend avec validation stricte
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import jwt from 'jsonwebtoken';

// Types pour les actions synchronisées
interface SyncActionPayload {
  id: string;
  action_type: string;
  payload: Record<string, unknown>;
  idempotency_key: string;
  store_id: string;
}

interface SyncRequest {
  actions: SyncActionPayload[];
}

interface SyncResult {
  id: string;
  success: boolean;
  error?: string;
  applied_at?: string;
}

interface JWTPayload {
  user_id: string;
  role: string;
  store_id?: string;
  iat: number;
  exp: number;
}

// Actions supportées et leurs handlers
const ACTION_HANDLERS: Record<string, (payload: any, context: ActionContext) => Promise<void>> = {
  async create_order(payload, context) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...payload,
        user_id: context.user_id,
        store_id: context.store_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw new Error(`Erreur création commande: ${error.message}`);
  },

  async update_product(payload, context) {
    const { id, ...updates } = payload;

    // Vérifier que l'utilisateur peut modifier ce produit
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', id)
      .single();

    if (fetchError || !product) {
      throw new Error('Produit introuvable');
    }

    if (product.store_id !== context.store_id && context.role !== 'admin') {
      throw new Error('Accès non autorisé à ce produit');
    }

    const { error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw new Error(`Erreur mise à jour produit: ${error.message}`);
  },

  async add_to_cart(payload, context) {
    const { product_id, quantity = 1, ...cartData } = payload;

    // Vérifier que le produit existe et est disponible
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, price, stock_quantity, is_active')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      throw new Error('Produit introuvable');
    }

    if (!product.is_active) {
      throw new Error('Produit non disponible');
    }

    if (product.stock_quantity !== null && product.stock_quantity < quantity) {
      throw new Error('Stock insuffisant');
    }

    // Ajouter au panier
    const { error } = await supabase
      .from('carts')
      .insert({
        ...cartData,
        user_id: context.user_id,
        product_id,
        quantity,
        unit_price: product.price,
        created_at: new Date().toISOString()
      });

    if (error) throw new Error(`Erreur ajout au panier: ${error.message}`);
  },

  async create_store(payload, context) {
    // Seuls les admins peuvent créer des boutiques
    if (context.role !== 'admin') {
      throw new Error('Accès non autorisé: création de boutique');
    }

    const { error } = await supabase
      .from('stores')
      .insert({
        ...payload,
        created_at: new Date().toISOString()
      });

    if (error) throw new Error(`Erreur création boutique: ${error.message}`);
  },

  async create_user(payload, context) {
    // Seuls les admins peuvent créer des utilisateurs
    if (context.role !== 'admin') {
      throw new Error('Accès non autorisé: création d\'utilisateur');
    }

    const { error } = await supabase
      .from('users')
      .insert({
        ...payload,
        created_at: new Date().toISOString()
      });

    if (error) throw new Error(`Erreur création utilisateur: ${error.message}`);
  }
};

interface ActionContext {
  user_id: string;
  role: string;
  store_id: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Uniquement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // 1. Validation du JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Tentative de sync sans token JWT');
      return res.status(401).json({ error: 'Token JWT requis' });
    }

    const token = authHeader.substring(7);
    let decoded: JWTPayload;

    try {
      // Récupérer la clé secrète depuis les variables d'environnement
      const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;
      if (!jwtSecret) {
        logger.error('JWT_SECRET non configuré');
        return res.status(500).json({ error: 'Configuration serveur invalide' });
      }

      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      logger.warn('Token JWT invalide:', jwtError);
      return res.status(401).json({ error: 'Token JWT invalide' });
    }

    // 2. Validation de la payload
    const { actions }: SyncRequest = req.body;

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return res.status(400).json({ error: 'Payload invalide: actions requises' });
    }

    if (actions.length > 50) {
      return res.status(400).json({ error: 'Trop d\'actions dans une requête (max 50)' });
    }

    // 3. Contexte d'exécution
    const context: ActionContext = {
      user_id: decoded.user_id,
      role: decoded.role,
      store_id: decoded.store_id || decoded.user_id // Fallback pour les vendeurs
    };

    // 4. Traitement des actions
    const results: SyncResult[] = [];

    for (const action of actions) {
      try {
        // Validation de base de l'action
        if (!action.id || !action.action_type || !action.idempotency_key) {
          results.push({
            id: action.id || 'unknown',
            success: false,
            error: 'Action malformée'
          });
          continue;
        }

        // Vérification de l'idempotency
        const { data: existingKey, error: keyError } = await supabase
          .from('idempotency_keys')
          .select('id')
          .eq('key', action.idempotency_key)
          .single();

        if (existingKey) {
          // Action déjà traitée
          results.push({
            id: action.id,
            success: true,
            applied_at: new Date().toISOString()
          });
          continue;
        }

        if (keyError && keyError.code !== 'PGRST116') { // PGRST116 = not found
          throw new Error(`Erreur vérification idempotency: ${keyError.message}`);
        }

        // Vérification du type d'action
        const handler = ACTION_HANDLERS[action.action_type];
        if (!handler) {
          results.push({
            id: action.id,
            success: false,
            error: `Type d'action non supporté: ${action.action_type}`
          });
          continue;
        }

        // Exécution de l'action
        await handler(action.payload, context);

        // Enregistrement de la clé d'idempotency
        const { error: insertError } = await supabase
          .from('idempotency_keys')
          .insert({
            key: action.idempotency_key,
            action_type: action.action_type,
            user_id: context.user_id,
            created_at: new Date().toISOString()
          });

        if (insertError) {
          logger.error('Erreur enregistrement idempotency key:', insertError);
          // Ne pas échouer pour autant, l'action est déjà exécutée
        }

        results.push({
          id: action.id,
          success: true,
          applied_at: new Date().toISOString()
        });

        logger.info(`Action synchronisée: ${action.action_type} (${action.id})`);

      } catch (error) {
        logger.error(`Erreur traitement action ${action.id}:`, error);

        results.push({
          id: action.id,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
      }
    }

    // 5. Réponse
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`Sync terminée: ${successCount} réussis, ${failureCount} échoués`);

    res.status(200).json({
      success: failureCount === 0,
      synced: successCount,
      failed: failureCount,
      results
    });

  } catch (error) {
    logger.error('Erreur globale endpoint sync:', error);

    res.status(500).json({
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}