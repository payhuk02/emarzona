import { COUNTRIES } from '@/lib/countries';
import { getCountryFlagUrl, isCountryFlagAvailable } from '@/lib/landing/country-flag';
import { ISO_DIAL_CODES, PRIORITY_ISO } from '@/lib/phone/iso-dial-codes';

export type DialCountry = {
  iso: string;
  dial: string;
  name: string;
  aliases: string[];
};

const PRIORITY_RANK = new Map(PRIORITY_ISO.map((code, index) => [code.toLowerCase(), index]));

export const CHECKOUT_DIAL_COUNTRIES: DialCountry[] = COUNTRIES.map(country => {
  const iso = country.code.toLowerCase();
  const dial = ISO_DIAL_CODES[country.code] || '';
  return {
    iso,
    dial,
    name: country.name,
    aliases: [country.name, country.code, iso, dial ? `+${dial}` : ''],
  };
})
  .filter(country => country.dial)
  .sort((a, b) => {
    const ra = PRIORITY_RANK.get(a.iso) ?? Number.MAX_SAFE_INTEGER;
    const rb = PRIORITY_RANK.get(b.iso) ?? Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, 'fr');
  });

export const DEFAULT_DIAL_COUNTRY =
  CHECKOUT_DIAL_COUNTRIES.find(c => c.iso === 'bf') || CHECKOUT_DIAL_COUNTRIES[0];

const TIMEZONE_ISO: Record<string, string> = {
  'Africa/Ouagadougou': 'bf',
  'Africa/Abidjan': 'ci',
  'Africa/Dakar': 'sn',
  'Africa/Bamako': 'ml',
  'Africa/Porto-Novo': 'bj',
  'Africa/Lome': 'tg',
  'Africa/Niamey': 'ne',
  'Africa/Accra': 'gh',
  'Africa/Lagos': 'ng',
  'Africa/Douala': 'cm',
  'Africa/Conakry': 'gn',
  'Africa/Libreville': 'ga',
  'Africa/Kinshasa': 'cd',
  'Africa/Brazzaville': 'cg',
  'Africa/Nairobi': 'ke',
  'Africa/Dar_es_Salaam': 'tz',
  'Africa/Kampala': 'ug',
  'Africa/Kigali': 'rw',
  'Africa/Casablanca': 'ma',
  'Africa/Tunis': 'tn',
  'Africa/Algiers': 'dz',
  'Europe/Paris': 'fr',
  'Europe/Brussels': 'be',
  'America/New_York': 'us',
  'America/Toronto': 'ca',
};

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isoToFlagEmoji(iso: string): string {
  const code = iso.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(...[...code].map(char => 127397 + char.charCodeAt(0)));
}

export function findDialCountry(input?: string | null): DialCountry {
  const raw = (input || '').trim();
  if (!raw) return DEFAULT_DIAL_COUNTRY;

  const iso = raw.toLowerCase();
  const byIso = CHECKOUT_DIAL_COUNTRIES.find(c => c.iso === iso);
  if (byIso) return byIso;

  const digits = raw.replace(/\D/g, '');
  if (digits) {
    const exact = CHECKOUT_DIAL_COUNTRIES.filter(c => c.dial === digits);
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) {
      return exact.find(c => PRIORITY_RANK.has(c.iso)) || exact[0];
    }
  }

  const name = normalizeName(raw);
  const byName = CHECKOUT_DIAL_COUNTRIES.find(
    c => normalizeName(c.name) === name || c.aliases.some(alias => normalizeName(alias) === name)
  );
  return byName || DEFAULT_DIAL_COUNTRY;
}

export function countryFromTimezone(timeZone?: string | null): DialCountry {
  if (!timeZone) return DEFAULT_DIAL_COUNTRY;
  const iso = TIMEZONE_ISO[timeZone];
  return iso ? findDialCountry(iso) : DEFAULT_DIAL_COUNTRY;
}

export function flagUrlForIso(iso: string): string | null {
  const code = iso.toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return null;
  if (isCountryFlagAvailable(code)) return getCountryFlagUrl(code);
  return `https://flagcdn.com/${code}.svg`;
}

export function combineLocalPhone(dial: string, localNumber: string): string {
  const localDigits = localNumber.replace(/\D/g, '').replace(/^0+/, '');
  if (!localDigits) return '';
  return `+${dial.replace(/\D/g, '')}${localDigits}`;
}

export function splitPhoneInput(
  phone: string,
  countryHint?: string | null
): { country: DialCountry; localNumber: string } {
  const fallback = findDialCountry(countryHint);
  const looksInternational = /^\s*(\+|00)/.test(phone);
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (!digits) {
    return { country: fallback, localNumber: '' };
  }
  if (!looksInternational) {
    return { country: fallback, localNumber: digits.replace(/^0+/, '') };
  }

  const sorted = [...CHECKOUT_DIAL_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const match = sorted.find(c => digits.startsWith(c.dial) && digits.length > c.dial.length);
  if (match) {
    const sameDial = sorted.filter(c => c.dial === match.dial);
    const preferred =
      sameDial.find(c => c.iso === fallback.iso) ||
      sameDial.find(c => PRIORITY_RANK.has(c.iso)) ||
      match;
    return { country: preferred, localNumber: digits.slice(preferred.dial.length) };
  }

  return { country: fallback, localNumber: digits.replace(/^0+/, '') };
}
