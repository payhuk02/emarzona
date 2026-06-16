/**
 * Client Redis unifié — Upstash REST (Edge/Vercel serverless compatible).
 */

import { upstashGet, upstashSetEx, upstashIncrWithTtl } from '@/lib/middleware/upstash-redis';

export interface RedisConfig {
  url: string;
  token: string;
}

export function getRedisConfig(): RedisConfig | null {
  const url =
    (typeof process !== 'undefined' && process.env?.UPSTASH_REDIS_REST_URL) ||
    (typeof process !== 'undefined' && process.env?.KV_REST_API_URL) ||
    '';
  const token =
    (typeof process !== 'undefined' && process.env?.UPSTASH_REDIS_REST_TOKEN) ||
    (typeof process !== 'undefined' && process.env?.KV_REST_API_TOKEN) ||
    '';
  if (!url || !token) return null;
  return { url, token };
}

async function upstashCommand<T>(
  config: RedisConfig,
  command: (string | number)[]
): Promise<T | null> {
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: T; error?: string };
  if (data.error) return null;
  return data.result ?? null;
}

export async function redisGet(key: string, config?: RedisConfig | null): Promise<string | null> {
  const cfg = config ?? getRedisConfig();
  if (!cfg) return null;
  return upstashGet(cfg.url, cfg.token, key);
}

export async function redisSetEx(
  key: string,
  value: string,
  ttlSeconds: number,
  config?: RedisConfig | null
): Promise<boolean> {
  const cfg = config ?? getRedisConfig();
  if (!cfg) return false;
  await upstashSetEx(cfg.url, cfg.token, key, value, ttlSeconds);
  return true;
}

export async function redisDel(key: string, config?: RedisConfig | null): Promise<boolean> {
  const cfg = config ?? getRedisConfig();
  if (!cfg) return false;
  const result = await upstashCommand<number>(cfg, ['DEL', key]);
  return (result ?? 0) > 0;
}

export async function redisKeys(pattern: string, config?: RedisConfig | null): Promise<string[]> {
  const cfg = config ?? getRedisConfig();
  if (!cfg) return [];
  const result = await upstashCommand<string[]>(cfg, ['KEYS', pattern]);
  return result ?? [];
}

export async function redisIncrWithTtl(
  key: string,
  ttlSeconds: number,
  config?: RedisConfig | null
): Promise<number> {
  const cfg = config ?? getRedisConfig();
  if (!cfg) return 0;
  return upstashIncrWithTtl(cfg.url, cfg.token, key, ttlSeconds);
}

export async function redisPing(config?: RedisConfig | null): Promise<boolean> {
  const cfg = config ?? getRedisConfig();
  if (!cfg) return false;
  const result = await upstashCommand<string>(cfg, ['PING']);
  return result === 'PONG';
}

export async function redisPipeline(
  commands: (string | number)[][],
  config?: RedisConfig | null
): Promise<unknown[]> {
  const cfg = config ?? getRedisConfig();
  if (!cfg) return [];

  const res = await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });

  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ result?: unknown }>;
  return data.map(d => d.result);
}
