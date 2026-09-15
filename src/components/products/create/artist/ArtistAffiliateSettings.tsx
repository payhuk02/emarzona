/**
 * Artist Product - Affiliate Settings
 * Réutilise DigitalAffiliateSettings pour les œuvres d'artiste.
 */

import { DigitalAffiliateSettings } from '../digital/DigitalAffiliateSettings';

interface AffiliateSettings {
  enabled: boolean;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_commission_amount: number;
  cookie_duration_days: number;
  max_commission_per_sale?: number;
  min_order_amount: number;
  allow_self_referral: boolean;
  require_approval: boolean;
  terms_and_conditions: string;
}

interface ArtistAffiliateSettingsProps {
  productPrice: number;
  productName: string;
  data: Partial<AffiliateSettings>;
  onUpdate: (data: Partial<AffiliateSettings>) => void;
}

export const ArtistAffiliateSettings = ({
  productPrice,
  productName,
  data,
  onUpdate,
}: ArtistAffiliateSettingsProps) => {
  return (
    <DigitalAffiliateSettings
      productPrice={productPrice}
      productName={productName}
      data={data}
      onUpdate={onUpdate}
    />
  );
};
