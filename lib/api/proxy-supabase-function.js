/**
 * Proxy serveur vers une Edge Function Supabase (auth service role côté Vercel).
 * Permet à Google/Bing d'accéder aux sitemaps sans JWT côté client.
 */
export async function proxySupabaseFunction(functionName, query = '') {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const qs = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}${qs}`;

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
    },
  });
}
