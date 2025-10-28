/**
 * Service Product - Affiliate Settings
 * Date: 28 octobre 2025
 * 
 * Composant réutilisant DigitalAffiliateSettings pour services
 */

import { DigitalAffiliateSettings } from '../digital/DigitalAffiliateSettings';

interface ServiceAffiliateSettingsProps {
  productPrice: number;
  productName: string;
  data: any;
  onUpdate: (data: any) => void;
}

export const ServiceAffiliateSettings = ({
  productPrice,
  productName,
  data,
  onUpdate,
}: ServiceAffiliateSettingsProps) => {
  return (
    <DigitalAffiliateSettings
      productPrice={productPrice}
      productName={productName}
      data={data}
      onUpdate={onUpdate}
    />
  );
};
