/** Pays ciblés par Emarzona — drapeaux dans public/landing/flags/{code}.svg */
export type LandingCountryRegionKey = 'africa' | 'europe' | 'americas' | 'middleEast';

export type LandingCountry = {
  code: string;
  regionKey: LandingCountryRegionKey;
};

export const LANDING_COUNTRIES: LandingCountry[] = [
  { code: 'BF', regionKey: 'africa' },
  { code: 'SN', regionKey: 'africa' },
  { code: 'CI', regionKey: 'africa' },
  { code: 'ML', regionKey: 'africa' },
  { code: 'BJ', regionKey: 'africa' },
  { code: 'TG', regionKey: 'africa' },
  { code: 'NE', regionKey: 'africa' },
  { code: 'CM', regionKey: 'africa' },
  { code: 'GN', regionKey: 'africa' },
  { code: 'GH', regionKey: 'africa' },
  { code: 'NG', regionKey: 'africa' },
  { code: 'MA', regionKey: 'africa' },
  { code: 'TN', regionKey: 'africa' },
  { code: 'DZ', regionKey: 'africa' },
  { code: 'ZA', regionKey: 'africa' },
  { code: 'KE', regionKey: 'africa' },
  { code: 'RW', regionKey: 'africa' },
  { code: 'CD', regionKey: 'africa' },
  { code: 'GA', regionKey: 'africa' },
  { code: 'FR', regionKey: 'europe' },
  { code: 'BE', regionKey: 'europe' },
  { code: 'CH', regionKey: 'europe' },
  { code: 'DE', regionKey: 'europe' },
  { code: 'GB', regionKey: 'europe' },
  { code: 'ES', regionKey: 'europe' },
  { code: 'IT', regionKey: 'europe' },
  { code: 'PT', regionKey: 'europe' },
  { code: 'CA', regionKey: 'americas' },
  { code: 'US', regionKey: 'americas' },
  { code: 'AE', regionKey: 'middleEast' },
];
