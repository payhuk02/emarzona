# 🔧 Solution Temporaire - Génération de Code de Lien d'Affiliation

**Date** : 31/01/2025  
**Statut** : ✅ Implémentée (temporaire)

---

## 📋 Contexte

Pendant que Supabase est en maintenance et que la migration SQL ne peut pas être exécutée, une **solution temporaire côté client** a été implémentée pour permettre la création de liens d'affiliation.

---

## ✅ Solution Implémentée

### Fonction de Fallback

Une fonction `generateLinkCodeClientSide()` a été ajoutée dans `src/hooks/useAffiliateLinks.ts` qui :

1. **Détecte automatiquement** si la fonction RPC `generate_affiliate_link_code` échoue
2. **Utilise l'API Web Crypto native** du navigateur pour générer un hash SHA256
3. **Génère un code unique** de 12 caractères en majuscules
4. **Fonctionne de manière identique** à la fonction SQL (même algorithme)

### Algorithme

```javascript
1. Générer un UUID v4 côté client
2. Créer la chaîne : `{affiliateCode}-{productSlug}-{uuid}`
3. Hasher avec SHA256 via Web Crypto API
4. Prendre les 12 premiers caractères en majuscules
```

---

## 🎯 Avantages

- ✅ **Fonctionne immédiatement** sans attendre la fin de la maintenance
- ✅ **Même algorithme** que la fonction SQL (cohérence garantie)
- ✅ **Sécurisé** : utilise l'API Web Crypto native du navigateur
- ✅ **Transparent** : l'utilisateur ne voit aucune différence
- ✅ **Automatique** : bascule vers le fallback si la RPC échoue

---

## ⚠️ Important

### Cette solution est TEMPORAIRE

Une fois Supabase de nouveau disponible, vous **DEVEZ** :

1. **Exécuter la migration SQL** :
   ```
   supabase/migrations/20250131_fix_affiliate_link_code_function.sql
   ```

2. **Vérifier que la fonction RPC fonctionne** :
   ```sql
   SELECT public.generate_affiliate_link_code('TEST123', 'test-product');
   ```

3. **Tester la création de lien** depuis l'interface

4. **Optionnel** : Retirer la fonction de fallback une fois que tout fonctionne correctement

---

## 🔍 Comment ça fonctionne

### Flux Normal (après migration)

```
Création de lien → Appel RPC → Fonction SQL → Code généré
```

### Flux Temporaire (pendant maintenance)

```
Création de lien → Appel RPC → ❌ Erreur 404/42883 → 
Fallback client → Web Crypto API → Code généré
```

---

## 📝 Notes Techniques

- La fonction de fallback est **automatiquement utilisée** si :
  - L'erreur RPC contient le code `42883` (fonction digest n'existe pas)
  - L'erreur RPC contient le code `PGRST301` (fonction non trouvée)
  - L'erreur mentionne "digest" dans le message

- Les codes générés sont **compatibles** avec ceux générés par la fonction SQL

- La fonction utilise `crypto.randomUUID()` et `crypto.subtle.digest()` qui sont **supportés nativement** par tous les navigateurs modernes

---

## ✅ Test

Pour tester que la solution fonctionne :

1. Essayez de créer un lien d'affiliation depuis l'interface
2. Vérifiez dans la console qu'un avertissement apparaît : `"RPC function unavailable, using client-side code generation as fallback"`
3. Vérifiez que le lien est créé avec succès
4. Vérifiez que le code généré fait bien 12 caractères en majuscules

---

## 🚀 Prochaines Étapes

1. **Attendre la fin de la maintenance Supabase**
2. **Exécuter la migration SQL** (voir `FIX_AFFILIATE_LINK_CODE_FUNCTION.md`)
3. **Tester que la fonction RPC fonctionne**
4. **Vérifier que les nouveaux liens utilisent la fonction SQL** (plus de warning dans la console)
5. **Optionnel** : Retirer le code de fallback si vous préférez

---

## 📞 Support

Si vous rencontrez des problèmes :

- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que `crypto.randomUUID()` est disponible (navigateurs modernes)
- Vérifiez que le contexte est HTTPS (requis pour Web Crypto API)

