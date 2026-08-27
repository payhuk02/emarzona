/**
 * Offline MoneyFusion withdraw_mode mapping (docs FR payout).
 * Live catalog in resolveWithdrawMode takes precedence when available.
 */

export function digitsOnlyPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

const PHONE_PREFIX_TO_COUNTRY: Array<{ prefix: string; minLen: number; code: string }> = [
  { prefix: '226', minLen: 11, code: 'bf' },
  { prefix: '225', minLen: 12, code: 'ci' },
  { prefix: '221', minLen: 12, code: 'sn' },
  { prefix: '223', minLen: 11, code: 'ml' },
  { prefix: '224', minLen: 11, code: 'gn' },
  { prefix: '245', minLen: 11, code: 'gw' },
  { prefix: '229', minLen: 11, code: 'bj' },
  { prefix: '228', minLen: 11, code: 'tg' },
  { prefix: '227', minLen: 11, code: 'ne' },
  { prefix: '237', minLen: 12, code: 'cm' },
  { prefix: '241', minLen: 11, code: 'ga' },
  { prefix: '242', minLen: 11, code: 'cg' },
  { prefix: '243', minLen: 12, code: 'cd' },
  { prefix: '233', minLen: 12, code: 'gh' },
  { prefix: '254', minLen: 12, code: 'ke' },
  { prefix: '256', minLen: 12, code: 'ug' },
  { prefix: '250', minLen: 12, code: 'rw' },
  { prefix: '232', minLen: 11, code: 'sl' },
  { prefix: '220', minLen: 10, code: 'gm' },
  { prefix: '236', minLen: 11, code: 'cf' },
  { prefix: '235', minLen: 11, code: 'td' },
  { prefix: '255', minLen: 12, code: 'tz' },
  { prefix: '222', minLen: 11, code: 'mr' },
];

/** National MSISDN for MF withdraw (strip known country codes). */
export function normalizeWithdrawPhone(phone: string): string {
  const digits = digitsOnlyPhone(phone);
  for (const row of PHONE_PREFIX_TO_COUNTRY) {
    if (digits.startsWith(row.prefix) && digits.length >= row.minLen) {
      return digits.slice(row.prefix.length);
    }
  }
  if (digits.startsWith('0') && digits.length >= 9) return digits.slice(1);
  return digits;
}

export function inferCountryCodeFromPhone(phone: string): string {
  const digits = digitsOnlyPhone(phone);
  for (const row of PHONE_PREFIX_TO_COUNTRY) {
    if (digits.startsWith(row.prefix) && digits.length >= row.minLen) return row.code;
  }
  return 'ci';
}

/** ISO / aliases → MoneyFusion countryCode (docs FR payout). */
export function normalizeMoneyFusionCountryCode(raw: string | null | undefined): string {
  const cc = String(raw || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[\s_]+/g, '-');
  const aliases: Record<string, string> = {
    gin: 'gn',
    guinea: 'gn',
    guinee: 'gn',
    'guinea-conakry': 'gn',
    'guinee-conakry': 'gn',
    'gn-conakry': 'gn',
    sen: 'sn',
    senegal: 'sn',
    bf: 'bf',
    burkina: 'bf',
    'burkina-faso': 'bf',
    benin: 'bj',
    togo: 'tg',
    mali: 'ml',
    niger: 'ne',
    cameroun: 'cm',
    cameroon: 'cm',
    rdc: 'cd',
    drc: 'cd',
    'congo-rdc': 'cd',
    'congo-kinshasa': 'cd',
    'congo-brazzaville': 'cg',
    gabon: 'ga',
    ghana: 'gh',
    kenya: 'ke',
    uganda: 'ug',
    ouganda: 'ug',
    rwanda: 'rw',
    tchad: 'td',
    chad: 'td',
    centrafrique: 'cf',
    'sierra-leone': 'sl',
    gambie: 'gm',
    gambia: 'gm',
    tanzanie: 'tz',
    tanzania: 'tz',
    mauritanie: 'mr',
    mauritania: 'mr',
  };
  return aliases[cc] || cc;
}

/** Operator family from seller form values (orange_money, mtn_mobile_money, …). */
export function operatorFamily(moyen: string | null | undefined): string | null {
  const raw = String(moyen || '')
    .toLowerCase()
    .replace(/_/g, '-')
    .trim();
  if (!raw) return null;
  if (raw.includes('orange')) return 'orange';
  if (raw.includes('mtn')) return 'mtn';
  if (raw.includes('moov')) return 'moov';
  if (raw.includes('wave')) return 'wave';
  if (raw.includes('free')) return 'free';
  if (raw.includes('t-money') || raw.includes('tmoney')) return 't-money';
  if (raw.includes('mpesa') || raw.includes('m-pesa')) return 'mpesa';
  if (raw.includes('airtel')) return 'airtel';
  if (raw.includes('amana')) return 'amana';
  if (raw.includes('zamani')) return 'zamani';
  if (raw.includes('nita')) return 'nita';
  if (raw.includes('crypto')) return 'crypto';
  return null;
}

/**
 * MoneyFusion withdraw_mode keys from live GET /withdraw/methods (Jul 2026).
 * Prefer live catalog in resolveWithdrawMode; this is offline fallback only.
 */
const MF_WITHDRAW_MODE_FALLBACK: Record<string, Partial<Record<string, string>>> = {
  ci: {
    orange: 'orange-money-ci',
    mtn: 'mtn-ci',
    moov: 'moov-ci',
    wave: 'wave-ci',
  },
  bf: {
    orange: 'orange-money-burkina',
    moov: 'moov-burkina-faso',
  },
  bj: {
    mtn: 'mtn-benin',
    moov: 'moov-benin',
  },
  tg: {
    't-money': 't-money-togo',
    moov: 'moov-togo',
  },
  sn: {
    orange: 'orange-money-senegal',
    wave: 'wave-senegal',
    free: 'free-money-senegal',
  },
  ml: {
    orange: 'orange-money-mali',
  },
  ne: {
    airtel: 'airtel-money-ne',
    mtn: 'mtn-ne',
    amana: 'amana-ne',
    zamani: 'zamanicash-ne',
    moov: 'moov-money-ne',
    nita: 'nita-ne',
  },
  cd: {
    mpesa: 'mpesa-cd',
    airtel: 'airtel-money-cd',
  },
  cg: {
    mtn: 'mtn-cg',
  },
  cm: {
    orange: 'orange-money-cm',
    mtn: 'mtn-cm',
  },
  ga: {
    airtel: 'airtel-money-ga',
    moov: 'moov-ga',
  },
  gn: {
    orange: 'orange-gn',
    mtn: 'mtn-gn',
  },
  gw: {
    mtn: 'mtn-gw',
  },
  gh: {
    airtel: 'airtel-money-gh',
    mtn: 'mtn-gh',
  },
  ke: {
    mpesa: 'm-pesa-ke',
  },
  tz: {
    mpesa: 'm-pesa-tz',
    airtel: 'airtel-money-tz',
  },
  sl: {
    orange: 'orange-sl',
  },
  gm: {
    orange: 'orange-gm',
  },
  cf: {
    orange: 'orange-cf',
  },
  ug: {
    mtn: 'mtn-ug',
  },
  rw: {
    mtn: 'mtn-rw',
  },
  td: {
    airtel: 'airtel-money-td',
    moov: 'moov-td',
  },
};

export function guessWithdrawMode(moyen: string | null | undefined, countryCode: string): string | null {
  const cc = normalizeMoneyFusionCountryCode(countryCode);
  const raw = String(moyen || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-');
  if (!raw) return null;

  // Seller form slugs (orange_money → orange-money) must go through the country map —
  // do not treat them as full MF withdraw_mode keys (mtn-ci, moov-togo, …).
  const sellerFormSlug =
    /^(orange-money|mtn-mobile-money|moov-money|wave|free-money|m-pesa|airtel-money|t-money|amana|zamani-cash|nita|ecocash|other)$/;

  // Full MF key already (orange-money-burkina, mtn-ci, …) — keep unless known-bad ISO suffix
  if (
    !sellerFormSlug.test(raw) &&
    /^(orange-money|mtn|moov|wave|free-money|t-money|airtel)(-[a-z0-9]+)+$/.test(raw)
  ) {
    const badIso = /-(bf|bj|tg|ml)$/.test(raw) && !/(burkina|benin|togo|mali)/.test(raw);
    if (!badIso) return raw;
  }

  const family = operatorFamily(raw);
  if (!family) return null;
  const mapped = MF_WITHDRAW_MODE_FALLBACK[cc]?.[family];
  if (mapped) return mapped;

  // CI-style fallback only when we have no explicit map entry
  if (cc === 'ci') {
    if (family === 'orange') return 'orange-money-ci';
    if (family === 'mtn') return 'mtn-ci';
    if (family === 'moov') return 'moov-ci';
    if (family === 'wave') return 'wave-ci';
  }
  return null;
}
