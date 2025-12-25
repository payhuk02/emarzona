# 📱 Guide de Test Mobile

## Tests à Effectuer

### iOS Safari

1. **Ouvrir Safari sur iPhone/iPad**
2. **Activer le mode développeur**:
   - Settings > Safari > Advanced > Web Inspector
3. **Connecter l'appareil à Mac**
4. **Ouvrir Safari sur Mac** > Develop > [Votre appareil] > [URL]

### Android Chrome

1. **Ouvrir Chrome sur Android**
2. **Activer le mode développeur**:
   - Settings > About phone > Tap "Build number" 7 times
   - Settings > Developer options > USB debugging
3. **Connecter l'appareil à PC**
4. **Ouvrir Chrome DevTools** > More tools > Remote devices

### Tests à Effectuer

#### Performance

- [ ] Temps de chargement initial < 3s
- [ ] Scroll fluide
- [ ] Images chargées progressivement
- [ ] Pas de freeze/blocage

#### Navigation

- [ ] Bottom navigation visible et fonctionnelle
- [ ] Touch targets 44x44px minimum
- [ ] Pas de zoom automatique sur inputs
- [ ] Safe area respectée (notch)

#### Images

- [ ] Images chargées avec lazy loading
- [ ] Placeholder blur visible
- [ ] Pas d'images cassées
- [ ] Format WebP/AVIF supporté

#### Responsive

- [ ] Layout adapté à l'écran
- [ ] Textes lisibles (16px minimum)
- [ ] Boutons accessibles
- [ ] Pas de scroll horizontal

### Outils de Test

#### Chrome DevTools

1. Ouvrir DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Sélectionner un appareil (iPhone, iPad, etc.)
4. Tester les différentes tailles

#### Responsive Design Mode

- iPhone SE (375x667)
- iPhone 12/13 (390x844)
- iPhone 14 Pro Max (430x932)
- iPad (768x1024)
- iPad Pro (1024x1366)

### Checklist Mobile

- [ ] Test sur iPhone (Safari)
- [ ] Test sur Android (Chrome)
- [ ] Test sur différentes tailles d'écran
- [ ] Test de la bottom navigation
- [ ] Test des images optimisées
- [ ] Test du scroll
- [ ] Test des touch targets
- [ ] Test du safe area
- [ ] Test de la performance

### Métriques à Vérifier

- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.5s

### Problèmes Courants

1. **Images trop lourdes**
   - Solution: Utiliser OptimizedImage avec WebP

2. **Touch targets trop petits**
   - Solution: Vérifier min-height: 44px

3. **Zoom automatique sur inputs**
   - Solution: font-size: 16px minimum

4. **Safe area non respectée**
   - Solution: Utiliser env(safe-area-inset-\*)

5. **Performance médiocre**
   - Solution: Lazy loading, code splitting
