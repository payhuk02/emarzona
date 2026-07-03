import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import { handleCors } from '../_shared/cors.ts';

serve(async req => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
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

    const userId = user.id;

    // Fetch user data
    const [profileRes, storesRes, ordersRes] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
      supabaseAdmin.from('stores').select('*').eq('user_id', userId),
      supabaseAdmin.from('orders').select('*').eq('customer_id', userId),
    ]);

    const exportData = {
      generated_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profileRes.data || null,
      stores: storesRes.data || [],
      orders: ordersRes.data || [],
    };

    const payload = await req.json();
    const format = payload.format === 'csv' ? 'csv' : 'json';

    if (format === 'csv') {
      const csvContent = `id,email,created_at\n${user.id},${user.email},${user.created_at}`;
      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="gdpr_export_${new Date().toISOString()}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr_export_${new Date().toISOString()}.json"`
      },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
