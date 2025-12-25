# ✅ Vérification Post-Migration - Bucket "attachments"

## 📋 ÉTAT ACTUEL

D'après l'image Supabase SQL Editor, les **politiques RLS sont créées** ✅ :

1. ✅ "Anyone can view attachments" (SELECT) - {public}
2. ✅ "Authenticated users can upload attachments" (INSERT) - {authenticated}
3. ✅ "Users can update their own attachments" (UPDATE) - {authenticated}
4. ✅ "Users can delete their own attachments" (DELETE) - {authenticated}

---

## 🔍 VÉRIFICATIONS À EFFECTUER

### 1. Vérifier que le Bucket Existe

1. Dans Supabase Dashboard, allez dans **Storage** > **Buckets**
2. Vérifiez que **"attachments"** apparaît dans la liste
3. Si le bucket n'existe pas, la migration n'a peut-être pas créé le bucket (seulement les politiques)

### 2. Vérifier que le Bucket est PUBLIC

1. Cliquez sur le bucket **"attachments"**
2. Vérifiez que **"Public bucket"** est **COCHÉ** ✅
3. Si ce n'est pas le cas, cochez-le et cliquez sur **Save**

### 3. Vérifier les Politiques RLS

Les politiques sont visibles dans l'image, donc elles existent ✅

---

## 🚨 SI LE BUCKET N'EXISTE PAS

Si le bucket n'apparaît pas dans **Storage** > **Buckets**, exécutez cette requête SQL dans Supabase SQL Editor :

```sql
-- Créer le bucket manuellement
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  true, -- PUBLIC
  10485760, -- 10MB
  NULL -- Pas de restrictions MIME
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  allowed_mime_types = NULL;
```

---

## ✅ TEST FINAL

Après vérification :

1. **Attendez 2-3 minutes** (propagation Supabase)
2. **Rechargez l'application** (F5)
3. **Testez l'upload d'une image** dans un message
4. **Vérifiez que l'image s'affiche** correctement

---

## 📊 CHECKLIST COMPLÈTE

- [ ] Bucket "attachments" existe dans Storage > Buckets
- [ ] Bucket "attachments" est marqué comme PUBLIC
- [ ] Politique "Anyone can view attachments" existe (SELECT)
- [ ] Politique "Authenticated users can upload attachments" existe (INSERT)
- [ ] Politique "Users can update their own attachments" existe (UPDATE)
- [ ] Politique "Users can delete their own attachments" existe (DELETE)
- [ ] Attendu 2-3 minutes après création
- [ ] Application rechargée (F5)
- [ ] Test d'upload d'image réussi
- [ ] Image affichée correctement dans les messages

---

## 🎯 RÉSULTAT ATTENDU

Une fois tout vérifié et configuré :

- ✅ Plus d'erreur "File uploaded as JSON instead of image"
- ✅ Upload de fichiers fonctionnel
- ✅ Affichage des images correct
- ✅ Système de messaging opérationnel

---

**Date**: 1 Février 2025
