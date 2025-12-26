# 🔍 AUDIT COMPLET DES LOGS - 8 Décembre 2025

## 📋 RÉSUMÉ EXÉCUTIF

Cet audit identifie **7 problèmes critiques** et **3 avertissements** nécessitant une action corrective :

1. ❌ **CRITIQUE** : Format DSN Sentry invalide
2. ❌ **CRITIQUE** : Erreur 400 sur requête profiles avec `user_id.in()`
3. ❌ **CRITIQUE** : 4 fichiers images introuvables dans le bucket (HTTP 400)
4. ❌ **CRITIQUE** : 1 fichier image corrompu (retourne JSON au lieu d'image)
5. ⚠️ **WARNING** : Métriques de performance sous-optimales (FCP, LCP, CLS)
6. ⚠️ **WARNING** : Crisp Chat désactivé (configuration manquante)
7. ⚠️ **INFO** : Warning preload resource (mineur)

---

## 1. ❌ FORMAT DSN SENTRY INVALIDE

### Problème

```
[WARN] Sentry DSN format suspect. Format attendu: https://<key>@<host>/<project_id>
[ERROR] Invalid Sentry Dsn: https://41fb924c28b3e18f148e62de87b9b2efe6c451826194294744.ingest.de.sentry.io/4518261989488848
```

### Cause

Le DSN Sentry actuel est au format :

```
https://41fb924c28b3e18f148e62de87b9b2efe6c451826194294744.ingest.de.sentry.io/4518261989488848
```

Il manque le séparateur `@` entre la clé et l'hôte. Le format correct devrait être :

```
https://<key>@<host>/<project_id>
```

### Impact

- Sentry ne peut pas être initialisé correctement
- Les erreurs ne sont pas trackées en production
- Pas de monitoring d'erreurs disponible

### Solution

1. Vérifier le DSN dans le dashboard Sentry : https://sentry.io/settings/
2. Copier le DSN complet (format : `https://<key>@<host>/<project_id>`)
3. Mettre à jour la variable d'environnement `VITE_SENTRY_DSN`
4. Redémarrer l'application

### Fichiers concernés

- `.env.local` ou variables d'environnement Vercel
- `src/lib/sentry.ts` (valide déjà le format)

---

## 2. ❌ ERREUR 400 SUR REQUÊTE PROFILES

### Problème

```
GET https://hbdnzajbyjakdhuavrvb.supabase.co/rest/v1/profiles?select=user_id%2Cname%2Cavatar_url&user_id=in.%28cd50a4d0-6c7f-405a-b0ed-2ac5f12c33cc%2C58874540-6553-45e3-bc98-14ea3808208c%29 400 (Bad Request)
```

### Cause

La requête utilise `.in("user_id", senderIds)` dans `useVendorMessaging.ts`, mais Supabase construit une URL malformée avec `user_id=in.(...)` qui n'est pas correctement encodée.

L'URL encodée montre `user_id=in.%28...%29` qui devient `user_id=in.(...)` après décodage, ce qui n'est pas un format valide pour Supabase REST API.

### Impact

- Les profils des expéditeurs de messages ne sont pas chargés
- Les avatars et noms d'utilisateurs ne s'affichent pas dans la messagerie
- Expérience utilisateur dégradée

### Solution

Vérifier que `senderIds` contient uniquement des UUIDs valides et non vides avant d'appeler `.in()`. Ajouter une validation :

```typescript
// Dans src/hooks/useVendorMessaging.ts, ligne 219
const senderIds = [...new Set((messagesData || []).map((m: any) => m.sender_id).filter(Boolean))];

// Vérifier que les IDs sont valides (UUIDs)
const validSenderIds = senderIds.filter(id => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
});

if (validSenderIds.length > 0) {
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('user_id, name, avatar_url')
    .in('user_id', validSenderIds);
}
```

### Fichiers concernés

- `src/hooks/useVendorMessaging.ts` (ligne 219-223)

---

## 3. ❌ FICHIERS IMAGES INTROUVABLES (HTTP 400)

### Problème

4 fichiers retournent HTTP 400 et ne sont pas trouvés dans le bucket :

1. `vendor-message-attachments/1765211674422-n3cru35bsso.png`
2. `vendor-message-attachments/1765223731377-b09nes58pjm.png`
3. `vendor-message-attachments/1765224210801-7qzbp1xq9lm.png`
4. `vendor-message-attachments/1765207968982-y0xu1n9lneq.png`

Logs :

```
[ERROR] ❌ File does NOT exist in bucket {filesFound: 0}
[ERROR] Image load failed with HTTP status {status: 400}
```

### Cause

Les fichiers n'existent pas physiquement dans le bucket Supabase Storage, mais les références existent toujours dans la table `vendor_message_attachments`.

### Impact

- Images ne s'affichent pas
- Messages avec pièces jointes montrent "Image non disponible"
- Expérience utilisateur dégradée

### Solution

1. **Option 1 (Recommandé)** : Nettoyer les références orphelines
   - Supprimer les entrées dans `vendor_message_attachments` pour ces fichiers
   - Les utilisateurs devront réuploader les images si nécessaire

2. **Option 2** : Si les fichiers existent ailleurs, les reuploader avec les mêmes noms

### Fichiers concernés

- Table Supabase : `vendor_message_attachments`
- Bucket Supabase Storage : `attachments/vendor-message-attachments/`

### Script SQL proposé

```sql
-- Identifier les fichiers orphelins
SELECT
  id,
  message_id,
  file_name,
  file_url,
  storage_path,
  created_at
FROM vendor_message_attachments
WHERE storage_path IN (
  'vendor-message-attachments/1765211674422-n3cru35bsso.png',
  'vendor-message-attachments/1765223731377-b09nes58pjm.png',
  'vendor-message-attachments/1765224210801-7qzbp1xq9lm.png',
  'vendor-message-attachments/1765207968982-y0xu1n9lneq.png'
);

-- Supprimer les références orphelines (à exécuter après vérification)
-- DELETE FROM vendor_message_attachments
-- WHERE storage_path IN (...);
```

---

## 4. ❌ FICHIER IMAGE CORROMPU (HTTP 200 + JSON)

### Problème

1 fichier retourne HTTP 200 mais le contenu est du JSON au lieu d'une image :

- `vendor-message-attachments/1765225361400-zpumaooy32e.png`

Logs :

```
[ERROR] ❌ CRITICAL: HTTP 200 but invalid Content-Type {contentType: 'application/json'}
[ERROR] ❌ JSON Response Analysis (Supabase Error) {jsonError: {...}, blobSize: 603082}
[INFO] ✅ File exists in bucket
[WARN] MediaAttachment - Signed URL also failed, all attempts exhausted
```

### Cause

Le fichier existe dans le bucket, mais son contenu réel est du JSON (probablement une réponse d'erreur Supabase capturée lors d'un upload initial). Le fichier a été corrompu pendant l'upload.

Même avec :

- ✅ Politiques RLS corrigées
- ✅ Content-Type metadata corrigé (`image/png`)
- ✅ URL signée générée avec succès

Le fichier retourne toujours du JSON, ce qui confirme que le **contenu binaire du fichier lui-même est corrompu**.

### Impact

- Image ne s'affiche jamais
- Tous les mécanismes de fallback (public URL, signed URL) échouent
- Expérience utilisateur dégradée

### Solution

**Supprimer le fichier corrompu et le réuploader** :

1. **Supprimer le fichier du bucket** :
   - Supabase Dashboard > Storage > Buckets > attachments > vendor-message-attachments/
   - Sélectionner `1765225361400-zpumaooy32e.png`
   - Cliquer "Delete"

2. **Supprimer la référence en base** :

   ```sql
   DELETE FROM vendor_message_attachments
   WHERE storage_path = 'vendor-message-attachments/1765225361400-zpumaooy32e.png';
   ```

3. **Réuploader l'image** depuis la messagerie (le nouveau upload fonctionnera correctement avec les politiques RLS et le code d'upload améliorés)

### Fichiers concernés

- Bucket Supabase Storage : `attachments/vendor-message-attachments/1765225361400-zpumaooy32e.png`
- Table Supabase : `vendor_message_attachments`

---

## 5. ⚠️ MÉTRIQUES DE PERFORMANCE SOUS-OPTIMALES

### Problèmes identifiés

#### First Contentful Paint (FCP)

- **Valeur** : 2544ms
- **Seuil** : 2000ms
- **Rating** : `needs-improvement`
- **Impact** : L'utilisateur voit le contenu après 2.5 secondes

#### Largest Contentful Paint (LCP)

- **Valeur** : 6028ms
- **Seuil critique** : 5000ms
- **Rating** : `poor`
- **Impact** : L'élément principal de la page prend plus de 6 secondes à charger

#### Cumulative Layout Shift (CLS)

- **Valeur** : 0ms (pas de shift détecté, mais warning affiché)
- **Rating** : `needs-improvement`
- **Impact** : Mineur (peut être un faux positif)

### Recommandations

1. **Optimiser FCP** :
   - Lazy-load les images non critiques
   - Réduire la taille du bundle JavaScript initial
   - Utiliser `preload` pour les ressources critiques
   - Optimiser les fonts (subset, preload)

2. **Optimiser LCP** :
   - Optimiser l'image LCP (compression, format WebP, lazy-load)
   - Réduire le temps de chargement du serveur (TTFB)
   - Minimiser le JavaScript de blocage
   - Utiliser CDN pour les assets statiques

3. **Vérifier CLS** :
   - S'assurer que les dimensions des images sont définies
   - Éviter les insertions dynamiques de contenu au-dessus du contenu existant

### Fichiers concernés

- `src/lib/apm-monitoring.ts`
- `src/lib/performance-monitor.ts`
- Configuration Vite pour l'optimisation des assets

---

## 6. ⚠️ CRISP CHAT DÉSACTIVÉ

### Problème

```
[WARN] VITE_CRISP_WEBSITE_ID non configuré. Live Chat désactivé.
```

### Cause

La variable d'environnement `VITE_CRISP_WEBSITE_ID` n'est pas configurée.

### Impact

- Le chat en direct Crisp n'est pas disponible
- Les utilisateurs ne peuvent pas contacter le support directement

### Solution

1. Si Crisp est souhaité :
   - Obtenir le Website ID depuis https://app.crisp.chat
   - Ajouter `VITE_CRISP_WEBSITE_ID=votre-website-id` dans `.env.local`
   - Redémarrer l'application

2. Si Crisp n'est pas souhaité :
   - Supprimer le composant `CrispChat.tsx` ou le désactiver silencieusement (ne pas afficher le warning)

### Fichiers concernés

- `.env.local` ou variables d'environnement Vercel
- `src/components/CrispChat.tsx`

---

## 7. ⚠️ WARNING PRELOAD RESOURCE (Mineur)

### Problème

```
The resource http://localhost:8080/src/main.tsx was preloaded using link preload but not used within a few seconds from the window's load event.
```

### Cause

Le fichier `main.tsx` est préchargé mais n'est pas utilisé rapidement, ou la balise `preload` n'a pas le bon attribut `as`.

### Impact

- Mineur (performance légèrement dégradée)
- Pas d'impact fonctionnel

### Solution

Vérifier la configuration Vite et s'assurer que les préchargements sont correctement configurés, ou supprimer le preload si non nécessaire.

---

## 📊 STATISTIQUES GLOBALES

### Erreurs critiques : 4

- Format DSN Sentry invalide
- Erreur 400 sur requête profiles
- 4 fichiers images introuvables
- 1 fichier image corrompu

### Avertissements : 3

- Métriques de performance sous-optimales
- Crisp Chat désactivé
- Warning preload resource

### Fichiers affectés : 7

- `src/lib/sentry.ts`
- `src/hooks/useVendorMessaging.ts`
- `src/components/media/MediaAttachment.tsx`
- `src/components/CrispChat.tsx`
- `.env.local` / Variables Vercel
- Table Supabase : `vendor_message_attachments`
- Bucket Supabase Storage : `attachments`

---

## ✅ PLAN D'ACTION PRIORISÉ

### Priorité 1 (Critique - À corriger immédiatement)

1. ✅ Corriger le format DSN Sentry
2. ✅ Corriger l'erreur 400 sur requête profiles
3. ✅ Supprimer le fichier corrompu et nettoyer les références orphelines

### Priorité 2 (Important - À corriger sous 1 semaine)

4. ⚠️ Optimiser les métriques de performance (FCP, LCP)
5. ⚠️ Configurer Crisp Chat ou le désactiver silencieusement

### Priorité 3 (Amélioration - À faire si temps disponible)

6. ⚠️ Corriger le warning preload resource

---

## 📝 NOTES TECHNIQUES

### Formats DSN Sentry valides

```
https://<key>@<host>/<project_id>
https://abc123def456@o123456.ingest.sentry.io/7891011
```

### Format Supabase `.in()` correct

```typescript
// ✅ Correct
.in("user_id", [uuid1, uuid2, uuid3])

// ❌ Incorrect - Ne pas utiliser des valeurs null ou invalides
.in("user_id", [uuid1, null, uuid2])
```

### Vérification de l'existence d'un fichier dans Supabase Storage

```typescript
const { data: fileList } = await supabase.storage
  .from('attachments')
  .list('vendor-message-attachments', {
    limit: 100,
    search: 'filename.png',
  });

const fileExists = fileList && fileList.length > 0;
```

---

**Date de l'audit** : 8 Décembre 2025  
**Version de l'application** : Development  
**Environnement** : Local (localhost:8080)
