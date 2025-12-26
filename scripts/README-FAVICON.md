# 🎨 Scripts de Génération de Favicon

Scripts pour générer automatiquement le favicon à partir du logo Emarzona.

---

## 📋 Scripts Disponibles

### 1. `generate-favicon.js` - Script Complet (Recommandé)

**Description** : Génère un favicon optimisé avec plusieurs tailles et formats.

**Prérequis** :

```bash
npm install sharp
```

**Utilisation** :

```bash
# Via npm script
npm run favicon:generate

# OU directement
node scripts/generate-favicon.js
```

**Génère** :

- ✅ `favicon.ico` (32x32px)
- ✅ `favicon-32x32.png`
- ✅ `favicon-16x16.png`
- ✅ `apple-touch-icon.png` (180x180px)

**Avantages** :

- Optimisation automatique des tailles
- Préservation de la transparence
- Qualité professionnelle
- Support multi-plateformes

---

### 2. `generate-favicon-simple.js` - Script Simple

**Description** : Génère un favicon rapidement sans dépendances externes.

**Prérequis** : Aucun (utilise uniquement Node.js natif)

**Utilisation** :

```bash
# Via npm script
npm run favicon:generate:simple

# OU directement
node scripts/generate-favicon-simple.js
```

**Génère** :

- ✅ `favicon.ico` (copie du logo)
- ✅ `favicon.png` (copie du logo)

**Avantages** :

- Rapide
- Aucune dépendance
- Simple à utiliser

**Limitations** :

- Pas d'optimisation des tailles
- Une seule taille générée
- Pour un vrai ICO optimisé, utilisez le script complet ou un outil en ligne

---

## 🚀 Utilisation Rapide

### Étape 1 : Placer le Logo

Placez votre logo dans `public/emarzona-logo.png` :

- Taille recommandée : 512x512px
- Format : PNG avec transparence

### Étape 2 : Générer le Favicon

**Option A - Script Complet (Recommandé)** :

```bash
npm install sharp
npm run favicon:generate
```

**Option B - Script Simple (Rapide)** :

```bash
npm run favicon:generate:simple
```

### Étape 3 : Vérifier

1. Redémarrez le serveur : `npm run dev`
2. Videz le cache du navigateur
3. Vérifiez l'onglet du navigateur (favicon)
4. Vérifiez le header de l'application (logo)

---

## 📝 Notes Techniques

- Le logo source doit être dans `public/emarzona-logo.png`
- Les fichiers générés sont placés dans `public/`
- Le script complet nécessite `sharp` pour l'optimisation d'images
- Le script simple utilise uniquement Node.js natif (fs)

---

## 🔧 Dépannage

### Erreur : "sharp not found"

```bash
npm install sharp
```

### Erreur : "emarzona-logo.png not found"

- Vérifiez que le fichier existe dans `public/emarzona-logo.png`
- Vérifiez l'orthographe du nom de fichier

### Le favicon ne s'affiche pas

1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Redémarrez le serveur de développement
3. Vérifiez que les fichiers sont bien dans `public/`

---

## 💡 Alternative : Outils en Ligne

Si les scripts ne fonctionnent pas, utilisez :

- [favicon.io](https://favicon.io/favicon-converter/) - Simple et rapide
- [realfavicongenerator.net](https://realfavicongenerator.net) - Avancé, multi-plateformes
