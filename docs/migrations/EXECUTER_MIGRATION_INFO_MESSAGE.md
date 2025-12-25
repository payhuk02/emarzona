# 📋 Guide d'exécution de la migration - Message informatif

## 🎯 Objectif

Ajouter les colonnes nécessaires pour le message informatif de la boutique :
- `info_message` : Le texte du message
- `info_message_color` : La couleur du message (format hex)
- `info_message_font` : La police du message

## ✅ Solution à l'erreur "Too Many Requests"

Si vous rencontrez l'erreur "Too Many Requests" dans Supabase :

### Option 1 : Attendre quelques minutes
- Attendez 2-3 minutes avant de réessayer
- L'erreur est due à trop de requêtes en peu de temps

### Option 2 : Exécuter le script SQL combiné
1. Ouvrez l'éditeur SQL dans Supabase
2. Copiez-collez le contenu de `supabase/migrations/20250205_add_info_message_complete.sql`
3. Cliquez sur "Run" (ou Ctrl+Enter)
4. Vérifiez que les colonnes ont été créées

## 📝 Script SQL à exécuter

```sql
-- Migration complète pour le message informatif de la boutique

-- 1. Ajouter la colonne info_message
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message TEXT;

COMMENT ON COLUMN public.stores.info_message IS 'Message informatif optionnel à afficher au-dessus de la bannière de la boutique (promotions, alertes, annonces, etc.)';

-- 2. Ajouter les colonnes de style (couleur et police)
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message_color TEXT DEFAULT '#3b82f6';

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS info_message_font TEXT DEFAULT 'Inter';

COMMENT ON COLUMN public.stores.info_message_color IS 'Couleur du message informatif (format hex: #RRGGBB)';
COMMENT ON COLUMN public.stores.info_message_font IS 'Police du message informatif (nom de la police CSS)';
```

## 🔍 Vérification

Après exécution, vérifiez que les colonnes existent :

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'stores'
  AND column_name IN ('info_message', 'info_message_color', 'info_message_font');
```

Vous devriez voir 3 lignes avec les colonnes créées.

## ⚠️ Note importante

Le code frontend utilise déjà des valeurs par défaut, donc même si les colonnes n'existent pas encore :
- La couleur par défaut sera `#3b82f6` (bleu)
- La police par défaut sera `Inter`

Mais pour que le message s'affiche, il faut :
1. ✅ Exécuter la migration SQL
2. ✅ Ajouter un message dans les paramètres de la boutique
3. ✅ Le message s'affichera automatiquement en haut de la boutique

## 🚀 Après l'exécution

1. Allez dans les paramètres de votre boutique
2. Remplissez le champ "Message informatif"
3. Optionnellement, choisissez une couleur et une police
4. Sauvegardez
5. Visitez votre boutique publique - le message devrait s'afficher en haut !

