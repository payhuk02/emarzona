# 🚨 Déploiement Urgent - Edge Function Moneroo

## ❌ Problème Identifié

**Erreur 404 sur l'Edge Function :**
```
POST https://your-project-id.supabase.co/functions/v1/moneroo 404 (Not Found)
```

**Cause :** L'Edge Function `moneroo` n'est pas déployée ou le déploiement a échoué.

## ✅ Solution Immédiate

### Étape 1 : Vérifier que la fonction existe dans Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet **Payhuk**
3. Allez dans **Edge Functions** (menu de gauche)
4. Vérifiez si la fonction `moneroo` est listée

### Étape 2 : Déployer l'Edge Function via Dashboard

**Option A : Si la fonction n'existe pas encore**

1. Dans **Edge Functions**, cliquez sur **"New Function"** ou **"Create Function"**
2. Nommez-la `moneroo`
3. Collez le code complet (voir ci-dessous)
4. Cliquez sur **"Deploy"**

**Option B : Si la fonction existe déjà**

1. Cliquez sur la fonction `moneroo`
2. Allez dans l'onglet **"Code"**
3. Sélectionnez tout le code existant (Ctrl+A / Cmd+A)
4. Supprimez-le
5. Collez le code complet ci-dessous
6. Cliquez sur **"Deploy updates"** ou **"Save"**

### Étape 3 : Code Complet à Coller

⚠️ **IMPORTANT :** Ne copiez PAS la première ligne `/// <reference path="../deno.d.ts" />` dans le Dashboard Supabase. Cette ligne est uniquement pour l'IDE local.

**Code complet (sans la première ligne de référence) :**

```
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      
      case 'get_payment':
        endpoint = `/payments/${data.paymentId}`;
        method = 'GET';
        body = null;
        break;
      
      case 'create_checkout':
        // Utiliser /payments pour créer un paiement avec checkout
        // Moneroo utilise /payments pour créer les paiements (pas /checkout)
        endpoint = '/payments';
        method = 'POST';
        // Formater les données selon le format attendu par Moneroo
        body = {
          amount: data.amount,
          currency: data.currency || 'XOF',
          description: data.description,
          customer_email: data.customer_email,
          customer_name: data.customer_name,
          return_url: data.return_url,
          cancel_url: data.cancel_url,
          metadata: data.metadata || {},
        };
        break;
      
      case 'verify_payment':
        endpoint = `/payments/${data.paymentId}/verify`;
        method = 'GET';
        body = null;
        break;
      
      case 'refund_payment':
        endpoint = `/payments/${data.paymentId}/refund`;
        method = 'POST';
        // Si amount n'est pas spécifié, c'est un remboursement total
        body = {
          ...(data.amount && { amount: data.amount }),
          reason: data.reason || 'Customer request',
        };
        break;
      
      case 'cancel_payment':
        endpoint = `/payments/${data.paymentId}/cancel`;
        method = 'POST';
        body = null;
        break;
      
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
    });

    const monerooResponse = await fetch(monerooApiUrl, {
      method,
      headers: {
        'Authorization': `Bearer ${monerooApiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });

    console.log('[Moneroo Edge Function] Moneroo API response:', {
      status: monerooResponse.status,
      statusText: monerooResponse.statusText,
      ok: monerooResponse.ok,
    });

    // Parser la réponse JSON
    let responseData;
    try {
      const responseText = await monerooResponse.text();
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Error parsing Moneroo response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur de réponse Moneroo',
          message: 'Impossible de parser la réponse de l\'API Moneroo',
          status: monerooResponse.status,
          statusText: monerooResponse.statusText
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
```

### Étape 4 : Configurer les Secrets

1. Dans **Edge Functions**, allez dans l'onglet **"Secrets"**
2. Vérifiez que `MONEROO_API_KEY` est configuré
3. Si ce n'est pas le cas, cliquez sur **"Add a new secret"**
4. Nom : `MONEROO_API_KEY`
5. Valeur : Votre clé API Moneroo
6. Cliquez sur **"Save"**

### Étape 5 : Vérifier le Déploiement

1. Après le déploiement, allez dans l'onglet **"Logs"**
2. Vous devriez voir des messages `booted (time: Xms)` indiquant que la fonction a démarré
3. Testez un paiement depuis votre application locale
4. Vérifiez les nouveaux logs pour confirmer que les requêtes sont reçues

## ✅ Vérifications Post-Déploiement

### 1. Vérifier que la fonction est accessible

Dans les logs Supabase, vous devriez voir :
```
INFO [Moneroo Edge Function] Request received: { method: "POST", ... }
```

### 2. Vérifier que CORS fonctionne

Dans les logs, vous devriez voir :
```
INFO [Moneroo Edge Function] CORS config: { origin: "http://localhost:8080", allowedOrigin: "http://localhost:8080", ... }
```

### 3. Vérifier que l'endpoint est correct

Dans les logs, vous devriez voir :
```
INFO [Moneroo Edge Function] Calling Moneroo API: { url: "https://api.moneroo.io/v1/payments", ... }
```

**⚠️ IMPORTANT :** L'URL doit être `/v1/payments` et NON `/v1/checkout`

## 🆘 Dépannage

### Si l'erreur 404 persiste

1. **Vérifier que la fonction est déployée :**
   - Allez dans **Edge Functions** > **moneroo** > **Overview**
   - Vérifiez que la fonction est listée et active

2. **Vérifier l'URL de l'Edge Function :**
   - L'URL doit être : `https://[PROJECT_REF].supabase.co/functions/v1/moneroo`
   - Vérifiez dans votre code frontend que cette URL est correcte

3. **Vérifier les permissions :**
   - Assurez-vous que l'Edge Function est accessible publiquement (pas de restrictions RLS)

### Si l'erreur 500 apparaît

1. **Vérifier les Secrets :**
   - Vérifiez que `MONEROO_API_KEY` est bien configuré
   - Vérifiez les logs pour voir si la clé API est détectée

2. **Vérifier les logs :**
   - Les logs Supabase devraient indiquer l'erreur exacte
   - Vérifiez particulièrement les erreurs de l'API Moneroo

## 📋 Checklist de Déploiement

- [ ] Edge Function `moneroo` créée dans Supabase Dashboard
- [ ] Code complet collé (sans la ligne de référence `deno.d.ts`)
- [ ] Fonction déployée avec succès
- [ ] Secret `MONEROO_API_KEY` configuré
- [ ] Logs montrent que la fonction démarre (`booted`)
- [ ] Test d'un paiement depuis l'application locale
- [ ] Logs montrent que les requêtes sont reçues
- [ ] Plus d'erreur 404 dans la console du navigateur
- [ ] Plus d'erreur 404 dans les logs Supabase

## 🎯 Résultat Attendu

Après le déploiement :
- ✅ Plus d'erreur 404 sur l'Edge Function
- ✅ Les requêtes POST atteignent l'Edge Function
- ✅ Les logs Supabase montrent les requêtes entrantes
- ✅ Les paiements peuvent être initiés depuis l'application
- ✅ Plus d'erreur 404 dans la console du navigateur




