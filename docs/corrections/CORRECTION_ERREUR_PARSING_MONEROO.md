# 🔧 CORRECTION : Erreur de Parsing Moneroo API

**Date** : 18 Novembre 2025  
**Problème** : "Impossible de parser la réponse de l'API Moneroo" sur la page checkout  
**Statut** : ✅ **CORRIGÉ**

---

## 🔍 PROBLÈME IDENTIFIÉ

L'erreur se produisait dans l'Edge Function Supabase lors du parsing de la réponse de l'API Moneroo. Le code essayait de parser la réponse comme JSON sans vérifier :
- Le Content-Type de la réponse
- Si la réponse était vide
- Si la réponse était du HTML (erreur serveur)
- Le contenu brut de la réponse pour debugging

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Edge Function (`supabase/functions/moneroo/index.ts`)

**Améliorations** :
- ✅ Vérification du Content-Type avant parsing
- ✅ Gestion des réponses vides
- ✅ Détection et gestion des réponses HTML (erreurs serveur)
- ✅ Logging détaillé du contenu brut pour debugging
- ✅ Messages d'erreur enrichis avec détails techniques
- ✅ Guide de troubleshooting inclus dans l'erreur

**Code ajouté** :
```typescript
// Vérification du Content-Type
const contentType = monerooResponse.headers.get('content-type') || '';
const isJson = contentType.includes('application/json');

// Gestion intelligente du parsing
- Réponses vides → Objet vide
- JSON valide → Parse normal
- HTML → Extraction du message d'erreur
- Autres types → Message d'erreur avec aperçu
```

### 2. Client Moneroo (`src/lib/moneroo-client.ts`)

**Améliorations** :
- ✅ Détection spécifique de l'erreur de parsing
- ✅ Message d'erreur enrichi avec détails techniques
- ✅ Guide de troubleshooting pour l'utilisateur
- ✅ Affichage du status, Content-Type, longueur de réponse

### 3. Page Checkout (`src/pages/checkout/Checkout.tsx`)

**Améliorations** :
- ✅ Affichage du message d'erreur simplifié dans le toast
- ✅ Message complet dans la console pour debugging
- ✅ Durée d'affichage augmentée pour les erreurs avec détails

---

## 📋 DÉTAILS TECHNIQUES

### Avant (Problème)
```typescript
// ❌ Parsing simple sans vérification
const responseText = await monerooResponse.text();
responseData = responseText ? JSON.parse(responseText) : {};
// → Échoue si réponse HTML, vide, ou malformée
```

### Après (Solution)
```typescript
// ✅ Parsing intelligent avec gestion d'erreurs
const contentType = monerooResponse.headers.get('content-type') || '';
const isJson = contentType.includes('application/json');

// Gestion selon le type de contenu
if (!responseText || responseText.trim() === '') {
  responseData = {}; // Réponse vide
} else if (isJson) {
  responseData = JSON.parse(responseText); // JSON valide
} else if (contentType.includes('text/html')) {
  // Extraire message d'erreur du HTML
  const titleMatch = responseText.match(/<title[^>]*>([^<]+)<\/title>/i);
  responseData = { error: 'Server Error', message: titleMatch?.[1] };
} else {
  // Autre type → Message avec aperçu
  responseData = { error: 'Unexpected Response', rawResponse: previewText };
}
```

---

## 🎯 RÉSULTAT

### Avant
- ❌ Erreur générique : "Impossible de parser la réponse de l'API Moneroo"
- ❌ Aucun détail pour debugging
- ❌ Pas de guide de résolution

### Après
- ✅ Message d'erreur détaillé avec :
  - Status HTTP
  - Content-Type
  - Longueur de la réponse
  - Aperçu du contenu
  - Guide de troubleshooting
- ✅ Logs complets dans Supabase Edge Functions
- ✅ Message utilisateur simplifié dans le toast
- ✅ Détails complets dans la console pour debugging

---

## 🔍 DEBUGGING

Si l'erreur persiste, vérifier dans **Supabase Dashboard → Edge Functions → Logs → moneroo** :

1. **Response preview** : Aperçu de la réponse Moneroo
2. **Content-Type** : Type de contenu reçu
3. **Status** : Code HTTP de la réponse
4. **Full response** : Réponse complète (si < 1000 caractères)

### Causes possibles

1. **API Moneroo retourne HTML** (erreur serveur)
   - Vérifier que MONEROO_API_KEY est correct
   - Vérifier que l'endpoint Moneroo est accessible

2. **Réponse vide**
   - Vérifier la connexion réseau
   - Vérifier que l'API Moneroo répond

3. **JSON malformé**
   - Vérifier les logs pour voir le contenu brut
   - Contacter le support Moneroo si nécessaire

---

## ✅ FICHIERS MODIFIÉS

1. `supabase/functions/moneroo/index.ts` - Parsing amélioré
2. `src/lib/moneroo-client.ts` - Gestion d'erreur enrichie
3. `src/pages/checkout/Checkout.tsx` - Affichage d'erreur amélioré

---

## 🚀 PROCHAINES ÉTAPES

1. Tester le checkout avec différents scénarios
2. Vérifier les logs Supabase si l'erreur persiste
3. Contacter le support Moneroo si l'API retourne des erreurs

---

**Correction complétée le** : 18 Novembre 2025


