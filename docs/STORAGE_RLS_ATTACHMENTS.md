# 🔒 Documentation RLS Storage - Bucket `attachments`

**Date**: 1 Février 2025  
**Bucket**: `attachments`  
**Usage**: Stockage des fichiers attachés aux messages (Order Messaging, Vendor Messaging, Shipping Service Messaging)

---

## 📋 Vue d'Ensemble

Le bucket `attachments` stocke tous les fichiers uploadés dans le système de messaging :
- Images (JPG, PNG, GIF, WEBP)
- Vidéos (MP4, WEBM)
- Documents (PDF, DOC, DOCX, etc.)

**Structure des dossiers**:
```
attachments/
├── message-attachments/
│   └── {orderId}/
│       └── {timestamp}-{random}.{ext}
├── vendor-message-attachments/
│   └── {timestamp}-{random}.{ext}
└── shipping-service-attachments/
    └── {timestamp}-{random}.{ext}
```

---

## 🔐 Politiques RLS Requises

### 1. Lecture Publique (SELECT)

**Nécessaire pour**: Afficher les fichiers via `getPublicUrl()`

```sql
-- Politique: Anyone can view attachments (lecture publique)
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');
```

**⚠️ Alternative sécurisée** (si vous ne voulez pas de lecture publique):
```sql
-- Politique: Participants can view their attachments
CREATE POLICY "Participants can view their attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'attachments'
  AND (
    -- Vérifier si l'utilisateur est participant à une conversation
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.message_attachments ma ON ma.message_id = m.id
      WHERE ma.storage_path = (storage.objects.name)
      AND (
        m.sender_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = m.conversation_id
          AND (c.customer_user_id = auth.uid() OR c.store_user_id = auth.uid())
        )
      )
    )
    -- Même logique pour vendor_messages
    OR EXISTS (
      SELECT 1 FROM public.vendor_messages vm
      JOIN public.vendor_message_attachments vma ON vma.message_id = vm.id
      WHERE vma.storage_path = (storage.objects.name)
      AND EXISTS (
        SELECT 1 FROM public.vendor_conversations vc
        WHERE vc.id = vm.conversation_id
        AND (vc.customer_user_id = auth.uid() OR vc.store_user_id = auth.uid())
      )
    )
    -- Même logique pour shipping_service_messages
    OR EXISTS (
      SELECT 1 FROM public.shipping_service_messages ssm
      JOIN public.shipping_service_message_attachments ssma ON ssma.message_id = ssm.id
      WHERE ssma.storage_path = (storage.objects.name)
      AND EXISTS (
        SELECT 1 FROM public.shipping_service_conversations ssc
        WHERE ssc.id = ssm.conversation_id
        AND ssc.store_user_id = auth.uid()
      )
    )
    -- Admins peuvent tout voir
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
```

---

### 2. Upload Authentifié (INSERT)

**Nécessaire pour**: Permettre aux utilisateurs authentifiés d'uploader des fichiers

```sql
-- Politique: Authenticated users can upload attachments
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
  AND (
    -- Vérifier que le chemin correspond à un dossier autorisé
    (storage.objects.name).text LIKE 'message-attachments/%'
    OR (storage.objects.name).text LIKE 'vendor-message-attachments/%'
    OR (storage.objects.name).text LIKE 'shipping-service-attachments/%'
  )
);
```

---

### 3. Mise à Jour (UPDATE)

**Nécessaire pour**: Permettre la mise à jour des métadonnées (optionnel)

```sql
-- Politique: Users can update their own attachments
CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments'
  AND (
    -- Vérifier que l'utilisateur est le propriétaire via les messages
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.message_attachments ma ON ma.message_id = m.id
      WHERE ma.storage_path = (storage.objects.name)
      AND m.sender_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.vendor_messages vm
      JOIN public.vendor_message_attachments vma ON vma.message_id = vm.id
      WHERE vma.storage_path = (storage.objects.name)
      AND vm.sender_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.shipping_service_messages ssm
      JOIN public.shipping_service_message_attachments ssma ON ssma.message_id = ssm.id
      WHERE ssma.storage_path = (storage.objects.name)
      AND ssm.sender_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
```

---

### 4. Suppression (DELETE)

**Nécessaire pour**: Permettre la suppression des fichiers (optionnel, pour nettoyage)

```sql
-- Politique: Users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND (
    -- Même logique que UPDATE
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.message_attachments ma ON ma.message_id = m.id
      WHERE ma.storage_path = (storage.objects.name)
      AND m.sender_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
);
```

---

## 🚀 Migration SQL Complète

```sql
-- =====================================================
-- RLS Policies pour le bucket 'attachments'
-- Date: 1 Février 2025
-- =====================================================

-- Activer RLS sur le bucket (si pas déjà fait)
UPDATE storage.buckets
SET public = true -- Ou false selon votre préférence de sécurité
WHERE id = 'attachments';

-- Supprimer les politiques existantes (si elles existent)
DROP POLICY IF EXISTS "Anyone can view attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

-- 1. Lecture publique (ou sécurisée selon votre choix)
-- Option A: Lecture publique (plus simple, moins sécurisé)
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

-- Option B: Lecture sécurisée (recommandé pour production)
-- Utiliser la politique complexe ci-dessus avec vérification des conversations

-- 2. Upload authentifié
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments'
  AND auth.uid() IS NOT NULL
  AND (
    (storage.objects.name).text LIKE 'message-attachments/%'
    OR (storage.objects.name).text LIKE 'vendor-message-attachments/%'
    OR (storage.objects.name).text LIKE 'shipping-service-attachments/%'
  )
);

-- 3. Mise à jour (optionnel)
CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.message_attachments ma ON ma.message_id = m.id
    WHERE ma.storage_path = (storage.objects.name)
    AND m.sender_id = auth.uid()
  )
);

-- 4. Suppression (optionnel)
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.message_attachments ma ON ma.message_id = m.id
    WHERE ma.storage_path = (storage.objects.name)
    AND m.sender_id = auth.uid()
  )
);
```

---

## ✅ Vérification

### Tester les Politiques

1. **Test de lecture**:
```sql
-- Devrait retourner les fichiers si la politique SELECT fonctionne
SELECT * FROM storage.objects
WHERE bucket_id = 'attachments'
LIMIT 10;
```

2. **Test d'upload** (depuis le client):
```typescript
const { data, error } = await supabase.storage
  .from('attachments')
  .upload('test/test.txt', new Blob(['test']));

if (error) {
  console.error('Upload failed:', error);
} else {
  console.log('Upload successful:', data);
}
```

3. **Test de lecture publique**:
```typescript
const { data } = supabase.storage
  .from('attachments')
  .getPublicUrl('test/test.txt');

console.log('Public URL:', data.publicUrl);
// Tester l'URL dans le navigateur
```

---

## 🔍 Dépannage

### Problème: "403 Forbidden" lors de la lecture

**Causes possibles**:
1. Politique SELECT manquante ou incorrecte
2. Bucket non public alors que `getPublicUrl()` est utilisé
3. Chemin de fichier incorrect

**Solutions**:
1. Vérifier que la politique SELECT existe
2. Vérifier `storage.buckets.public = true` si vous utilisez `getPublicUrl()`
3. Vérifier le chemin dans `storage_path` de la table `*_message_attachments`

---

### Problème: "403 Forbidden" lors de l'upload

**Causes possibles**:
1. Politique INSERT manquante ou incorrecte
2. Utilisateur non authentifié
3. Chemin ne correspond pas aux patterns autorisés

**Solutions**:
1. Vérifier que la politique INSERT existe
2. Vérifier que `auth.uid()` n'est pas NULL
3. Vérifier que le chemin commence par un des patterns autorisés

---

## 📝 Notes Importantes

1. **Sécurité**: Pour la production, utilisez la politique SELECT sécurisée plutôt que la lecture publique
2. **Performance**: Les politiques complexes peuvent impacter les performances. Tester avec des volumes réels
3. **Nettoyage**: Implémenter un système de nettoyage automatique pour les fichiers orphelins
4. **Limites**: Supabase Storage a des limites de taille par fichier (défaut: 50MB, configurable)

---

**Dernière mise à jour**: 1 Février 2025

