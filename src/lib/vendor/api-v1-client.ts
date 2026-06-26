/**
 * Client HTTP minimal — API REST vendeurs v1 (Epic 4.6 / E43).
 */

export type VendorApiV1Config = {
  baseUrl: string;
  apiKey: string;
};

export type VendorApiV1Error = {
  status: number;
  message: string;
  body?: unknown;
};

export class VendorApiV1Client {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: VendorApiV1Config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: { query?: Record<string, string | number | undefined>; body?: unknown }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text.slice(0, 200) };
    }

    if (!res.ok) {
      const message =
        typeof json === 'object' &&
        json &&
        'error' in json &&
        typeof (json as { error: unknown }).error === 'string'
          ? (json as { error: string }).error
          : res.statusText || 'Vendor API error';
      const err = new Error(message) as Error & { status: number; body?: unknown };
      err.status = res.status;
      err.body = json;
      throw err;
    }

    return json as T;
  }

  getMe() {
    return this.request<{
      api_version: string;
      store: unknown;
      permissions: Record<string, boolean>;
    }>('GET', '/me');
  }

  listProducts(params?: { page?: number; limit?: number }) {
    return this.request<{ data: unknown[]; pagination?: unknown }>('GET', '/products', {
      query: { page: params?.page, limit: params?.limit },
    });
  }

  listOrders(params?: { page?: number; limit?: number; status?: string }) {
    return this.request<{ data: unknown[]; pagination?: unknown }>('GET', '/orders', {
      query: { page: params?.page, limit: params?.limit, status: params?.status },
    });
  }

  getAnalytics(days = 30) {
    return this.request<Record<string, unknown>>('GET', '/analytics', { query: { days } });
  }
}

export function resolveVendorApiV1BaseUrl(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/api-v1`;
}
