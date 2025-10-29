# 📐 FORMAT D'IMAGES 1280x720 - RÉSUMÉ

**Status:** ✅ Configuré et prêt à l'emploi

---

## 🎯 FORMAT STANDARD PAYHUK

```
┌─────────────────────────────────┐
│                                 │
│      1280 x 720 pixels          │
│      Ratio 16:9                 │
│      Max 5MB                    │
│      JPEG, PNG, WebP            │
│                                 │
└─────────────────────────────────┘
```

---

## ✅ CE QUI A ÉTÉ CRÉÉ

### 1. Configuration TypeScript
**Fichier:** `src/config/image-formats.ts`

```typescript
import { IMAGE_FORMATS } from '@/config/image-formats';

// Format principal
IMAGE_FORMATS.product
// → { width: 1280, height: 720, aspectRatio: '16:9' }
```

**Fonctions disponibles:**
- `isValidProductImageSize()` - Valider dimensions
- `hasCorrectAspectRatio()` - Vérifier ratio 16:9
- `getRecommendedDimensions()` - Obtenir dimensions
- `calculateDimensions()` - Calculer redimensionnement

---

### 2. Composant de Validation
**Fichier:** `src/components/ui/image-upload-helper.tsx`

**Composants React:**
```tsx
// Afficher les requis
<ImageRequirements format="product" />

// Afficher résultat validation
<ImageValidationDisplay result={validationResult} />

// Afficher specs rapide
<ImageSpecsQuick />
```

**Fonction de validation:**
```typescript
import { validateImage } from '@/components/ui/image-upload-helper';

const result = await validateImage(file, 'product');
// → { isValid: true/false, errors: [], warnings: [] }
```

---

### 3. Guide Complet
**Fichier:** `IMAGE_FORMAT_GUIDE.md`

Contient:
- ✅ Tous les formats d'images
- ✅ Bonnes pratiques
- ✅ Outils recommandés
- ✅ Checklist avant upload
- ✅ Exemples par type de produit
- ✅ Conseils d'optimisation

---

## 🚀 UTILISATION

### Dans un Formulaire de Produit

```tsx
import { 
  ImageRequirements, 
  validateImage,
  ImageValidationDisplay 
} from '@/components/ui/image-upload-helper';

function ProductForm() {
  const [validation, setValidation] = useState(null);

  const handleImageUpload = async (file: File) => {
    const result = await validateImage(file, 'product');
    setValidation(result);
    
    if (result.isValid) {
      // Upload l'image
    }
  };

  return (
    <div>
      <ImageRequirements format="product" />
      <input type="file" onChange={e => handleImageUpload(e.target.files[0])} />
      {validation && <ImageValidationDisplay result={validation} />}
    </div>
  );
}
```

---

## 📊 FORMATS DISPONIBLES

| Format | Dimensions | Usage |
|--------|------------|-------|
| **product** | 1280x720 | Image principale produit ⭐ |
| thumbnail | 640x360 | Miniatures |
| productLarge | 1920x1080 | Zoom haute résolution |
| gallery | 1280x720 | Images galerie |
| ogImage | 1200x630 | Réseaux sociaux |
| square | 500x500 | Avatars, icônes |

---

## ✅ VALIDATION AUTOMATIQUE

### Vérifications Effectuées
```
✓ Format de fichier (JPEG, PNG, WebP)
✓ Taille du fichier (< 5MB)
✓ Dimensions exactes (1280x720)
✓ Ratio d'aspect (16:9)
✓ Qualité d'image
```

### Messages d'Erreur
```
❌ "Dimensions incorrectes (800x600). Requis: 1280x720 pixels"
❌ "Fichier trop lourd (7.5MB). Max: 5MB"
❌ "Format non supporté. Utilisez: .jpg, .png, .webp"
```

---

## 🎨 QUICK REFERENCE

### En Code
```typescript
// Importer config
import { IMAGE_FORMATS } from '@/config/image-formats';

// Dimensions produit
const { width, height } = IMAGE_FORMATS.product;
// → width: 1280, height: 720

// Valider une image
const isValid = isValidProductImageSize({ width: 1280, height: 720 });
// → true
```

### Dans Templates
Tous les templates utilisent maintenant ces dimensions:
```typescript
visual: {
  thumbnail: '/products/image-1280x720.jpg', // ✅ 1280x720
  images: [
    '/products/gallery-1-1280x720.jpg',     // ✅ 1280x720
    '/products/gallery-2-1280x720.jpg',     // ✅ 1280x720
  ]
}
```

---

## 📝 CHECKLIST RAPIDE

### Pour Upload d'Image
- [ ] Dimensions: 1280 x 720 pixels
- [ ] Format: JPEG, PNG, ou WebP
- [ ] Taille: < 5MB
- [ ] Ratio: 16:9
- [ ] Qualité: Minimum 85%
- [ ] Nom de fichier descriptif
- [ ] Image nette et claire

---

## 🔧 OUTILS RECOMMANDÉS

### Redimensionner en 1280x720
1. **Squoosh** → https://squoosh.app
2. **TinyPNG** → https://tinypng.com  
3. **Canva** → https://canva.com

### CLI (ImageMagick)
```bash
convert image.jpg -resize 1280x720 -quality 85 output.jpg
```

### Photoshop
```
Fichier > Exporter > Exporter sous
Largeur: 1280px
Hauteur: 720px
Qualité: 85%
```

---

## 💡 CONSEILS

### Optimisation
- Utilisez **WebP** quand possible (-30% taille vs JPEG)
- Qualité **85%** = bon équilibre qualité/poids
- Compressez toujours avant upload

### Nommage
```
✅ BON:
produit-chaise-moderne-1280x720.webp
service-consultation-hero-1280x720.jpg

❌ MAUVAIS:
IMG_1234.jpg
photo.png
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, consultez:
- **Guide complet:** `IMAGE_FORMAT_GUIDE.md`
- **Config TypeScript:** `src/config/image-formats.ts`
- **Composants UI:** `src/components/ui/image-upload-helper.tsx`

---

## 🎯 EN RÉSUMÉ

```
Format Standard Payhuk: 1280 x 720 pixels (16:9)

✅ Configuré
✅ Validé automatiquement
✅ Composants UI prêts
✅ Documentation complète
✅ Prêt à utiliser
```

**Toutes vos images de produits doivent maintenant être en 1280x720 ! 📐**

