# 🔐 Configuration Auth Supabase pour emarzona.com

## 📋 Instructions de Configuration

### 1. Accéder au Dashboard Supabase

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet Emarzona
3. Naviguer vers **Authentication → Settings**

---

### 2. Configuration Site URL

**Section : Site Configuration**

- **Site URL** : `https://emarzona.com`
- **Additional Redirect URLs** :
  ```
  https://emarzona.com/auth/callback
  https://emarzona.com
  https://emarzona.com/dashboard
  https://emarzona.com/profile
  https://emarzona.com/settings
  ```

---

### 3. Configuration JWT

**Section : JWT Configuration**

- **JWT Expiry** :
  - Access Token : `3600` secondes (1 heure)
  - Refresh Token : `604800` secondes (7 jours)

- **JWT Secret** : Garder la valeur générée automatiquement

---

### 4. Configuration Email Templates (Optionnel)

**Section : Email Templates**

Pour chaque template d'email :

- **From** : `noreply@emarzona.com`
- **Site URL** : `https://emarzona.com`

Templates à configurer :

- ✅ Confirm signup
- ✅ Invite user
- ✅ Reset password
- ✅ Magic link

---

### 5. Configuration Social Providers (Si utilisés)

#### Google OAuth :

1. Aller dans **Authentication → Providers → Google**
2. **Authorized Redirect URIs** :
   ```
   https://emarzona.com/auth/callback
   ```

#### GitHub OAuth :

1. Aller dans **Authentication → Providers → GitHub**
2. **Authorization callback URL** :
   ```
   https://emarzona.com/auth/callback
   ```

#### Autres providers :

- Même principe : ajouter `https://emarzona.com/auth/callback` dans les URLs de redirection

---

### 6. Variables d'Environnement Edge Functions

**Supabase Dashboard → Edge Functions → Secrets**

Ajouter la variable :

```
SITE_URL = https://emarzona.com
```

---

### 7. Test de l'Authentification

Après configuration, tester :

#### ✅ Test Connexion

```bash
# Tester la page de connexion
curl -I https://emarzona.com/auth/login
```

#### ✅ Test Callback OAuth

```bash
# Tester l'URL de callback
curl -I https://emarzona.com/auth/callback
```

#### ✅ Test Inscription

- Aller sur `https://emarzona.com/auth/register`
- Créer un compte test
- Vérifier que l'email de confirmation est envoyé

#### ✅ Test Connexion

- Se connecter avec le compte test
- Vérifier la redirection vers `/dashboard`

---

### 8. Dépannage

#### ❌ Erreur "Invalid redirect URL"

- Vérifier que `https://emarzona.com/auth/callback` est dans les Redirect URLs

#### ❌ Erreur "Invalid site URL"

- Vérifier que le Site URL est exactement `https://emarzona.com`

#### ❌ Emails non reçus

- Vérifier que `noreply@emarzona.com` est configuré dans les templates
- Vérifier la configuration SMTP dans Supabase

#### ❌ OAuth ne fonctionne pas

- Vérifier que `https://emarzona.com/auth/callback` est ajouté dans les paramètres du provider OAuth

---

### 9. Vérifications Finales

#### Dans Supabase Dashboard :

- ✅ Authentication → Settings → Site URL = `https://emarzona.com`
- ✅ Authentication → Settings → Redirect URLs inclut `https://emarzona.com/auth/callback`
- ✅ Edge Functions → Secrets → SITE_URL = `https://emarzona.com`

#### Dans l'application :

- ✅ Connexion utilisateur fonctionne
- ✅ Inscription utilisateur fonctionne
- ✅ Réinitialisation mot de passe fonctionne
- ✅ OAuth (si activé) fonctionne

---

## 🎯 Résumé

**L'authentification Supabase est maintenant configurée pour `emarzona.com` avec :**

- ✅ Site URL principal : `https://emarzona.com`
- ✅ URLs de redirection sécurisées
- ✅ Templates d'email configurés
- ✅ Providers OAuth (si utilisés)
- ✅ Variables d'environnement Edge Functions

**🔒 L'authentification est maintenant 100% compatible avec votre domaine personnalisé !**
