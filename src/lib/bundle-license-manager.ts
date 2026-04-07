/**
 * Bundle License Manager
 * Date: 31 Janvier 2025
 * 
 * Gestion automatique des licences multiples lors de l'achat d'un bundle
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface BundleLicenseConfig {
  bundleId: string;
  orderId: string;
  userId: string;
  customerEmail: string;
  customerName?: string;
  digitalProductIds: string[];
  autoGenerateLicenses: boolean;
  licenseDurationDays?: number;
}

export interface GeneratedLicense {
  productId: string;
  licenseId: string;
  licenseKey: string;
  licenseType: string;
}

/**
 * Générer les licences pour tous les produits d'un bundle
 */
export async function generateBundleLicenses(
  config: BundleLicenseConfig
): Promise<GeneratedLicense[]> {
  try {
    const  licenses: GeneratedLicense[] = [];

    // Récupérer les informations de chaque produit digital
    const { data: digitalProducts, error: productsError } = await supabase
      .from('digital_products')
      .select('id, license_type, max_licenses')
      .in('product_id', config.digitalProductIds);

    if (productsError) {
      logger.error('Error fetching digital products for bundle licenses', {
        error: productsError,
        bundleId: config.bundleId,
      });
      throw productsError;
    }

    // Générer une licence pour chaque produit du bundle
    for (const digitalProduct of digitalProducts || []) {
      // Vérifier si le produit nécessite une licence
      if (digitalProduct.license_type === 'none') {
        continue; // Pas de licence nécessaire
      }

      // Déterminer le type de licence
      const licenseType =
        digitalProduct.license_type === 'single'
          ? 'single'
          : digitalProduct.license_type === 'multi'
          ? 'multi'
          : 'unlimited';

      // Calculer la date d'expiration
      const expiresAt = config.licenseDurationDays
        ? new Date(Date.now() + config.licenseDurationDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Générer la clé de licence
      const licenseKey = generateLicenseKey();

      // Créer la licence
      const { data: license, error: licenseError } = await supabase
        .from('digital_licenses')
        .insert({
          digital_product_id: digitalProduct.id,
          user_id: config.userId,
          license_key: licenseKey,
          license_type: licenseType,
          max_activations: licenseType === 'unlimited' ? -1 : digitalProduct.max_licenses || 1,
          current_activations: 0,
          expires_at: expiresAt,
          status: 'active',
          customer_email: config.customerEmail,
          customer_name: config.customerName || config.customerEmail.split('@')[0],
          order_id: config.orderId,
          metadata: {
            bundle_id: config.bundleId,
            bundle_purchase: true,
          },
        })
        .select('id, license_key')
        .single();

      if (licenseError || !license) {
        logger.error('Error creating license for bundle product', {
          error: licenseError,
          productId: digitalProduct.id,
          bundleId: config.bundleId,
        });
        continue; // Continuer avec les autres produits
      }

      licenses.push({
        productId: digitalProduct.id,
        licenseId: license.id,
        licenseKey: license.license_key,
        licenseType,
      });

      logger.info('License generated for bundle product', {
        productId: digitalProduct.id,
        licenseId: license.id,
        bundleId: config.bundleId,
      });
    }

    return licenses;
  } catch (error) {
    logger.error('Error in generateBundleLicenses', { error, config });
    throw error;
  }
}

/**
 * Générer une clé de licence unique
 */
function generateLicenseKey(): string {
  const prefix = 'BND';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Vérifier si un bundle nécessite la génération de licences
 */
export async function shouldGenerateBundleLicenses(
  bundleId: string
): Promise<boolean> {
  try {
    const { data: bundle, error } = await supabase
      .from('digital_product_bundles')
      .select('auto_generate_licenses')
      .eq('id', bundleId)
      .single();

    if (error || !bundle) {
      return false;
    }

    return bundle.auto_generate_licenses ?? true;
  } catch (error) {
    logger.error('Error checking bundle license generation', { error, bundleId });
    return false;
  }
}

/**
 * Récupérer toutes les licences d'un bundle pour un utilisateur
 */
export async function getBundleLicenses(
  bundleId: string,
  userId: string
): Promise<GeneratedLicense[]> {
  try {
    const { data: licenses, error } = await supabase
      .from('digital_licenses')
      .select('id, license_key, license_type, digital_product_id, metadata')
      .eq('user_id', userId)
      .eq('metadata->>bundle_id', bundleId)
      .eq('status', 'active');

    if (error) {
      logger.error('Error fetching bundle licenses', { error, bundleId, userId });
      throw error;
    }

    return (licenses || []).map((license) => ({
      productId: license.digital_product_id,
      licenseId: license.id,
      licenseKey: license.license_key,
      licenseType: license.license_type,
    }));
  } catch (error) {
    logger.error('Error in getBundleLicenses', { error, bundleId, userId });
    throw error;
  }
}







