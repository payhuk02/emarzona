/**
 * Adaptateur licences digitales — source canonique : digital_licenses.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  DigitalProductLicense,
  LicenseStatus,
  LicenseType,
  ValidationResult,
} from '@/hooks/digital/useLicenseManagement';

const CANONICAL_LICENSE_FIELDS =
  'id, digital_product_id, user_id, order_id, license_key, license_type, status, max_activations, current_activations, issued_at, activated_at, expires_at, customer_email, customer_name, internal_notes, created_at, updated_at';

type CanonicalLicenseRow = {
  id: string;
  digital_product_id: string;
  user_id: string;
  order_id: string | null;
  license_key: string;
  license_type: string;
  status: string;
  max_activations: number;
  current_activations: number;
  issued_at?: string | null;
  activated_at?: string | null;
  expires_at?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  internal_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export async function resolveDigitalProductId(productId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('digital_products')
    .select('id')
    .eq('product_id', productId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

export function mapCanonicalLicenseToVendorView(
  row: CanonicalLicenseRow,
  productId: string,
  storeId: string
): DigitalProductLicense {
  return {
    id: row.id,
    product_id: productId,
    order_id: row.order_id,
    customer_id: row.user_id,
    store_id: storeId,
    license_key: row.license_key,
    license_type: row.license_type as LicenseType,
    status: row.status as LicenseStatus,
    max_activations: row.max_activations,
    current_activations: row.current_activations,
    issued_at: row.issued_at ?? row.created_at,
    activated_at: row.activated_at ?? null,
    expires_at: row.expires_at ?? null,
    last_used_at: row.activated_at ?? null,
    transferable: false,
    transferred_from: null,
    transferred_to: null,
    transferred_at: null,
    metadata: {},
    notes: row.internal_notes ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchCanonicalLicensesForProduct(
  productId: string,
  storeId: string
): Promise<DigitalProductLicense[]> {
  const digitalProductId = await resolveDigitalProductId(productId);
  if (!digitalProductId) return [];

  const { data, error } = await supabase
    .from('digital_licenses')
    .select(CANONICAL_LICENSE_FIELDS)
    .eq('digital_product_id', digitalProductId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return ((data ?? []) as CanonicalLicenseRow[]).map(row =>
    mapCanonicalLicenseToVendorView(row, productId, storeId)
  );
}

export async function validateDigitalLicenseForActivation(
  licenseKey: string,
  deviceFingerprint?: string
): Promise<ValidationResult> {
  const { data: license, error } = await supabase
    .from('digital_licenses')
    .select(CANONICAL_LICENSE_FIELDS)
    .eq('license_key', licenseKey)
    .maybeSingle();

  if (error) throw error;
  if (!license) {
    return { valid: false, message: 'Licence introuvable' };
  }

  const row = license as CanonicalLicenseRow;

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { valid: false, message: 'Licence expirée' };
  }

  if (row.status !== 'active' && row.status !== 'pending') {
    return { valid: false, message: `Licence ${row.status}` };
  }

  if (deviceFingerprint) {
    const { data: existing } = await supabase
      .from('digital_license_activations')
      .select('id')
      .eq('license_id', row.id)
      .eq('device_id', deviceFingerprint)
      .eq('is_active', true)
      .maybeSingle();

    if (existing) {
      return {
        valid: true,
        already_activated: true,
        license: mapCanonicalLicenseToVendorView(row, '', ''),
        can_activate: false,
        current_activations: row.current_activations,
        max_activations: row.max_activations,
      };
    }
  }

  const unlimited = row.max_activations === -1;
  const canActivate = unlimited || row.current_activations < row.max_activations;

  if (!canActivate) {
    return {
      valid: false,
      message: "Limite d'activations atteinte",
      license: mapCanonicalLicenseToVendorView(row, '', ''),
      can_activate: false,
      current_activations: row.current_activations,
      max_activations: row.max_activations,
    };
  }

  return {
    valid: true,
    can_activate: true,
    license: mapCanonicalLicenseToVendorView(row, '', ''),
    current_activations: row.current_activations,
    max_activations: row.max_activations,
  };
}
