/**
 * Physical Product - Affiliate Settings
 * Date: 28 octobre 2025
 * 
 * Composant réutilisant DigitalAffiliateSettings pour produits physiques
 */

import { DigitalAffiliateSettings } from '../digital/DigitalAffiliateSettings';

interface PhysicalAffiliateSettingsProps {
  productPrice: number;
  productName: string;
  data: any;
  onUpdate: (data: any) => void;
}

export const PhysicalAffiliateSettings = ({
  productPrice,
  productName,
  data,
  onUpdate,
}: PhysicalAffiliateSettingsProps) => {
  return (
    <DigitalAffiliateSettings
      productPrice={productPrice}
      productName={productName}
      data={data}
      onUpdate={onUpdate}
    />
  );
};
