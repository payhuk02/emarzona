# 🔍 Diagnostic : Images non affichées dans les messages

## Problème identifié

Les images dans les messages ne s'affichent pas. Les logs montrent que :

- ✅ Les URLs signées sont générées avec succès
- ❌ Mais les URLs publiques et signées échouent toutes à charger

## Causes possibles

### 1. Fichiers absents du bucket

Les fichiers peuvent ne pas exister dans le bucket Supabase.

**Vérification :**

1. Allez dans **Supabase Dashboard** > **Storage** > **Buckets** > **attachments**
2. Naviguez dans le dossier `vendor-message-attachments/`
3. Vérifiez que les fichiers existent (ex: `1765207968982-y0xu1n9lneq.png`)

### 2. Permissions RLS insuffisantes

Les politiques RLS peuvent bloquer l'accès même avec les URLs signées.

**Vérification :**

1. Allez dans **Supabase Dashboard** > **Storage** > **Policies**
2. Vérifiez que la politique **"Anyone can view attachments"** (SELECT) existe et est active
3. Vérifiez que le bucket **"attachments"** est marqué comme **Public**

### 3. Bucket non public

Le bucket doit être public pour que les URLs publiques fonctionnent.

**Vérification :**

1. Allez dans **Supabase Dashboard** > **Storage** > **Buckets**
2. Cliquez sur le bucket **"attachments"**
3. Vérifiez que l'option **"Public bucket"** est activée

## Script de diagnostic

Exécutez ce script dans la console du navigateur pour diagnostiquer le problème :

```javascript
// Diagnostic des images dans les messages
async function diagnosticImages() {
  const { createClient } =
    await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Variables d'environnement Supabase non configurées");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Vérifier que le bucket existe
  console.log('🔍 1. Vérification du bucket "attachments"...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Erreur lors de la vérification des buckets:', bucketsError);
    return;
  }

  const attachmentsBucket = buckets?.find(b => b.id === 'attachments');
  if (!attachmentsBucket) {
    console.error('❌ Le bucket "attachments" n\'existe pas');
    console.log('💡 Solution: Créez le bucket dans Supabase Dashboard > Storage > New bucket');
    return;
  }

  console.log('✅ Bucket "attachments" trouvé');
  console.log('   - Public:', attachmentsBucket.public);
  console.log('   - File size limit:', attachmentsBucket.file_size_limit);

  if (!attachmentsBucket.public) {
    console.warn("⚠️ Le bucket n'est pas public. Les URLs publiques ne fonctionneront pas.");
  }

  // 2. Vérifier les fichiers dans vendor-message-attachments
  console.log('\n🔍 2. Vérification des fichiers dans "vendor-message-attachments"...');
  const { data: files, error: filesError } = await supabase.storage
    .from('attachments')
    .list('vendor-message-attachments', {
      limit: 100,
    });

  if (filesError) {
    console.error('❌ Erreur lors de la liste des fichiers:', filesError);
    console.log('💡 Cela peut indiquer un problème de permissions RLS');
    return;
  }

  if (!files || files.length === 0) {
    console.warn('⚠️ Aucun fichier trouvé dans "vendor-message-attachments"');
    console.log('💡 Les fichiers peuvent ne pas avoir été uploadés correctement');
    return;
  }

  console.log(`✅ ${files.length} fichier(s) trouvé(s)`);
  files.slice(0, 5).forEach(file => {
    console.log(`   - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
  });

  // 3. Tester l'accès à un fichier
  if (files.length > 0) {
    const testFile = files[0];
    const testPath = `vendor-message-attachments/${testFile.name}`;

    console.log(`\n🔍 3. Test d'accès au fichier "${testFile.name}"...`);

    // Test URL publique
    const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(testPath);

    console.log('   URL publique:', publicUrlData?.publicUrl);

    try {
      const publicResponse = await fetch(publicUrlData?.publicUrl || '');
      console.log(`   ✅ URL publique: ${publicResponse.status} ${publicResponse.statusText}`);
      if (!publicResponse.ok) {
        console.error(`   ❌ L'URL publique retourne une erreur ${publicResponse.status}`);
      }
    } catch (error) {
      console.error("   ❌ Erreur lors du test de l'URL publique:", error);
    }

    // Test URL signée
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('attachments')
      .createSignedUrl(testPath, 3600);

    if (signedError) {
      console.error("   ❌ Erreur lors de la génération de l'URL signée:", signedError);
    } else {
      console.log('   URL signée générée:', signedUrlData?.signedUrl?.substring(0, 100) + '...');

      try {
        const signedResponse = await fetch(signedUrlData?.signedUrl || '');
        console.log(`   ✅ URL signée: ${signedResponse.status} ${signedResponse.statusText}`);
        if (!signedResponse.ok) {
          console.error(`   ❌ L'URL signée retourne une erreur ${signedResponse.status}`);
        }
      } catch (error) {
        console.error("   ❌ Erreur lors du test de l'URL signée:", error);
      }
    }
  }

  // 4. Vérifier les politiques RLS
  console.log('\n🔍 4. Vérification des politiques RLS...');
  console.log('💡 Allez dans Supabase Dashboard > Storage > Policies pour vérifier les politiques');
  console.log('   La politique "Anyone can view attachments" (SELECT) doit être active');
}

// Exécuter le diagnostic
diagnosticImages();
```

## Solutions

### Solution 1 : Vérifier et corriger les permissions RLS

Exécutez cette migration SQL dans Supabase Dashboard > SQL Editor :

```sql
-- Vérifier que le bucket est public
UPDATE storage.buckets
SET public = true
WHERE id = 'attachments';

-- Vérifier que la politique de lecture existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects'
    AND policyname = 'Anyone can view attachments'
  ) THEN
    CREATE POLICY "Anyone can view attachments"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'attachments');
  END IF;
END $$;
```

### Solution 2 : Réuploader les fichiers

Si les fichiers n'existent pas :

1. Supprimez les anciens messages avec pièces jointes
2. Réenvoyez les images dans de nouveaux messages
3. Vérifiez que les uploads réussissent dans les logs

### Solution 3 : Vérifier la configuration du bucket

1. Allez dans **Supabase Dashboard** > **Storage** > **Buckets** > **attachments**
2. Vérifiez que :
   - ✅ **Public bucket** est activé
   - ✅ **File size limit** est suffisant (10 MB recommandé)
   - ✅ Les **Allowed MIME types** incluent les types d'images

## Logs à surveiller

Dans la console du navigateur, surveillez ces messages :

- `[INFO] File existence check` - Vérifie si les fichiers existent
- `[INFO] Generated signed URL` - Génération d'URL signée réussie
- `[WARN] MediaAttachment - Signed URL also failed` - Échec de chargement même avec URL signée
- `[ERROR] File does not exist in bucket` - Fichier introuvable
