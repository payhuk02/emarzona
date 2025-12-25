/// <reference path="../deno.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateCreateCheckout, validateRefundPayment, validatePaymentId } from "./validation.ts";

// Fonction pour déterminer l'origine autorisée pour CORS
function getCorsOrigin(req: Request): string {
  const origin = req.headers.get('origin');
  const siteUrl = Deno.env.get('SITE_URL') || 'https://payhula.vercel.app';
  
  // Autoriser localhost pour le développement
  if (origin && (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1')
  )) {
    return origin; // Autoriser l'origine exacte pour localhost
  }
  
  // Autoriser le domaine de production
  if (origin === siteUrl || origin === `${siteUrl}/`) {
    return origin;
  }
  
  // Par défaut, utiliser SITE_URL (sans slash final)
  return siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
}

// Fonction pour créer les headers CORS dynamiques
function getCorsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(req),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

// URL de base de l'API Moneroo
// Vérifier la documentation officielle pour l'URL correcte
const MONEROO_API_URL = Deno.env.get('MONEROO_API_URL') || 'https://api.moneroo.io/v1';

serve(async (req) => {
  // Log de début de requête pour diagnostic
  console.log('[Moneroo Edge Function] Request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString(),
  });

  // Créer les headers CORS dynamiques basés sur l'origine de la requête
  const corsHeaders = getCorsHeaders(req);
  
  // Log de l'origine et des headers CORS pour diagnostic
  const origin = req.headers.get('origin');
  console.log('[Moneroo Edge Function] CORS config:', {
    origin,
    allowedOrigin: corsHeaders['Access-Control-Allow-Origin'],
    method: req.method,
  });

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[Moneroo Edge Function] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier les clés API
    const monerooApiKey = Deno.env.get('MONEROO_API_KEY');
    console.log('[Moneroo Edge Function] API Key check:', {
      hasApiKey: !!monerooApiKey,
      apiKeyLength: monerooApiKey?.length || 0,
    });
    
    if (!monerooApiKey) {
      console.error('MONEROO_API_KEY is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration API manquante',
          message: 'La clé API Moneroo n\'est pas configurée dans Supabase Edge Functions Secrets',
          hint: 'Veuillez configurer MONEROO_API_KEY dans Supabase Dashboard → Edge Functions → Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le JSON de la requête
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (jsonError) {
      console.error('Error parsing request JSON:', jsonError);
      return new Response(
        JSON.stringify({ 
          error: 'Requête invalide',
          message: 'Le corps de la requête n\'est pas un JSON valide',
          details: jsonError instanceof Error ? jsonError.message : 'Unknown error'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = requestBody;
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action manquante', message: 'Le paramètre "action" est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Valider que l'action est supportée
    const supportedActions = ['create_payment', 'get_payment', 'create_checkout', 'verify_payment', 'refund_payment', 'cancel_payment'];
    if (!supportedActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Action non supportée', message: `L'action "${action}" n'est pas supportée` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Moneroo Edge Function] Processing request:', { 
      action, 
      hasData: !!data,
      dataKeys: data ? Object.keys(data) : [],
    });

    let endpoint = '';
    let method = 'POST';
    let body = data;

    // Route vers les différents endpoints Moneroo
    switch (action) {
      case 'create_payment':
        endpoint = '/payments';
        method = 'POST';
        break;
      
      case 'get_payment': {
        const validation = validatePaymentId(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation échouée',
              message: validation.error || 'paymentId invalide'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.paymentId}`;
        method = 'GET';
        body = null;
        break;
      }
      
      case 'create_checkout': {
        // Validation serveur stricte
        const validation = validateCreateCheckout(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation échouée',
              message: validation.error || 'Données invalides'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Utiliser les données validées
        const validatedData = validation.validated!;

        // Endpoint correct selon la documentation Moneroo : /payments/initialize
        // Documentation : https://docs.moneroo.io/
        endpoint = '/payments/initialize';
        method = 'POST';
        // Formater les données selon le format attendu par Moneroo
        // Documentation Moneroo : customer doit avoir first_name et last_name séparés
        // IMPORTANT: last_name ne peut pas être vide, donc on doit gérer les cas où customer_name est vide ou ne contient qu'un mot
        let customerName = (validatedData.customer_name || '').trim();
        let firstName = '';
        let lastName = '';
        
        // Si customer_name est vide, utiliser l'email comme base
        if (!customerName && validatedData.customer_email) {
          customerName = validatedData.customer_email.split('@')[0] || 'Client';
        }
        
        // Si customer_name est toujours vide, utiliser une valeur par défaut
        if (!customerName) {
          customerName = 'Client';
        }
        
        // Diviser le nom en first_name et last_name
        const customerNameParts = customerName.split(' ').filter(part => part.trim().length > 0);
        
        if (customerNameParts.length === 0) {
          // Cas improbable mais sécurisé
          firstName = 'Client';
          lastName = 'Moneroo';
        } else if (customerNameParts.length === 1) {
          // Un seul mot: utiliser ce mot pour first_name et "Client" pour last_name
          firstName = customerNameParts[0];
          lastName = 'Client';
        } else {
          // Plusieurs mots: premier mot = first_name, reste = last_name
          firstName = customerNameParts[0];
          lastName = customerNameParts.slice(1).join(' ');
        }
        
        // S'assurer que first_name et last_name ne sont jamais vides
        firstName = firstName.trim() || 'Client';
        lastName = lastName.trim() || 'Client';
        
        // Log pour diagnostic
        console.log('[Moneroo Edge Function] Customer name processing:', {
          originalCustomerName: data.customer_name,
          processedCustomerName: customerName,
          firstName,
          lastName,
          customerEmail: data.customer_email,
          nameParts: customerNameParts,
        });
        
        // Construire metadata en incluant productId et storeId si présents
        // L'API Moneroo exige metadata.product_id
        // IMPORTANT: L'API Moneroo n'accepte que string, boolean ou integer dans metadata
        // Il faut filtrer les valeurs null, undefined, et objets vides
        const rawMetadata = validatedData.metadata || {};
        const metadata: Record<string, string | number | boolean> = {};
        
        // Nettoyer les métadonnées : ne garder que les valeurs valides (string, number, boolean)
        Object.entries(rawMetadata).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            // Convertir en type valide pour Moneroo
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              metadata[key] = value;
            } else if (typeof value === 'object') {
              // Pour les objets, les convertir en string JSON
              try {
                metadata[key] = JSON.stringify(value);
              } catch {
                // Si la conversion échoue, ignorer cette clé
                console.warn(`[Moneroo Edge Function] Cannot serialize metadata.${key}, skipping`);
              }
            }
          }
        });
        
        // Ajouter productId à metadata si présent dans validatedData
        if (validatedData.productId) {
          metadata.product_id = String(validatedData.productId);
        }
        
        // Ajouter storeId à metadata si présent dans validatedData
        if (validatedData.storeId) {
          metadata.store_id = String(validatedData.storeId);
        }
        
        // Utiliser les données validées (montant et devise déjà validés)
        const amount = validatedData.amount;
        const currency = validatedData.currency;
        
        body = {
          amount: amount, // Déjà validé et arrondi
          currency: currency,
          description: validatedData.description,
          customer: {
            email: validatedData.customer_email,
            first_name: firstName,
            last_name: lastName,
          },
          return_url: validatedData.return_url,
          metadata: metadata,
          // methods est optionnel
          ...(validatedData.methods && { methods: validatedData.methods }),
        };
        break;
      }
      
      case 'verify_payment': {
        const validation = validatePaymentId(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation échouée',
              message: validation.error || 'paymentId invalide'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.paymentId}/verify`;
        method = 'GET';
        body = null;
        break;
      }
      
      case 'refund_payment': {
        const validation = validateRefundPayment(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation échouée',
              message: validation.error || 'Données invalides'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.validated!.paymentId}/refund`;
        method = 'POST';
        // Si amount n'est pas spécifié, c'est un remboursement total
        body = {
          ...(validation.validated!.amount && { amount: validation.validated!.amount }),
          reason: validation.validated!.reason || 'Customer request',
        };
        break;
      }
      
      case 'cancel_payment': {
        const validation = validatePaymentId(data);
        if (!validation.valid) {
          return new Response(
            JSON.stringify({ 
              error: 'Validation échouée',
              message: validation.error || 'paymentId invalide'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/payments/${validation.paymentId}/cancel`;
        method = 'POST';
        body = null;
        break;
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Action non supportée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Appel à l'API Moneroo
    const monerooApiUrl = `${MONEROO_API_URL}${endpoint}`;
    console.log('[Moneroo Edge Function] Calling Moneroo API:', {
      url: monerooApiUrl,
      method,
      hasBody: !!body,
      body: body ? JSON.stringify(body) : null,
    });

    let monerooResponse: Response;
    try {
      monerooResponse = await fetch(monerooApiUrl, {
        method,
        headers: {
          'Authorization': `Bearer ${monerooApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Requis selon la documentation Moneroo
        },
        body: body ? JSON.stringify(body) : null,
      });
    } catch (fetchError: any) {
      console.error('[Moneroo Edge Function] Fetch error (network/connection):', {
        error: fetchError.message,
        errorName: fetchError.name,
        url: monerooApiUrl,
        method,
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Erreur de connexion Moneroo',
          message: `Impossible de se connecter à l'API Moneroo: ${fetchError.message}`,
          details: {
            url: monerooApiUrl,
            method,
            error: fetchError.message,
            errorName: fetchError.name,
          },
          troubleshooting: {
            step1: 'Vérifiez votre connexion Internet',
            step2: 'Vérifiez que l\'URL Moneroo est correcte',
            step3: 'Vérifiez que MONEROO_API_KEY est valide',
            step4: 'Vérifiez les logs Supabase Edge Functions pour plus de détails',
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Récupérer le Content-Type de la réponse
    const contentType = monerooResponse.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    
    console.log('[Moneroo Edge Function] Moneroo API response:', {
      status: monerooResponse.status,
      statusText: monerooResponse.statusText,
      ok: monerooResponse.ok,
      contentType,
      isJson,
    });

    // Parser la réponse JSON avec gestion d'erreur améliorée
    let responseData;
    let responseText = '';
    
    try {
      responseText = await monerooResponse.text();
      
      // Logger le contenu brut pour debugging (limité à 500 caractères)
      const previewText = responseText.length > 500 
        ? responseText.substring(0, 500) + '...' 
        : responseText;
      console.log('[Moneroo Edge Function] Response preview:', {
        length: responseText.length,
        preview: previewText,
        startsWithJson: responseText.trim().startsWith('{') || responseText.trim().startsWith('['),
      });
      
      // Si la réponse est vide, créer un objet vide
      if (!responseText || responseText.trim() === '') {
        console.warn('[Moneroo Edge Function] Empty response from Moneroo API');
        responseData = {};
      } 
      // Si le Content-Type n'est pas JSON mais la réponse commence par { ou [, essayer de parser quand même
      else if (!isJson && (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
        console.warn('[Moneroo Edge Function] Content-Type is not JSON but response looks like JSON, attempting to parse');
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError: any) {
          console.error('[Moneroo Edge Function] Failed to parse JSON-like response:', {
            error: jsonError.message,
            preview: previewText,
          });
          throw jsonError;
        }
      }
      // Si le Content-Type indique JSON, parser normalement
      else if (isJson) {
        responseData = JSON.parse(responseText);
      }
      // Si la réponse est HTML (erreur serveur), extraire le message
      else if (contentType.includes('text/html')) {
        console.error('[Moneroo Edge Function] Received HTML response instead of JSON (likely server error)');
        // Essayer d'extraire un message d'erreur du HTML
        const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
        const errorMessage = titleMatch ? titleMatch[1] : 'Erreur serveur Moneroo';
        responseData = {
          error: 'Server Error',
          message: errorMessage,
          htmlResponse: true,
        };
      }
      // Autre type de contenu
      else {
        console.warn('[Moneroo Edge Function] Unexpected content type, treating as text');
        responseData = {
          error: 'Unexpected Response',
          message: `Moneroo API returned ${contentType} instead of JSON`,
          rawResponse: previewText,
        };
      }
    } catch (parseError: any) {
      console.error('[Moneroo Edge Function] Error parsing Moneroo response:', {
        error: parseError.message,
        errorName: parseError.name,
        status: monerooResponse.status,
        statusText: monerooResponse.statusText,
        contentType,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
        fullResponse: responseText.length < 1000 ? responseText : responseText.substring(0, 1000) + '...',
      });
      
      // Retourner une erreur détaillée avec le contenu brut pour debugging
      return new Response(
        JSON.stringify({ 
          error: 'Erreur de réponse Moneroo',
          message: 'Impossible de parser la réponse de l\'API Moneroo',
          details: {
            parseError: parseError.message,
            status: monerooResponse.status,
            statusText: monerooResponse.statusText,
            contentType,
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 200),
          },
          troubleshooting: {
            step1: 'Vérifiez les logs Supabase Edge Functions pour voir la réponse complète',
            step2: 'Vérifiez que MONEROO_API_KEY est correctement configuré',
            step3: 'Vérifiez que l\'endpoint Moneroo est accessible',
            step4: 'Vérifiez que les données envoyées sont valides',
          }
        }),
        { 
          status: monerooResponse.status || 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!monerooResponse.ok) {
      console.error('Moneroo API error:', {
        status: monerooResponse.status,
        statusText: monerooResponse.statusText,
        response: responseData
      });
      return new Response(
        JSON.stringify({ 
          error: 'Erreur Moneroo API',
          message: responseData.message || responseData.error || 'Erreur lors de l\'appel à l\'API Moneroo',
          details: responseData,
          status: monerooResponse.status
        }),
        { 
          status: monerooResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Moneroo response success:', { action, status: monerooResponse.status });

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne inconnue';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error in moneroo function:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Erreur interne Edge Function',
        message: errorMessage,
        hint: 'Vérifiez les logs Supabase Edge Functions pour plus de détails'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
