# 🚀 Guide Rapide - Redéploiement Fonction Moneroo

**⚠️ IMPORTANT** : Ne pas utiliser l'éditeur SQL ! Utiliser l'éditeur Edge Functions.

---

## 📍 Étape 1 : Accéder à l'éditeur Edge Functions

1. **Dans Supabase Dashboard**, cliquez sur **"Edge Functions"** dans la barre latérale gauche (icône ⚡)
2. **Cliquez sur la fonction** `moneroo` dans la liste
3. **Cliquez sur l'onglet "Code"** (pas "Logs" ni "Settings")

**URL directe** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/functions/moneroo/code

---

## 📋 Étape 2 : Copier le code mis à jour

1. **Ouvrir** le fichier local : `supabase/functions/moneroo/index.ts`
2. **Sélectionner tout** (Ctrl+A)
3. **Copier** (Ctrl+C)

---

## 📋 Étape 3 : Coller dans Supabase

1. **Dans l'éditeur Supabase**, sélectionner tout le code existant (Ctrl+A)
2. **Coller** le nouveau code (Ctrl+V)
3. **Vérifier** que les lignes 29-36 contiennent :
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

## 📋 Étape 4 : Déployer

1. **Cliquer sur le bouton "Deploy"** (en haut à droite de l'éditeur)
2. **Attendre** le message de confirmation "Function deployed successfully"
3. **Vérifier** dans l'onglet "Logs" qu'il n'y a pas d'erreurs

---

## ✅ Étape 5 : Tester

1. **Ouvrir** : `https://api.emarzona.com/checkout?productId=...`
2. **Cliquer** sur "Procéder au paiement"
3. **Vérifier** dans la console qu'il n'y a **plus d'erreurs CORS**

---

## ❌ Erreur à éviter

**NE PAS** :
- ❌ Utiliser l'éditeur SQL (Database → SQL Editor)
- ❌ Copier le code dans une requête SQL

**UTILISER** :
- ✅ Edge Functions → moneroo → Code
- ✅ L'éditeur de code TypeScript/Deno

---

## 🐛 Dépannage

### "Function not found"
→ Vérifier que vous êtes sur le bon projet : `hbdnzajbyjakdhuavrvb`

### "Deployment failed"
→ Vérifier la syntaxe TypeScript dans l'éditeur
→ Vérifier les logs d'erreur dans l'onglet "Logs"

### CORS persiste après déploiement
→ Vider le cache du navigateur (Ctrl+Shift+Delete)
→ Attendre 1-2 minutes (propagation)
→ Vérifier que le code contient bien les lignes pour `api.emarzona.com`

---

_Dernière mise à jour: 2025-01-30_
