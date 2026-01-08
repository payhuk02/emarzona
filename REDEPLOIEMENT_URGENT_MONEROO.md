# 🚨 REDÉPLOIEMENT URGENT - Fonction Moneroo

**Erreur actuelle** : CORS bloque `api.emarzona.com`  
**Cause** : La fonction Supabase n'a pas été redéployée avec le code corrigé

---

## ✅ SOLUTION EN 3 ÉTAPES (5 minutes)

### Étape 1 : Ouvrir l'éditeur Edge Functions

1. **Aller sur** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions
2. **Cliquer sur** `moneroo` dans la liste des fonctions
3. **Cliquer sur l'onglet "Code"** (en haut, à côté de "Logs" et "Settings")

**⚠️ IMPORTANT** : Ne PAS utiliser "SQL Editor" ! Utiliser "Edge Functions" → "moneroo" → "Code"

---

### Étape 2 : Copier le code corrigé

1. **Ouvrir** dans votre éditeur local : `supabase/functions/moneroo/index.ts`
2. **Sélectionner TOUT** le contenu (Ctrl+A)
3. **Copier** (Ctrl+C)

---

### Étape 3 : Coller et déployer

1. **Dans l'éditeur Supabase**, sélectionner tout le code existant (Ctrl+A)
2. **Supprimer** (Delete)
3. **Coller** le nouveau code (Ctrl+V)
4. **Vérifier** que les lignes 29-36 contiennent :
   ```typescript
   // Autoriser api.emarzona.com (sous-domaine API)
   if (origin === 'https://api.emarzona.com' || origin === 'https://api.emarzona.com/') {
     return origin;
   }
   ```
5. **Cliquer sur "Deploy"** (bouton en haut à droite)
6. **Attendre** le message "Function deployed successfully"

---

## ✅ VÉRIFICATION

1. **Aller sur** : `https://api.emarzona.com/checkout?productId=...`
2. **Cliquer** sur "Procéder au paiement"
3. **Vérifier** dans la console qu'il n'y a **PLUS d'erreurs CORS**

---

## 🐛 Si ça ne fonctionne pas

### Vérifier les logs Supabase

1. **Dans Supabase**, aller sur : Edge Functions → moneroo → **Logs**
2. **Faire une requête** depuis `api.emarzona.com/checkout`
3. **Vérifier** dans les logs que l'origine `https://api.emarzona.com` est bien reçue

### Vérifier le code déployé

1. **Dans l'éditeur Supabase**, vérifier que le code contient bien les lignes 29-36 pour `api.emarzona.com`
2. Si non, **re-copier** depuis le fichier local

### Vider le cache

1. **Vider le cache du navigateur** (Ctrl+Shift+Delete)
2. **Attendre 1-2 minutes** (propagation)
3. **Réessayer**

---

## 📝 Code à vérifier

Le code déployé doit contenir cette section (lignes 29-36) :

```typescript
// Autoriser api.emarzona.com (sous-domaine API)
if (origin === 'https://api.emarzona.com' || origin === 'https://api.emarzona.com/') {
  return origin;
}

// Autoriser tout sous-domaine *.emarzona.com
if (origin.includes('.emarzona.com')) {
  return origin;
}
```

---

**Dernière mise à jour** : 2025-01-30
