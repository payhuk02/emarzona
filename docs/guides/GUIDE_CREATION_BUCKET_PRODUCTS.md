# Guide : Création du Bucket "products" dans Supabase Storage

## 🔴 Problème
L'erreur "Le bucket 'products' n'existe pas" apparaît lors de l'upload de fichiers.

## ✅ Solution : Exécuter la Migration SQL

### Option 1 : Via Supabase Dashboard (RECOMMANDÉ)

1. **Ouvrez votre projet Supabase**
   - Allez sur [https://supabase.com](https://supabase.com)
   - Connectez-vous et sélectionnez votre projet

2. **Accédez au SQL Editor**
   - Dans le menu de gauche, cliquez sur **"SQL Editor"**
   - Cliquez sur **"New query"** (Nouvelle requête)

3. **Copiez-collez la migration**
   - Ouvrez le fichier : `supabase/migrations/20250204_create_products_storage_bucket.sql`
   - Copiez **TOUT** le contenu du fichier
   - Collez-le dans l'éditeur SQL de Supabase

4. **Exécutez la migration**
   - Cliquez sur le bouton **"Run"** (ou appuyez sur `Ctrl+Enter`)
   - Attendez la confirmation "Success" en bas de l'écran

5. **Vérifiez que le bucket existe**
   - Allez dans **"Storage"** dans le menu de gauche
   - Vous devriez voir le bucket **"products"** dans la liste

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
   - **Name**: `products`
   - **Public bucket**: ✅ Activé (cochez la case)
   - **File size limit**: `524288000` (500 MB)
   - **Allowed MIME types**: Laissez vide ou ajoutez les types que vous voulez autoriser

4. Cliquez sur **"Create bucket"**

5. **Configurez les politiques RLS** :
   - Allez dans **"Storage"** > **"Policies"**
   - Créez les politiques suivantes pour le bucket "products" :

   **Politique 1 : Lecture publique**
   ```
   Name: Public can read product files
   Operation: SELECT
   Target roles: public
   USING expression: bucket_id = 'products'
   ```

   **Politique 2 : Upload pour utilisateurs authentifiés**
   ```
   Name: Authenticated users can upload
   Operation: INSERT
   Target roles: authenticated
   WITH CHECK expression: bucket_id = 'products' AND auth.role() = 'authenticated'
   ```

   **Politique 3 : Mise à jour pour utilisateurs authentifiés**
   ```
   Name: Authenticated users can update
   Operation: UPDATE
   Target roles: authenticated
   USING expression: bucket_id = 'products' AND auth.role() = 'authenticated'
   WITH CHECK expression: bucket_id = 'products' AND auth.role() = 'authenticated'
   ```

   **Politique 4 : Suppression pour utilisateurs authentifiés**
   ```
   Name: Authenticated users can delete
   Operation: DELETE
   Target roles: authenticated
   USING expression: bucket_id = 'products' AND auth.role() = 'authenticated'
   ```

## 🔍 Vérification

Après avoir créé le bucket :

1. **Rafraîchissez votre application** (F5)
2. **Essayez d'uploader un fichier** dans le formulaire de création de produit
3. L'erreur devrait disparaître

## 📝 Notes Importantes

- ⚠️ **La migration SQL est la méthode recommandée** car elle configure automatiquement toutes les politiques RLS
- ⚠️ **Si vous créez le bucket manuellement**, n'oubliez pas de créer les politiques RLS sinon les uploads échoueront
- ✅ **Le bucket est public** pour permettre l'accès aux fichiers de produits par les clients
- ✅ **La limite de taille est de 500 MB** par fichier

## 🆘 En cas de problème

Si l'erreur persiste après avoir créé le bucket :

1. Vérifiez dans Supabase Dashboard > Storage que le bucket "products" existe bien
2. Vérifiez que les politiques RLS sont bien configurées
3. Vérifiez les logs de la console du navigateur (F12) pour plus de détails
4. Assurez-vous que vous êtes bien connecté (authentifié) dans l'application

## 📧 Support

Si le problème persiste, vérifiez :
- Les logs dans la console du navigateur (F12 > Console)
- Les logs dans Supabase Dashboard > Logs
- Que votre clé API Supabase est correctement configurée dans `.env`

