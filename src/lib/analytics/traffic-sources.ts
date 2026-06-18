export type TrafficSourceCategory =
  | 'organic_search'
  | 'social'
  | 'direct'
  | 'referral'
  | 'email'
  | 'paid'
  | 'other';

export interface TrafficSourceSlice {
  name: string;
  value: number;
  color: string;
}

export const TRAFFIC_SOURCE_LABELS: Record<TrafficSourceCategory, string> = {
  organic_search: 'Recherche organique',
  social: 'Réseaux sociaux',
  direct: 'Direct',
  referral: 'Référencement',
  email: 'Email',
  paid: 'Publicité',
  other: 'Autre',
};

export const TRAFFIC_SOURCE_COLORS: Record<TrafficSourceCategory, string> = {
  organic_search: '#3b82f6',
  social: '#10b981',
  direct: '#8b5cf6',
  referral: '#f59e0b',
  email: '#ec4899',
  paid: '#ef4444',
  other: '#6b7280',
};

const SOCIAL_HOSTS = [
  'facebook.',
  'instagram.',
  'twitter.',
  'x.com',
  't.co',
  'linkedin.',
  'tiktok.',
  'youtube.',
  'pinterest.',
];

const SEARCH_HOSTS = ['google.', 'bing.', 'yahoo.', 'duckduckgo.', 'ecosia.'];

const SOCIAL_UTM_SOURCES = [
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'linkedin',
  'youtube',
  'pinterest',
];

export function classifyTrafficSource(input: {
  utm_source?: string | null;
  utm_medium?: string | null;
  referrer?: string | null;
}): TrafficSourceCategory {
  const utmSource = (input.utm_source ?? '').trim().toLowerCase();
  const utmMedium = (input.utm_medium ?? '').trim().toLowerCase();
  const referrer = (input.referrer ?? '').trim().toLowerCase();

  if (utmMedium === 'email' || utmSource === 'email' || utmSource === 'newsletter') {
    return 'email';
  }

  if (
    ['cpc', 'ppc', 'paid', 'paidsearch', 'display', 'ads'].includes(utmMedium) ||
    utmSource === 'adwords' ||
    utmSource === 'google_ads'
  ) {
    return 'paid';
  }

  if (utmMedium === 'social' || SOCIAL_UTM_SOURCES.some(source => utmSource.includes(source))) {
    return 'social';
  }

  if (utmMedium === 'organic' || utmSource === 'google' || utmSource === 'bing') {
    return 'organic_search';
  }

  if (!referrer) {
    return 'direct';
  }

  if (SEARCH_HOSTS.some(host => referrer.includes(host))) {
    return 'organic_search';
  }

  if (SOCIAL_HOSTS.some(host => referrer.includes(host))) {
    return 'social';
  }

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (!host) return 'direct';
    if (SEARCH_HOSTS.some(searchHost => host.includes(searchHost.replace('.', '')))) {
      return 'organic_search';
    }
    if (SOCIAL_HOSTS.some(socialHost => host.includes(socialHost.replace('.', '')))) {
      return 'social';
    }
    return 'referral';
  } catch {
    return referrer ? 'referral' : 'direct';
  }
}

export function aggregateTrafficSources(
  sessions: Array<{
    utm_source?: string | null;
    utm_medium?: string | null;
    referrer?: string | null;
  }>
): TrafficSourceSlice[] {
  const counts: Record<TrafficSourceCategory, number> = {
    organic_search: 0,
    social: 0,
    direct: 0,
    referral: 0,
    email: 0,
    paid: 0,
    other: 0,
  };

  sessions.forEach(session => {
    counts[classifyTrafficSource(session)] += 1;
  });

  const total = sessions.length;
  if (total === 0) {
    return [];
  }

  return (Object.keys(counts) as TrafficSourceCategory[])
    .filter(category => counts[category] > 0)
    .map(category => ({
      name: TRAFFIC_SOURCE_LABELS[category],
      value: Math.round((counts[category] / total) * 100),
      color: TRAFFIC_SOURCE_COLORS[category],
    }))
    .sort((a, b) => b.value - a.value);
}
