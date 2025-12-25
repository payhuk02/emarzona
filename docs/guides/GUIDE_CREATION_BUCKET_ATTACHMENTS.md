# Guide : Création du Bucket "attachments" dans Supabase Storage

## 🔴 Problème
L'erreur **"Bucket not found"** apparaît lors de l'envoi d'images ou de fichiers dans la messagerie.

## ✅ Solution : Exécuter la Migration SQL

### Option 1 : Via Supabase Dashboard (RECOMMANDÉ)

1. **Ouvrez votre projet Supabase**
   - Allez sur [https://supabase.com](https://supabase.com)
   - Connectez-vous et sélectionnez votre projet

2. **Accédez au SQL Editor**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"** (Nouvelle requête)

3. **Copiez-collez la migration**
   - Ouvrez le fichier : `supabase/migrations/20250230_create_attachments_storage_bucket.sql`
   - Copiez **TOUT** le contenu du fichier
   - Collez-le dans l'éditeur SQL de Supabase

4. **Exécutez la migration**
   - Cliquez sur le bouton **"Run"** (ou appuyez sur `Ctrl+Enter`)
   - Attendez la confirmation "Success" en bas de l'écran

5. **Vérifiez que le bucket existe**
   - Allez dans **"Storage"** dans le menu de gauche
   - Vous devriez voir le bucket **"attachments"** dans la liste

### Option 2 : Via Supabase CLI

Si vous avez installé Supabase CLI :

```bash
# Dans le terminal, à la racine du projet
supabase db push
```

### Option 3 : Création Manuelle via Dashboard

Si les migrations ne fonctionnent pas :

1. Allez dans **"Storage"** dans le menu Supabase
2. Cliquez sur **"New bucket"** (Nouveau bucket)
3. Configurez le bucket :
   - **Name**: `attachments`
   - **Public bucket**: ✅ Activé (cochez la case)
   - **File size limit**: `10485760` (10 MB)
   - **Allowed MIME types**: Laissez vide ou ajoutez les types que vous voulez autoriser

4. Cliquez sur **"Create bucket"**

5. **Configurez les politiques RLS** :
   - Allez dans **"Storage"** > **"Policies"**
   - Créez les politiques suivantes pour le bucket "attachments" :

   **Politique 1 : Lecture publique**
   ```
   Name: Anyone can view attachments
   Policy: SELECT
   Target roles: public
   USING expression: bucket_id = 'attachments'
   ```

   **Politique 2 : Upload pour utilisateurs authentifiés**
   ```
   Name: Authenticated users can upload attachments
   Policy: INSERT
   Target roles: authenticated
   WITH CHECK expression: bucket_id = 'attachments' AND auth.role() = 'authenticated'
   ```

   **Politique 3 : Mise à jour pour utilisateurs authentifiés**
   ```
   Name: Users can update their own attachments
   Policy: UPDATE
   Target roles: authenticated
   USING expression: bucket_id = 'attachments' AND auth.role() = 'authenticated'
   WITH CHECK expression: bucket_id = 'attachments' AND auth.role() = 'authenticated'
   ```

   **Politique 4 : Suppression pour utilisateurs authentifiés**
   ```
   Name: Users can delete their own attachments
   Policy: DELETE
   Target roles: authenticated
   USING expression: bucket_id = 'attachments' AND auth.role() = 'authenticated'
   ```

## 📋 Types de fichiers autorisés

Le bucket accepte les types suivants :
- **Images** : JPEG, JPG, PNG, GIF, WebP, SVG
- **Vidéos** : MP4, MPEG, QuickTime, AVI, WebM, OGG
- **Documents** : PDF, Word, Excel, PowerPoint
- **Archives** : ZIP, RAR
- **Texte** : TXT, CSV, Markdown
- **Autres** : JSON, XML

## 🔒 Sécurité

- Le bucket est **public** pour la lecture (tout le monde peut voir les fichiers)
- Seuls les **utilisateurs authentifiés** peuvent uploader, modifier ou supprimer des fichiers
- Taille maximale par fichier : **10 MB**

## ✅ Vérification

Après avoir créé le bucket, testez l'envoi d'une image dans la messagerie :
1. Allez sur la page de messagerie (`/vendor/messaging`)
2. Sélectionnez une conversation
3. Cliquez sur l'icône de pièce jointe
4. Sélectionnez une image
5. Envoyez le message

L'erreur "Bucket not found" ne devrait plus apparaître.

## 🐛 Dépannage

Si l'erreur persiste après avoir créé le bucket :

1. **Vérifiez que le bucket existe** :
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'attachments';
   ```

2. **Vérifiez les politiques RLS** :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%attachments%';
   ```

3. **Vérifiez les permissions** :
   - Assurez-vous d'être connecté en tant qu'utilisateur authentifié
   - Vérifiez que votre token d'authentification est valide

4. **Vérifiez la console du navigateur** :
   - Ouvrez les outils de développement (F12)
   - Allez dans l'onglet "Console"
   - Regardez les erreurs détaillées

## 📝 Notes

- Les fichiers sont stockés dans le dossier `vendor-message-attachments/` ou `message-attachments/` selon le contexte
- Les URLs des fichiers sont publiques et accessibles sans authentification
- Pour plus de sécurité, vous pouvez modifier les politiques RLS pour restreindre l'accès aux fichiers selon vos besoins

