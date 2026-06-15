/**
 * API Publique Emarzona v1 — Epic 4.6
 * Deployed as edge function `api-v1` → /functions/v1/api-v1/*
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.25.76';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  return allowedOrigins.includes(originHeader) ? originHeader : defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}

/** Strip Supabase function prefix (api-v1 or legacy api/v1). */
function stripApiPrefix(pathname: string): string {
  return (
    pathname
      .replace(/^\/functions\/v1\/api-v1/, '')
      .replace(/^\/functions\/v1\/api\/v1/, '')
      .replace(/^\/api-v1/, '')
      .replace(/^\/api\/v1/, '') || '/'
  );
}

function json(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type ApiKeyInfo = {
  key_id: string;
  user_id: string;
  store_id: string;
  permissions: unknown;
};

const genericBodySchema = z.record(z.any());
const productBodySchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(10000).optional(),
    sku: z.string().max(120).optional(),
    status: z.string().max(50).optional(),
    price: z.union([z.number(), z.string()]).optional(),
    compare_price: z.union([z.number(), z.string()]).optional(),
    quantity: z.union([z.number().int(), z.string()]).optional(),
    currency: z.string().max(10).optional(),
  })
  .catchall(z.any());

const orderBodySchema = z
  .object({
    customer_id: z.string().uuid().optional(),
    customer_email: z.string().email().optional(),
    status: z.string().max(50).optional(),
    payment_status: z.string().max(50).optional(),
    total_amount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().max(10).optional(),
    notes: z.string().max(5000).optional(),
  })
  .catchall(z.any());

const customerBodySchema = z
  .object({
    email: z.string().email().optional(),
    name: z.string().max(255).optional(),
    full_name: z.string().max(255).optional(),
    phone: z.string().max(50).optional(),
  })
  .catchall(z.any());

const forbiddenFields = new Set([
  'id',
  'store_id',
  'user_id',
  'created_at',
  'updated_at',
  'deleted_at',
]);

const PRODUCT_PUBLIC_FIELDS =
  'id,store_id,name,description,sku,status,price,compare_price,quantity,currency,created_at,updated_at';
const CUSTOMER_PUBLIC_FIELDS = 'id,store_id,email,name,full_name,phone,created_at,updated_at';

function sanitizeWritePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (forbiddenFields.has(key)) continue;
    sanitized[key] = value;
  }
  return sanitized;
}

async function parseAndSanitizeBody(
  req: Request,
  schema: z.ZodSchema<Record<string, unknown>> = genericBodySchema
): Promise<Record<string, unknown>> {
  const jsonBody = await req.json();
  const parsed = schema.parse(jsonBody);
  const sanitized = sanitizeWritePayload(parsed);
  if (Object.keys(sanitized).length === 0) {
    throw new Error('Empty or invalid payload');
  }
  return sanitized;
}

function parsePaginationParam(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function hasPermission(apiKeyInfo: ApiKeyInfo, permission: string): boolean {
  const rawPermissions = apiKeyInfo?.permissions;
  if (!rawPermissions) return false;
  if (rawPermissions === '*') return true;
  if (Array.isArray(rawPermissions)) {
    return rawPermissions.includes('*') || rawPermissions.includes(permission);
  }
  if (typeof rawPermissions === 'object' && rawPermissions !== null) {
    const perms = rawPermissions as Record<string, boolean>;
    if (perms['*'] === true) return true;
    return perms[permission] === true;
  }
  return false;
}

function ensurePermission(
  apiKeyInfo: ApiKeyInfo,
  permission: string,
  corsHeaders: Record<string, string>
): Response | null {
  if (!hasPermission(apiKeyInfo, permission)) {
    return json(
      { error: 'Forbidden', message: `Missing permission: ${permission}` },
      403,
      corsHeaders
    );
  }
  return null;
}

async function logRequest(
  supabase: ReturnType<typeof createClient>,
  info: ApiKeyInfo,
  method: string,
  path: string,
  status: number,
  started: number,
  req: Request
): Promise<void> {
  try {
    await supabase.rpc('log_api_request', {
      p_store_id: info.store_id,
      p_api_key_id: info.key_id,
      p_method: method,
      p_path: path,
      p_status_code: status,
      p_duration_ms: Date.now() - started,
      p_ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip'),
      p_user_agent: req.headers.get('user-agent'),
    });
  } catch {
    // best-effort
  }
}

serve(async req => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));
  const started = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = stripApiPrefix(url.pathname);
  const method = req.method;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json(
        { error: 'Unauthorized', message: 'Missing or invalid API key' },
        401,
        corsHeaders
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin.rpc('verify_api_key', {
      p_key: apiKey,
    });

    if (apiKeyError || !apiKeyData || apiKeyData.length === 0) {
      return json(
        { error: 'Unauthorized', message: 'Invalid or inactive API key' },
        401,
        corsHeaders
      );
    }

    const row = apiKeyData[0];
    const apiKeyInfo: ApiKeyInfo = {
      key_id: row.key_id ?? row.id,
      user_id: row.user_id,
      store_id: row.store_id,
      permissions: row.permissions,
    };

    const { data: rateOk, error: rateError } = await supabaseAdmin.rpc('check_api_rate_limit', {
      p_store_id: apiKeyInfo.store_id,
      p_api_key_id: apiKeyInfo.key_id,
    });

    if (rateError || rateOk === false) {
      const limitResp = json(
        {
          error: 'Too Many Requests',
          message: 'API rate limit exceeded for your plan (requests per minute)',
        },
        429,
        corsHeaders
      );
      await logRequest(supabaseAdmin, apiKeyInfo, method, path, 429, started, req);
      return limitResp;
    }

    let response: Response;

    if (path === '/me' || path === '/') {
      response = await handleMe(apiKeyInfo, supabaseAdmin, corsHeaders);
    } else if (path.startsWith('/products')) {
      response = await handleProducts(req, method, apiKeyInfo, supabaseAdmin, corsHeaders, path);
    } else if (path.startsWith('/orders')) {
      response = await handleOrders(req, method, apiKeyInfo, supabaseAdmin, corsHeaders, path);
    } else if (path.startsWith('/customers')) {
      response = await handleCustomers(req, method, apiKeyInfo, supabaseAdmin, corsHeaders, path);
    } else if (path.startsWith('/analytics')) {
      response = await handleAnalytics(req, method, apiKeyInfo, supabaseAdmin, corsHeaders);
    } else if (path.startsWith('/export')) {
      response = await handleExport(req, method, apiKeyInfo, supabaseAdmin, corsHeaders);
    } else if (path.startsWith('/webhooks')) {
      response = await handleWebhooks(req, method, apiKeyInfo, supabaseAdmin, corsHeaders, path);
    } else {
      response = json({ error: 'Not Found', message: 'Endpoint not found' }, 404, corsHeaders);
    }

    await logRequest(supabaseAdmin, apiKeyInfo, method, path, response.status, started, req);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return json({ error: 'Internal Server Error', message }, 500, corsHeaders);
  }
});

async function handleMe(
  apiKeyInfo: ApiKeyInfo,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { data: store } = await supabase
    .from('stores')
    .select('id,name,slug,currency')
    .eq('id', apiKeyInfo.store_id)
    .single();

  return json(
    {
      api_version: 'v1',
      store,
      permissions: apiKeyInfo.permissions,
      endpoints: ['/products', '/orders', '/customers', '/analytics', '/export', '/webhooks'],
    },
    200,
    corsHeaders
  );
}

async function handleProducts(
  req: Request,
  method: string,
  apiKeyInfo: ApiKeyInfo,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>,
  routePath: string
): Promise<Response> {
  const url = new URL(req.url);
  const productId = routePath.replace('/products', '').replace(/^\//, '');

  if (method === 'GET') {
    if (!hasPermission(apiKeyInfo, 'products:read')) {
      return json(
        { error: 'Forbidden', message: 'Missing permission: products:read' },
        403,
        corsHeaders
      );
    }
    if (productId) {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_PUBLIC_FIELDS)
        .eq('id', productId)
        .eq('store_id', apiKeyInfo.store_id)
        .single();
      if (error) return json({ error: error.message }, 400, corsHeaders);
      return json(data, 200, corsHeaders);
    }

    const page = parsePaginationParam(url.searchParams.get('page'), 1, 1000);
    const limit = parsePaginationParam(url.searchParams.get('limit'), 20, 100);
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('products')
      .select(PRODUCT_PUBLIC_FIELDS, { count: 'exact' })
      .eq('store_id', apiKeyInfo.store_id)
      .range(offset, offset + limit - 1);
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json(
      {
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
      200,
      corsHeaders
    );
  }

  if (method === 'POST') {
    const denied = ensurePermission(apiKeyInfo, 'products:write', corsHeaders);
    if (denied) return denied;
    const body = await parseAndSanitizeBody(req, productBodySchema);
    const { data, error } = await supabase
      .from('products')
      .insert({ ...body, store_id: apiKeyInfo.store_id })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json(data, 201, corsHeaders);
  }

  if (method === 'PUT' && productId) {
    const denied = ensurePermission(apiKeyInfo, 'products:write', corsHeaders);
    if (denied) return denied;
    const body = await parseAndSanitizeBody(req, productBodySchema);
    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', productId)
      .eq('store_id', apiKeyInfo.store_id)
      .select()
      .single();
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json(data, 200, corsHeaders);
  }

  if (method === 'DELETE' && productId) {
    const denied = ensurePermission(apiKeyInfo, 'products:delete', corsHeaders);
    if (denied) return denied;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('store_id', apiKeyInfo.store_id);
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json({ success: true }, 200, corsHeaders);
  }

  return json({ error: 'Method not allowed' }, 405, corsHeaders);
}

async function handleOrders(
  req: Request,
  method: string,
  apiKeyInfo: ApiKeyInfo,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>,
  routePath: string
): Promise<Response> {
  const url = new URL(req.url);
  const orderId = routePath.replace('/orders', '').replace(/^\//, '');

  if (method === 'GET') {
    if (!hasPermission(apiKeyInfo, 'orders:read')) {
      return json(
        { error: 'Forbidden', message: 'Missing permission: orders:read' },
        403,
        corsHeaders
      );
    }
    if (orderId) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), customers(*)')
        .eq('id', orderId)
        .eq('store_id', apiKeyInfo.store_id)
        .single();
      if (error) return json({ error: error.message }, 400, corsHeaders);
      return json(data, 200, corsHeaders);
    }

    const page = parsePaginationParam(url.searchParams.get('page'), 1, 1000);
    const limit = parsePaginationParam(url.searchParams.get('limit'), 20, 100);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status');
    let query = supabase
      .from('orders')
      .select('id,order_number,status,payment_status,total_amount,currency,created_at', {
        count: 'exact',
      })
      .eq('store_id', apiKeyInfo.store_id)
      .range(offset, offset + limit - 1);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json(
      {
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
      200,
      corsHeaders
    );
  }

  if (method === 'POST') {
    const denied = ensurePermission(apiKeyInfo, 'orders:write', corsHeaders);
    if (denied) return denied;
    const body = await parseAndSanitizeBody(req, orderBodySchema);
    const { data, error } = await supabase
      .from('orders')
      .insert({ ...body, store_id: apiKeyInfo.store_id })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json(data, 201, corsHeaders);
  }

  return json({ error: 'Method not allowed' }, 405, corsHeaders);
}

async function handleCustomers(
  req: Request,
  method: string,
  apiKeyInfo: ApiKeyInfo,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>,
  routePath: string
): Promise<Response> {
  const url = new URL(req.url);
  const customerId = routePath.replace('/customers', '').replace(/^\//, '');

  if (method === 'GET') {
    if (!hasPermission(apiKeyInfo, 'customers:read')) {
      return json(
        { error: 'Forbidden', message: 'Missing permission: customers:read' },
        403,
        corsHeaders
      );
    }
    if (customerId) {
      const { data, error } = await supabase
        .from('customers')
        .select(CUSTOMER_PUBLIC_FIELDS)
        .eq('id', customerId)
        .eq('store_id', apiKeyInfo.store_id)
        .single();
      if (error) return json({ error: error.message }, 400, corsHeaders);
      return json(data, 200, corsHeaders);
    }

    const page = parsePaginationParam(url.searchParams.get('page'), 1, 1000);
    const limit = parsePaginationParam(url.searchParams.get('limit'), 20, 100);
    const offset = (page - 1) * limit;
    const { data, error, count } = await supabase
      .from('customers')
      .select(CUSTOMER_PUBLIC_FIELDS, { count: 'exact' })
      .eq('store_id', apiKeyInfo.store_id)
      .range(offset, offset + limit - 1);
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json(
      {
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
      200,
      corsHeaders
    );
  }

  if (method === 'POST') {
    const denied = ensurePermission(apiKeyInfo, 'customers:write', corsHeaders);
    if (denied) return denied;
    const body = await parseAndSanitizeBody(req, customerBodySchema);
    const { data, error } = await supabase
      .from('customers')
      .insert({ ...body, store_id: apiKeyInfo.store_id })
      .select()
      .single();
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json(data, 201, corsHeaders);
  }

  return json({ error: 'Method not allowed' }, 405, corsHeaders);
}

async function handleAnalytics(
  req: Request,
  method: string,
  apiKeyInfo: ApiKeyInfo,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }
  if (!hasPermission(apiKeyInfo, 'analytics:read')) {
    return json(
      { error: 'Forbidden', message: 'Missing permission: analytics:read' },
      403,
      corsHeaders
    );
  }

  const url = new URL(req.url);
  const days = parsePaginationParam(url.searchParams.get('days'), 30, 365);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [ordersRes, productsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('total_amount, status, payment_status, created_at')
      .eq('store_id', apiKeyInfo.store_id)
      .gte('created_at', since),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', apiKeyInfo.store_id),
  ]);

  const orders = ordersRes.data || [];
  const revenue = orders
    .filter(o => o.payment_status === 'paid' || o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  return json(
    {
      period_days: days,
      orders_count: orders.length,
      revenue,
      products_count: productsRes.count || 0,
      generated_at: new Date().toISOString(),
    },
    200,
    corsHeaders
  );
}

async function handleExport(
  req: Request,
  method: string,
  apiKeyInfo: ApiKeyInfo,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405, corsHeaders);
  }
  if (!hasPermission(apiKeyInfo, 'export:read')) {
    return json(
      { error: 'Forbidden', message: 'Missing permission: export:read' },
      403,
      corsHeaders
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'products';
  const limit = parsePaginationParam(url.searchParams.get('limit'), 500, 2000);

  if (type === 'orders') {
    const { data, error } = await supabase
      .from('orders')
      .select('id,order_number,status,payment_status,total_amount,currency,created_at')
      .eq('store_id', apiKeyInfo.store_id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json({ type, count: data?.length || 0, data }, 200, corsHeaders);
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_PUBLIC_FIELDS)
    .eq('store_id', apiKeyInfo.store_id)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return json({ error: error.message }, 400, corsHeaders);
  return json({ type: 'products', count: data?.length || 0, data }, 200, corsHeaders);
}

const WEBHOOK_PUBLIC_FIELDS =
  'id,name,description,url,events,status,is_active,last_triggered_at,created_at,updated_at';

async function handleWebhooks(
  req: Request,
  method: string,
  apiKeyInfo: ApiKeyInfo,
  supabase: ReturnType<typeof createClient>,
  corsHeaders: Record<string, string>,
  routePath: string
): Promise<Response> {
  const webhookId = routePath.replace('/webhooks', '').replace(/^\//, '');

  if (method === 'GET') {
    if (!hasPermission(apiKeyInfo, 'webhooks:read')) {
      return json(
        { error: 'Forbidden', message: 'Missing permission: webhooks:read' },
        403,
        corsHeaders
      );
    }
    if (webhookId) {
      const { data, error } = await supabase
        .from('webhooks')
        .select(WEBHOOK_PUBLIC_FIELDS)
        .eq('id', webhookId)
        .eq('store_id', apiKeyInfo.store_id)
        .single();
      if (error) return json({ error: error.message }, 400, corsHeaders);
      return json(data, 200, corsHeaders);
    }
    const { data, error } = await supabase
      .from('webhooks')
      .select(WEBHOOK_PUBLIC_FIELDS)
      .eq('store_id', apiKeyInfo.store_id)
      .order('created_at', { ascending: false });
    if (error) return json({ error: error.message }, 400, corsHeaders);
    return json({ data: data ?? [] }, 200, corsHeaders);
  }

  if (method === 'POST' && !webhookId) {
    const denied = ensurePermission(apiKeyInfo, 'webhooks:write', corsHeaders);
    if (denied) return denied;
    const body = await req.json();
    const name = String(body.name || '').trim();
    const url = String(body.url || '').trim();
    const events = Array.isArray(body.events) ? body.events.map(String) : [];
    if (!name || !url || events.length === 0) {
      return json({ error: 'name, url and events[] required' }, 400, corsHeaders);
    }
    const { data: secret, error: secretError } = await supabase.rpc('generate_webhook_secret');
    if (secretError) return json({ error: secretError.message }, 400, corsHeaders);
    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        store_id: apiKeyInfo.store_id,
        name,
        description: body.description ?? null,
        url,
        secret,
        events,
        status: 'active',
        created_by: apiKeyInfo.user_id,
      })
      .select(WEBHOOK_PUBLIC_FIELDS)
      .single();
    if (error) return json({ error: error.message }, 400, corsHeaders);
    await supabase.rpc('log_store_audit_event', {
      p_store_id: apiKeyInfo.store_id,
      p_action: 'webhook.create',
      p_target_type: 'webhook',
      p_target_id: data.id,
      p_metadata: { name, url },
      p_source: 'api',
    });
    return json({ ...data, secret }, 201, corsHeaders);
  }

  if (method === 'DELETE' && webhookId) {
    const denied = ensurePermission(apiKeyInfo, 'webhooks:write', corsHeaders);
    if (denied) return denied;
    const { error } = await supabase
      .from('webhooks')
      .update({ status: 'inactive', is_active: false })
      .eq('id', webhookId)
      .eq('store_id', apiKeyInfo.store_id);
    if (error) return json({ error: error.message }, 400, corsHeaders);
    await supabase.rpc('log_store_audit_event', {
      p_store_id: apiKeyInfo.store_id,
      p_action: 'webhook.revoke',
      p_target_type: 'webhook',
      p_target_id: webhookId,
      p_source: 'api',
    });
    return json({ success: true }, 200, corsHeaders);
  }

  return json({ error: 'Method not allowed' }, 405, corsHeaders);
}
