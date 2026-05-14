/**
 * Type minimal boutique (référencé par les types produit unifiés).
 */
export interface Store {
  id: string;
  name?: string;
  slug?: string;
  subdomain?: string | null;
}
