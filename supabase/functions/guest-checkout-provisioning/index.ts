import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const defaultAllowedOrigin = Deno.env.get('SITE_URL') || 'https://www.emarzona.com';
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || defaultAllowedOrigin)
  .split(',')
  .map((origin: string) => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(originHeader: string | null): string {
  if (!originHeader) return defaultAllowedOrigin;
  if (allowedOrigins.includes(originHeader) || originHeader.startsWith('http://localhost:')) {
    return originHeader;
  }
  return defaultAllowedOrigin;
}

function buildCorsHeaders(originHeader: string | null) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(originHeader),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing valid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      email,
      customerName,
      digitalProductId,
      licenseType = 'single',
      maxActivations = 1,
      licenseExpiryDays = null,
    } = await req.json();

    if (!email || !digitalProductId) {
      return new Response(JSON.stringify({ error: "L'email et le produit digital sont requis" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ⚠️ On utilise la Service Role Key pour contourner le RLS
    // Car l'utilisateur n'est pas encore connecté/créé
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let userId = '';

    // 1. Auto-provisioning : Création du compte utilisateur silencieuse
    const randomPassword = crypto.randomUUID();
    const { data: userResponse, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: randomPassword,
        email_confirm: true, // On confirme l'email pour éviter l'envoi de l'email de signup par défaut
        user_metadata: { full_name: customerName || email.split('@')[0] },
      });

    if (createUserError) {
      const errorMsg = createUserError.message || '';
      const isAlreadyExists = errorMsg.toLowerCase().includes('already') || 
                              errorMsg.toLowerCase().includes('exists') ||
                              errorMsg.toLowerCase().includes('registered');
                              
      if (isAlreadyExists) {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        });
        
        let foundUserId: string | null = null;
        if (!linkError && linkData?.user?.id) {
          foundUserId = linkData.user.id;
        }
        
        if (!foundUserId) {
           return new Response(
            JSON.stringify({
              success: false,
              error: "L'utilisateur semble exister mais n'a pas pu être trouvé."
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        userId = foundUserId;
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Impossible de créer le compte invité : " + errorMsg
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      if (!userResponse.user?.id) {
        throw new Error("Impossible de créer l'utilisateur invité.");
      }
      userId = userResponse.user.id;
    }

    // 2. Génération de la clé de licence
    const { data: licenseKey, error: keyError } = await supabaseAdmin.rpc('generate_license_key');

    if (keyError || !licenseKey) {
      console.error('Erreur génération licence:', keyError);
      throw new Error('Erreur lors de la génération de la clé de licence');
    }

    // 3. Création de la licence (pending)
    const expiresAt = licenseExpiryDays
      ? new Date(Date.now() + licenseExpiryDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: license, error: licenseError } = await supabaseAdmin
      .from('digital_licenses')
      .insert({
        digital_product_id: digitalProductId,
        user_id: userId,
        license_key: licenseKey,
        license_type: licenseType,
        max_activations: licenseType === 'unlimited' ? -1 : maxActivations,
        current_activations: 0,
        expires_at: expiresAt,
        status: 'pending', // Deviendra 'active' lors du paiement
        customer_email: email,
        customer_name: customerName || email.split('@')[0],
      })
      .select('id')
      .single();

    if (licenseError || !license) {
      console.error('License creation error:', licenseError);
      throw new Error("Erreur lors de l'attribution de la licence");
    }

    // 4. Succès: On retourne l'ID de la licence et l'ID de l'utilisateur généré
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        license_id: license.id,
        is_new_user: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Guest checkout provisioning error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
