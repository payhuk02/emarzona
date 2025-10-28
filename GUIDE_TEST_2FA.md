# 🔐 GUIDE DE TEST - AUTHENTIFICATION 2FA

**Plateforme** : Payhula  
**Feature** : Two-Factor Authentication (TOTP)  
**Date** : 28 Octobre 2025

---

## 📋 PRÉ-REQUIS

### Applications Authenticator

Téléchargez une de ces apps sur votre smartphone :

- **Google Authenticator** (iOS & Android) - Recommandé
- **Microsoft Authenticator** (iOS & Android)
- **Authy** (Multi-plateforme avec backup cloud)
- **1Password** (Premium)
- **Bitwarden** (Gratuit)

### Compte Admin

- Compte Payhula avec rôle `admin` ou `superadmin`
- Email vérifié
- Connexion active

---

## ✅ TEST 1 : ENROLLMENT (Inscription 2FA)

### Objectif
Activer le 2FA pour la première fois sur un compte admin.

### Étapes

#### 1. Navigation
```
1. Se connecter à Payhula
2. Cliquer sur "Settings" (menu gauche)
3. Sélectionner l'onglet "Sécurité"
4. Scroller jusqu'à la section "Authentification à deux facteurs"
```

#### 2. Vérifications Initiales

**✓ Affichage attendu** :
- ❌ Alert orange : "L'authentification à deux facteurs n'est pas activée"
- 🔘 Bouton "Activer le 2FA" visible et cliquable
- 📝 Card "Configuration" avec description des apps

#### 3. Activation

```
1. Cliquer sur "Activer le 2FA"
2. Attendre l'initialisation (loading spinner)
```

**✓ Vérifications** :
- Loader s'affiche pendant l'initialisation
- Pas d'erreur dans la console
- Appel API Supabase `mfa.enroll()` réussi

#### 4. QR Code Généré

**✓ Affichage attendu** :
- 📱 QR Code affiché (image 192x192px)
- 🔑 Clé secrète manuelle affichée (format : ABC123DEF456)
- 📋 Bouton "Copier" pour la clé
- 🔢 Input pour code de vérification (6 chiffres)
- ✅ Bouton "Vérifier et activer"
- ❌ Bouton "Annuler"

**✓ Actions** :
```
1. Ouvrir Google Authenticator sur smartphone
2. Scanner le QR Code avec l'app
   OU
3. Copier la clé manuelle et l'entrer dans l'app
```

**✓ Résultat dans l'app** :
- Entrée "Payhula" ou "supabase" créée
- Code à 6 chiffres affiché et rafraîchi toutes les 30s

#### 5. Vérification Code

```
1. Saisir le code à 6 chiffres depuis l'app authenticator
2. Cliquer "Vérifier et activer"
```

**✓ Vérifications** :
- Input accepte uniquement des chiffres
- Maximum 6 caractères
- Bouton désactivé si moins de 6 chiffres
- Loading pendant la vérification

**✓ Succès attendu** :
- ✅ Toast : "2FA activé !"
- 🔄 Section 2FA se ferme
- 🟢 Alert verte : "2FA activé - Votre compte est protégé"
- 📜 Liste des facteurs affichée avec :
  - Nom : "Authenticator App"
  - Badge : "Vérifié"
  - Date de création
  - Bouton "Désactiver"

#### 6. Erreurs Possibles

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Code incorrect" | Code expiré (>30s) | Attendre nouveau code et réessayer |
| "Erreur Supabase" | MFA pas configuré | Vérifier config Supabase |
| QR Code ne s'affiche pas | Dépendance manquante | Vérifier `qrcode` installé |

---

## ✅ TEST 2 : LOGIN AVEC 2FA

### Objectif
Se connecter avec l'authentification à deux facteurs active.

### Pré-requis
- 2FA activé (Test 1 complété)
- Se déconnecter de Payhula

### Étapes

#### 1. Login Standard
```
1. Aller sur /login
2. Entrer email + mot de passe
3. Cliquer "Se connecter"
```

#### 2. Prompt 2FA

**✓ Affichage attendu** :
- 🔐 Écran : "Authentification à deux facteurs"
- 📝 Description : "Entrez le code depuis votre app authenticator"
- 🔢 Input : Code à 6 chiffres
- ⏱️ Timer : Temps restant (optionnel)
- ❌ Lien : "Code de récupération"

#### 3. Saisie Code

```
1. Ouvrir Google Authenticator
2. Copier le code Payhula (6 chiffres)
3. Le saisir dans l'input
4. Appuyer Entrée ou cliquer "Valider"
```

**✓ Vérifications** :
- Code accepté si valide
- Redirection vers Dashboard
- Session créée avec 2FA validé

**✓ Erreurs possibles** :
- "Code invalide" → Attendre nouveau code
- "Code expiré" → Utiliser code de récupération
- "Trop de tentatives" → Attendre 5 minutes

#### 4. Session Sécurisée

**✓ Vérifications post-login** :
- User connecté
- Token session contient `aal2` (Authentication Assurance Level 2)
- Badge "2FA" visible dans profil (optionnel)

---

## ✅ TEST 3 : DÉSACTIVATION 2FA

### Objectif
Désactiver le 2FA sur un compte.

### Étapes

#### 1. Navigation
```
1. Settings → Sécurité
2. Section "Authentification à deux facteurs"
3. Cliquer sur le facteur actif
```

#### 2. Désactivation

```
1. Cliquer "Désactiver"
2. Confirmer dans la modal (si demandé)
```

**✓ Vérifications** :
- ✅ Toast : "2FA désactivé"
- ❌ Alert orange : "2FA non activé"
- 🔘 Bouton "Activer le 2FA" réapparaît

#### 3. Login Sans 2FA

```
1. Se déconnecter
2. Se reconnecter avec email + password
3. Accès direct au Dashboard (pas de prompt 2FA)
```

---

## ✅ TEST 4 : CODES DE RÉCUPÉRATION (Backup Codes)

### Objectif
Utiliser un code de récupération si l'app authenticator est perdue.

### Pré-requis
- 2FA activé
- Générer codes de récupération (fonctionnalité à implémenter)

### Étapes

#### 1. Génération Codes

```
Settings → Sécurité → 2FA → "Générer codes de récupération"
```

**✓ Affichage** :
- 10 codes à usage unique
- Format : `ABCD-1234-EFGH-5678`
- Boutons : Copier / Télécharger / Imprimer

#### 2. Utilisation Code

```
1. Login standard
2. Prompt 2FA → Cliquer "Code de récupération"
3. Entrer un des 10 codes
4. Valider
```

**✓ Résultat** :
- Accès au compte
- Code utilisé devient invalide
- Avertissement : "9 codes restants"

---

## ✅ TEST 5 : SÉCURITÉ & EDGE CASES

### Test 5.1 : Multi-Devices

**Objectif** : Vérifier qu'un seul QR Code fonctionne sur plusieurs devices.

```
1. Scanner le même QR Code sur 2 smartphones
2. Les 2 génèrent le même code
3. N'importe lequel des 2 peut être utilisé pour login
```

### Test 5.2 : Code Expiré

**Objectif** : Vérifier rejet des codes expirés.

```
1. Noter un code TOTP
2. Attendre 35 secondes (expiration)
3. Essayer d'utiliser ce code → DOIT être rejeté
```

### Test 5.3 : Brute Force Protection

**Objectif** : Bloquer tentatives multiples.

```
1. Entrer 5 mauvais codes consécutifs
2. Compte temporairement bloqué (5 min)
3. Message : "Trop de tentatives"
```

### Test 5.4 : Concurrent Sessions

**Objectif** : 2FA pour chaque nouvelle session.

```
1. Login sur Chrome → Prompt 2FA ✓
2. Login sur Firefox → Prompt 2FA ✓
3. Les 2 sessions valides simultanément
```

---

## 🐛 CHECKLIST DE BUGS POTENTIELS

### Frontend

- [ ] QR Code ne s'affiche pas
- [ ] Input 6 chiffres accepte des lettres
- [ ] Bouton "Vérifier" reste désactivé même avec 6 chiffres
- [ ] Toast ne s'affiche pas après succès
- [ ] Section 2FA ne se met pas à jour après activation
- [ ] Loading infini lors de l'enrollment
- [ ] Bouton "Annuler" ne ferme pas le flow

### Backend / Supabase

- [ ] `mfa.enroll()` échoue avec erreur 500
- [ ] `mfa.challenge()` ne génère pas de challenge
- [ ] `mfa.verify()` accepte des codes invalides
- [ ] `mfa.unenroll()` ne désactive pas le facteur
- [ ] Codes de récupération non sauvegardés
- [ ] User peut bypass 2FA après activation

### Sécurité

- [ ] Secret TOTP visible dans logs/console
- [ ] QR Code reste en cache navigateur
- [ ] Code TOTP accepté plusieurs fois
- [ ] Pas de rate limiting sur vérification
- [ ] 2FA désactivable sans re-authentification

---

## 📊 CRITÈRES DE RÉUSSITE

### Critères Bloquants (MUST)

- ✅ Enrollment fonctionne sans erreur
- ✅ QR Code scanne correctement
- ✅ Code TOTP valide accepté
- ✅ Login avec 2FA fonctionne
- ✅ Désactivation possible
- ✅ Pas de bypass possible du 2FA

### Critères Importants (SHOULD)

- ✅ UX fluide (< 30s pour activer)
- ✅ Messages d'erreur clairs
- ✅ Loading states informatifs
- ✅ Codes de récupération disponibles
- ✅ Multi-devices supporté
- ✅ Rate limiting actif

### Critères Optionnels (NICE TO HAVE)

- ✅ Timer sur code TOTP
- ✅ Historique des logins 2FA
- ✅ Email notification activation 2FA
- ✅ Support SMS backup (optionnel)
- ✅ Trusted devices (skip 2FA 30 jours)

---

## 🚀 AUTOMATISATION TESTS

### Tests E2E avec Playwright

```typescript
// tests/2fa.spec.ts
import { test, expect } from '@playwright/test';

test.describe('2FA Flow', () => {
  test('should enable 2FA successfully', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@payhula.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Navigate to Security Settings
    await page.goto('/dashboard/settings?tab=security');
    
    // Click Enable 2FA
    await page.click('text=Activer le 2FA');
    
    // Wait for QR Code
    await expect(page.locator('img[alt="QR Code 2FA"]')).toBeVisible();
    
    // Verify secret is displayed
    await expect(page.locator('input[readonly]')).toHaveValue(/^[A-Z0-9]{32}$/);
  });
  
  test('should login with 2FA', async ({ page }) => {
    // TODO: Implement with TOTP library
  });
});
```

---

## 📞 SUPPORT

### En cas de problème

1. **Logs** : Vérifier console navigateur et logs Supabase
2. **Config** : Vérifier que Supabase MFA est activé dans le dashboard
3. **Dépendances** : `npm list qrcode @types/qrcode`
4. **Doc Supabase** : https://supabase.com/docs/guides/auth/auth-mfa

### Contact

- **GitHub Issues** : [payhuk02/payhula](https://github.com/payhuk02/payhula/issues)
- **Docs** : `SECURITE_AMELIORATIONS_APPLIQUEES.md`

---

**Guide créé le 28 Octobre 2025**  
**Version** : 1.0.0  
**Status** : Ready for Testing ✅

