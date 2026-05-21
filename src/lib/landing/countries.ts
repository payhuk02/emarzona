/** Pays ciblés par Emarzona — drapeaux dans public/landing/flags/{code}.svg */
export type LandingCountry = {
  code: string;
  name: string;
  region: 'Afrique' | 'Europe' | 'Amériques' | 'Moyen-Orient';
};

export const LANDING_COUNTRIES: LandingCountry[] = [
  { code: 'BF', name: 'Burkina Faso', region: 'Afrique' },
  { code: 'SN', name: 'Sénégal', region: 'Afrique' },
  { code: 'CI', name: "Côte d'Ivoire", region: 'Afrique' },
  { code: 'ML', name: 'Mali', region: 'Afrique' },
  { code: 'BJ', name: 'Bénin', region: 'Afrique' },
  { code: 'TG', name: 'Togo', region: 'Afrique' },
  { code: 'NE', name: 'Niger', region: 'Afrique' },
  { code: 'CM', name: 'Cameroun', region: 'Afrique' },
  { code: 'GN', name: 'Guinée', region: 'Afrique' },
  { code: 'GH', name: 'Ghana', region: 'Afrique' },
  { code: 'NG', name: 'Nigeria', region: 'Afrique' },
  { code: 'MA', name: 'Maroc', region: 'Afrique' },
  { code: 'TN', name: 'Tunisie', region: 'Afrique' },
  { code: 'DZ', name: 'Algérie', region: 'Afrique' },
  { code: 'ZA', name: 'Afrique du Sud', region: 'Afrique' },
  { code: 'KE', name: 'Kenya', region: 'Afrique' },
  { code: 'RW', name: 'Rwanda', region: 'Afrique' },
  { code: 'CD', name: 'RD Congo', region: 'Afrique' },
  { code: 'GA', name: 'Gabon', region: 'Afrique' },
  { code: 'FR', name: 'France', region: 'Europe' },
  { code: 'BE', name: 'Belgique', region: 'Europe' },
  { code: 'CH', name: 'Suisse', region: 'Europe' },
  { code: 'DE', name: 'Allemagne', region: 'Europe' },
  { code: 'GB', name: 'Royaume-Uni', region: 'Europe' },
  { code: 'ES', name: 'Espagne', region: 'Europe' },
  { code: 'IT', name: 'Italie', region: 'Europe' },
  { code: 'PT', name: 'Portugal', region: 'Europe' },
  { code: 'CA', name: 'Canada', region: 'Amériques' },
  { code: 'US', name: 'États-Unis', region: 'Amériques' },
  { code: 'AE', name: 'Émirats arabes unis', region: 'Moyen-Orient' },
];
