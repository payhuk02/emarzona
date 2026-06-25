import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { handleCors } from '../_shared/cors.ts';

serve(async req => {
  // Gérer le CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = createSupabaseAdmin();

    // Vérification de l'utilisateur
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let payload: any = {};
    if (req.method === 'POST') {
      payload = await req.json();
    } else {
      const url = new URL(req.url);
      payload = Object.fromEntries(url.searchParams.entries());
    }

    const storeId = payload.store_id || null;
    const format = payload.format === 'csv' ? 'csv' : 'json';

    // Seul le RPC export_unified_audit_logs contient la logique métier (y compris la vérification de plan "physical_premium")
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'export_unified_audit_logs',
      {
        p_store_id: storeId,
        p_from: payload.from || null,
        p_to: payload.to || null,
        p_action_prefix: payload.action_prefix || null,
        p_log_source: payload.log_source || null,
        p_format: format,
        p_max_rows: payload.max_rows ? parseInt(payload.max_rows) : 10000,
      }
    );

    if (rpcError) {
      console.error('RPC Error:', rpcError);

      // Si l'erreur est liée au plan ou à l'accès
      if (rpcError.message === 'enterprise_plan_required' || rpcError.message === 'access_denied') {
        return new Response(
          JSON.stringify({ error: 'Enterprise plan required or access denied' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ error: 'Failed to generate audit export' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (format === 'csv' && rpcData?.rows) {
      // Transformation basique en CSV pour le téléchargement
      const rows = rpcData.rows;
      if (rows.length === 0) {
        return new Response('No data', {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        });
      }
      const headers = Object.keys(rows[0]).join(',');
      const csvContent = [
        headers,
        ...rows.map((row: any) =>
          Object.values(row)
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ].join('\n');

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit_export_${new Date().toISOString()}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(rpcData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
