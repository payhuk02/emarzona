# 🔐 GUIDE - Création des Politiques Storage (Dashboard)

**Date** : 27 octobre 2025  
**Durée** : 5 minutes

---

## 📋 ÉTAPE 1 : Créer le bucket via SQL

1. Aller sur https://supabase.com
2. Ouvrir votre projet : `your-project-id`
3. Menu **"SQL Editor"** → **"New query"**
4. Copier le contenu de `supabase/migrations/20251027_storage_videos_bucket_simple.sql`
5. Coller et **Exécuter** (Ctrl+Enter)
6. ✅ Vérifier le message : "Bucket videos créé avec succès"

---

## 🔐 ÉTAPE 2 : Créer les politiques via le Dashboard

### 1. Aller dans Storage
1. Dans le menu de gauche, cliquer sur **"Storage"**
2. Vous devriez voir le bucket **"videos"**
3. Cliquer sur **"videos"**
4. Cliquer sur l'onglet **"Policies"**

---

### 2. Politique 1 : Upload (INSERT)

**Nom** : `Authenticated users can upload videos`

1. Cliquer sur **"New Policy"**
2. Sélectionner **"For full customization"**
3. Remplir les champs :

```
Policy name: Authenticated users can upload videos
Allowed operation: INSERT
Target roles: authenticated

Policy definition for INSERT:
WITH CHECK (
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = 'course-videos'
)
```

4. Cliquer sur **"Review"** puis **"Save policy"**

---

### 3. Politique 2 : Lecture (SELECT)

**Nom** : `Anyone can view videos`

1. Cliquer sur **"New Policy"**
2. Sélectionner **"For full customization"**
3. Remplir les champs :

```
Policy name: Anyone can view videos
Allowed operation: SELECT
Target roles: public

Policy definition for SELECT:
USING (bucket_id = 'videos')
```

4. Cliquer sur **"Review"** puis **"Save policy"**

---

### 4. Politique 3 : Mise à jour (UPDATE)

**Nom** : `Users can update their own videos`

1. Cliquer sur **"New Policy"**
2. Sélectionner **"For full customization"**
3. Remplir les champs :

```
Policy name: Users can update their own videos
Allowed operation: UPDATE
Target roles: authenticated

Policy definition for UPDATE (USING):
USING (
  bucket_id = 'videos' AND
  owner = auth.uid()
)

Policy definition for UPDATE (WITH CHECK):
WITH CHECK (
  bucket_id = 'videos' AND
  owner = auth.uid()
)
```

4. Cliquer sur **"Review"** puis **"Save policy"**

---

### 5. Politique 4 : Suppression (DELETE)

**Nom** : `Users can delete their own videos`

1. Cliquer sur **"New Policy"**
2. Sélectionner **"For full customization"**
3. Remplir les champs :

```
Policy name: Users can delete their own videos
Allowed operation: DELETE
Target roles: authenticated

Policy definition for DELETE:
USING (
  bucket_id = 'videos' AND
  owner = auth.uid()
)
```

4. Cliquer sur **"Review"** puis **"Save policy"**

---

## ✅ VÉRIFICATION

Dans l'onglet **Policies** du bucket "videos", vous devriez voir **4 politiques** :

| Nom | Opération | Rôle |
|-----|-----------|------|
| Authenticated users can upload videos | INSERT | authenticated |
| Anyone can view videos | SELECT | public |
| Users can update their own videos | UPDATE | authenticated |
| Users can delete their own videos | DELETE | authenticated |

---

## 🧪 TEST RAPIDE

### Test 1 : Créer un dossier
1. Dans le bucket "videos", cliquer sur **"Create folder"**
2. Nom : `course-videos`
3. Cliquer sur **"Create"**

### Test 2 : Upload un fichier de test
1. Entrer dans le dossier `course-videos`
2. Cliquer sur **"Upload file"**
3. Sélectionner une petite vidéo (< 10 MB)
4. ✅ L'upload devrait fonctionner

### Test 3 : Récupérer l'URL
1. Cliquer sur le fichier uploadé
2. Copier l'URL publique
3. Ouvrir l'URL dans un nouvel onglet
4. ✅ La vidéo devrait se charger

---

## ❌ EN CAS DE PROBLÈME

### Problème : "New policy failed to save"
**Solution** : Vérifier que vous avez bien rempli tous les champs requis.

### Problème : "Policy already exists"
**Solution** : Supprimer l'ancienne politique d'abord, puis recréer.

### Problème : Upload échoue
**Solution** : 
1. Vérifier que l'utilisateur est bien connecté
2. Vérifier que le dossier est bien `course-videos`

---

## 📸 CAPTURES D'ÉCRAN (Aide visuelle)

### Création d'une politique
```
┌─────────────────────────────────────────┐
│  New Policy                             │
├─────────────────────────────────────────┤
│  Policy name: [___________________]     │
│  Allowed operation: [INSERT ▼]          │
│  Target roles: [authenticated ▼]        │
│                                         │
│  Policy definition:                     │
│  ┌───────────────────────────────────┐  │
│  │ WITH CHECK (                      │  │
│  │   bucket_id = 'videos' AND        │  │
│  │   ...                             │  │
│  │ )                                 │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [Review]  [Cancel]                     │
└─────────────────────────────────────────┘
```

---

## ✅ CHECKLIST FINALE

- [ ] Bucket "videos" créé via SQL
- [ ] Politique INSERT créée (upload)
- [ ] Politique SELECT créée (lecture)
- [ ] Politique UPDATE créée (modification)
- [ ] Politique DELETE créée (suppression)
- [ ] Dossier "course-videos" créé
- [ ] Test d'upload réussi
- [ ] URL publique fonctionne

---

**Une fois terminé, vous pouvez tester l'upload de vidéos dans votre application !** 🎉

---

**Développeur** : Intelli / payhuk02  
**Projet** : Payhuk SaaS Platform  
**Statut** : ✅ **GUIDE COMPLET**

