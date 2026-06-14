/**
 * Epic 4.1 — Client Upstash Redis REST (compatible Edge / middleware Vercel)
 */

type RedisCommand = string | number;

async function upstashCommand<T>(
  restUrl: string,
  token: string,
  command: RedisCommand[]
): Promise<T | null> {
  const res = await fetch(restUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { result?: T; error?: string };
  if (data.error) return null;
  return data.result ?? null;
}

export async function upstashGet(
  restUrl: string,
  token: string,
  key: string
): Promise<string | null> {
  const result = await upstashCommand<string>(restUrl, token, ['GET', key]);
  return typeof result === 'string' ? result : null;
}

export async function upstashSetEx(
  restUrl: string,
  token: string,
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  await upstashCommand(restUrl, token, ['SET', key, value, 'EX', ttlSeconds]);
}

/** INCR + EXPIRE atomique via pipeline Upstash. */
export async function upstashIncrWithTtl(
  restUrl: string,
  token: string,
  key: string,
  ttlSeconds: number
): Promise<number> {
  const res = await fetch(`${restUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, ttlSeconds],
    ]),
  });

  if (!res.ok) return 0;

  const data = (await res.json()) as Array<{ result?: number }>;
  const count = data?.[0]?.result;
  return typeof count === 'number' ? count : 0;
}
