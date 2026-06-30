/**
 * Contrat RLS portails client — tables lues sous /account/*
 * Validé offline par Vitest ; complété par audit SQL remote (audit-client-portal-rls.sql).
 */
export interface ClientPortalRlsRequirement {
  table: string;
  /** Nom exact de la politique CREATE POLICY attendue dans les migrations */
  policyName: string;
}

/** Politiques acheteur critiques — dernière version connue dans les migrations */
export const CLIENT_PORTAL_RLS_REQUIREMENTS: ClientPortalRlsRequirement[] = [
  { table: 'orders', policyName: 'Buyers can select their orders' },
  { table: 'order_items', policyName: 'Buyers can select their order items' },
  { table: 'customers', policyName: 'Customers can read own customer row by email' },
  { table: 'digital_licenses', policyName: 'Customers can view own licenses' },
  { table: 'customer_downloads', policyName: 'Users can view own downloads' },
  { table: 'course_enrollments', policyName: 'Users can view own enrollments' },
  { table: 'service_bookings', policyName: 'Users can view own service bookings' },
  { table: 'product_returns', policyName: 'Customers can view own returns' },
  { table: 'product_warranties', policyName: 'Customers can view own warranties' },
  { table: 'warranty_claims', policyName: 'Customers can view own claims' },
  { table: 'shipping_labels', policyName: 'Customers can view own labels' },
  { table: 'invoices', policyName: 'Customers can view their own invoices' },
  { table: 'order_protect_enrollments', policyName: 'Buyers view own protect enrollments' },
  { table: 'artist_product_certificates', policyName: 'Users can view their own certificates' },
];

export function buildPolicyPattern(table: string, policyName: string): RegExp {
  const escaped = policyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`CREATE\\s+POLICY\\s+"${escaped}"\\s+ON\\s+public\\.${table}\\b`, 'i');
}
