# 🔧 CORRECTION DU FORMAT DSN SENTRY

## Problème identifié

Le DSN Sentry actuel est au format invalide :
```
https://41fb924c28b3e18f148e62de87b9b2efe6c451826194294744.ingest.de.sentry.io/4518261989488848
```

Il manque le séparateur `@` entre la clé et l'hôte.

## Format correct

Le DSN Sentry doit être au format :
```
https://<key>@<host>/<project_id>
```

Exemple valide :
```
https://abc123def456@o123456.ingest.sentry.io/7891011
```

## Solution

### Étape 1 : Obtenir le DSN correct

1. Connectez-vous à [Sentry Dashboard](https://sentry.io)
2. Allez dans **Settings** > **Projects** > **[Votre Projet]**
3. Cliquez sur **Client Keys (DSN)**
4. Copiez le DSN complet (il devrait contenir un `@`)

### Étape 2 : Mettre à jour la variable d'environnement

**En développement** (`.env.local`) :
```env
VITE_SENTRY_DSN=https://<votre-key-complet>@<host>/<project_id>
```

**En production** (Vercel Environment Variables) :
1. Allez dans Vercel Dashboard > Your Project > Settings > Environment Variables
2. Trouvez `VITE_SENTRY_DSN`
3. Mettez à jour avec le DSN correct
4. Redéployez l'application

### Étape 3 : Vérifier la configuration

Après redémarrage, vérifiez la console :
- ❌ Avant : `[WARN] Sentry DSN format suspect`
- ✅ Après : `[INFO] Sentry initialisé avec succès`

## Format DSN décomposé

Un DSN Sentry valide contient 3 parties :

1. **Protocole** : `https://`
2. **Clé publique** : Une chaîne alphanumérique (ex: `abc123def456`)
3. **Séparateur** : `@`
4. **Hôte Sentry** : (ex: `o123456.ingest.sentry.io`)
5. **Project ID** : (ex: `/7891011`)

## Exemple de DSN complet

```
https://abc123def456ghi789jkl012mno345@o123456.ingest.sentry.io/7891011
└─────┬─────┘└─────────┬──────────┘└───────┬────────┘└───┬───┘
   Clé publique       Hôte             Project ID
```

## Vérification

Une fois corrigé, vous devriez voir dans les logs :
```
[INFO] Sentry initialisé avec succès {environment: 'development', ...}
```

Et plus d'erreur :
```
[ERROR] Invalid Sentry Dsn: ...
```

---

**Date** : 8 Décembre 2025  
**Fichier concerné** : `.env.local` ou Variables Vercel  
**Validation** : `src/lib/sentry.ts`

