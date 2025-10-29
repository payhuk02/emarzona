# 🚀 TEST RAPIDE - IMPORT DE TEMPLATES

**Temps:** 2 minutes  
**Objectif:** Vérifier que l'import fonctionne comme Shopify

---

## ✅ MÉTHODE 1: Test avec Fichier Exemple (30 secondes)

### Étape 1: Démarrer l'app
```bash
npm run dev
```

### Étape 2: Ouvrir l'interface
```
http://localhost:5173/demo/templates-ui
```

### Étape 3: Aller sur l'onglet Import
1. Cliquer sur l'onglet **"Importer"**
2. Vous verrez 3 options : Fichier, URL, JSON

### Étape 4: Tester l'import par fichier
1. Télécharger le fichier de test : `public/templates/example-import.json`
2. Glisser-déposer le fichier dans la zone
3. ✅ **Succès !** Le template s'importe

**Résultat attendu:**
```
✅ Fichier validé
✅ Template importé
✅ Message "Import réussi !"
```

---

## ✅ MÉTHODE 2: Test avec JSON Direct (1 minute)

### Étape 1: Copier le JSON
Ouvrir `public/templates/example-import.json` et copier tout le contenu

### Étape 2: Aller sur "Par JSON"
1. Interface → Tab "Importer" → "Par JSON"
2. Coller le JSON
3. Cliquer "Importer JSON"

**Résultat attendu:**
```
✅ JSON parsé
✅ Validation réussie
✅ Template importé
✅ Affichage "Produit Test Import"
```

---

## ✅ MÉTHODE 3: Test avec URL (si serveur local)

### Étape 1: URL du template
```
http://localhost:5173/templates/example-import.json
```

### Étape 2: Importer
1. Tab "Importer" → "Par URL"
2. Coller l'URL
3. Cliquer "Importer depuis URL"

**Résultat attendu:**
```
✅ Download réussi
✅ Template validé
✅ Import OK
```

---

## 🎯 VÉRIFICATION VISUELLE

### Après import, vous devriez voir :

```
┌────────────────────────────────────────┐
│ ✅ Import réussi !                     │
│                                        │
│ Template: Produit Test Import          │
│ Catégorie: Digital                     │
│ Tier: Gratuit                          │
│                                        │
│ 1 template importé                     │
│ 0 erreurs                              │
│ 0 warnings                             │
│                                        │
│ [Utiliser ce template]                 │
└────────────────────────────────────────┘
```

---

## 🔍 TESTS ADDITIONNELS

### Test d'Erreur (validation)
1. Tab "Par JSON"
2. Coller: `{ "invalid": true }`
3. ✅ **Erreur affichée:** "Invalid template format"

### Test de Migration V1→V2
1. Importer un ancien template (v1)
2. ✅ **Warning:** "Template migrated from v1 to v2"
3. ✅ Template utilisable en v2

---

## 📊 CHECKLIST RAPIDE

- [ ] ✅ Import par fichier fonctionne
- [ ] ✅ Import par JSON fonctionne
- [ ] ✅ Import par URL fonctionne
- [ ] ✅ Drag & drop fonctionne
- [ ] ✅ Validation d'erreurs fonctionne
- [ ] ✅ Messages de succès affichés
- [ ] ✅ Template importé visible

---

## 🎉 RÉSULTAT

Si tous les tests passent :

```
╔══════════════════════════════════════╗
║  ✅ SYSTÈME D'IMPORT FONCTIONNEL    ║
║                                      ║
║  Niveau: Shopify-grade              ║
║  Status: Production Ready            ║
║  Compatibilité: 100%                 ║
╚══════════════════════════════════════╝
```

---

## 🐛 EN CAS DE PROBLÈME

### Erreur "File not found"
→ Vérifier que `public/templates/example-import.json` existe

### Erreur "Invalid JSON"
→ Vérifier que le JSON est bien formé (pas de virgule finale)

### Import ne se déclenche pas
→ Vérifier la console navigateur (F12)

### Template non visible
→ Rafraîchir la page (F5)

---

## 📝 COMMANDES UTILES

```bash
# Vérifier que tout compile
npm run build

# Vérifier les erreurs
npm run lint

# Lancer en dev
npm run dev
```

---

**Temps total:** ~2 minutes  
**Complexité:** Très simple  
**Résultat:** ✅ Import fonctionnel comme Shopify !

**Prêt à tester ? GO ! 🚀**

