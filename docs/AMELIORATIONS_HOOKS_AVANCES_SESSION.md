# ✅ AMÉLIORATIONS HOOKS AVANCÉS - SESSION

## Date : 28 Février 2025

---

## 🎯 OBJECTIF

Créer des hooks avancés pour des cas d'usage spécifiques : géolocalisation, détection d'inactivité, gestion du temps, etc.

---

## ✅ AMÉLIORATIONS COMPLÉTÉES

### 1. Hook useGeolocation ✅

**Fichier** : `src/hooks/useGeolocation.ts`

**Fonctionnalités** :
- ✅ **position** : Position actuelle (latitude, longitude, accuracy, etc.)
- ✅ **error** : Erreur de géolocalisation
- ✅ **loading** : Indique si la géolocalisation est en cours
- ✅ **isSupported** : Indique si la géolocalisation est supportée
- ✅ **getPosition** : Obtenir la position manuellement
- ✅ **stopWatch** : Arrêter le watch
- ✅ **enableHighAccuracy** : Option pour haute précision
- ✅ **timeout** : Timeout configurable
- ✅ **maximumAge** : Durée maximale de cache
- ✅ **watch** : Watch automatique

**Bénéfices** :
- 🟢 API simple et intuitive
- 🟢 Support du watch automatique
- 🟢 Gestion d'erreurs complète
- 🟢 Nettoyage automatique des ressources

**Exemple d'utilisation** :
```tsx
const { position, error, loading, getPosition } = useGeolocation({
  enableHighAccuracy: true,
  timeout: 10000,
  watch: true, // Watch automatique
});

// Obtenir la position manuellement
<Button onClick={getPosition}>Obtenir ma position</Button>

// Afficher la position
{position && (
  <div>
    Latitude: {position.latitude}
    Longitude: {position.longitude}
  </div>
)}
```

---

### 2. Hook useIdle ✅

**Fichier** : `src/hooks/useIdle.ts`

**Fonctionnalités** :
- ✅ **isIdle** : Indique si l'utilisateur est inactif
- ✅ **idleTime** : Temps d'inactivité en millisecondes
- ✅ **reset** : Réinitialiser le timer d'inactivité
- ✅ **timeout** : Délai d'inactivité configurable
- ✅ **events** : Événements à écouter (mousedown, mousemove, etc.)
- ✅ **windowEvents** : Événements sur window
- ✅ **documentEvents** : Événements sur document
- ✅ **onIdle/onActive** : Callbacks pour l'inactivité/activité

**Bénéfices** :
- 🟢 Détection d'inactivité précise
- 🟢 Événements configurables
- 🟢 Callbacks pour réagir à l'inactivité
- 🟢 Nettoyage automatique des listeners

**Exemple d'utilisation** :
```tsx
const { isIdle, idleTime, reset } = useIdle({
  timeout: 30000, // 30 secondes
  events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'],
  onIdle: () => console.log('Utilisateur inactif'),
  onActive: () => console.log('Utilisateur actif'),
});

// Afficher un message si inactif
{isIdle && <div>Vous êtes inactif depuis {Math.floor(idleTime / 1000)}s</div>}
```

---

### 3. Hook usePrevious ✅

**Fichier** : `src/hooks/usePrevious.ts`

**Fonctionnalités** :
- ✅ **usePrevious** : Obtenir la valeur précédente d'une variable
- ✅ **Type-safe** : Support TypeScript complet
- ✅ **Simple** : API très simple

**Bénéfices** :
- 🟢 Comparaison facile des valeurs précédentes
- 🟢 Détection de changements
- 🟢 API simple et intuitive

**Exemple d'utilisation** :
```tsx
const [count, setCount] = useState(0);
const prevCount = usePrevious(count);

// Détecter un changement
useEffect(() => {
  if (prevCount !== undefined && prevCount !== count) {
    console.log(`Count changed from ${prevCount} to ${count}`);
  }
}, [count, prevCount]);
```

---

### 4. Hook useInterval ✅

**Fichier** : `src/hooks/useInterval.ts`

**Fonctionnalités** :
- ✅ **useInterval** : Gérer les intervalles
- ✅ **delay** : Délai configurable (null pour arrêter)
- ✅ **callback** : Callback à exécuter
- ✅ **immediate** : Exécuter immédiatement au montage
- ✅ **Nettoyage automatique** : Nettoyage à la destruction

**Bénéfices** :
- 🟢 Gestion simplifiée des intervalles
- 🟢 Nettoyage automatique
- 🟢 Support de l'exécution immédiate

**Exemple d'utilisation** :
```tsx
const [count, setCount] = useState(0);

// Incrémenter toutes les secondes
useInterval(() => {
  setCount(c => c + 1);
}, 1000);

// Arrêter l'intervalle
useInterval(() => {
  setCount(c => c + 1);
}, null); // null arrête l'intervalle
```

---

### 5. Hook useTimeout ✅

**Fichier** : `src/hooks/useTimeout.ts`

**Fonctionnalités** :
- ✅ **useTimeout** : Gérer les timeouts
- ✅ **delay** : Délai configurable (null pour annuler)
- ✅ **callback** : Callback à exécuter
- ✅ **Nettoyage automatique** : Nettoyage à la destruction

**Bénéfices** :
- 🟢 Gestion simplifiée des timeouts
- 🟢 Nettoyage automatique
- 🟢 API simple et intuitive

**Exemple d'utilisation** :
```tsx
const [showMessage, setShowMessage] = useState(false);

// Afficher un message après 3 secondes
useTimeout(() => {
  setShowMessage(true);
}, 3000);

// Annuler le timeout
useTimeout(() => {
  setShowMessage(true);
}, null); // null annule le timeout
```

---

### 6. Hook useCountdown ✅

**Fichier** : `src/hooks/useCountdown.ts`

**Fonctionnalités** :
- ✅ **timeLeft** : Temps restant en secondes
- ✅ **isFinished** : Indique si le compteur est terminé
- ✅ **isPaused** : Indique si le compteur est en pause
- ✅ **start** : Démarrer le compteur
- ✅ **pause** : Mettre en pause le compteur
- ✅ **reset** : Réinitialiser le compteur
- ✅ **formattedTime** : Temps formaté (MM:SS)
- ✅ **initialTime** : Temps initial configurable
- ✅ **onFinish** : Callback appelé à la fin
- ✅ **autoStart** : Démarrer automatiquement
- ✅ **interval** : Intervalle de mise à jour configurable

**Bénéfices** :
- 🟢 Compteur à rebours complet
- 🟢 Contrôle total (start, pause, reset)
- 🟢 Formatage automatique
- 🟢 Callback à la fin

**Exemple d'utilisation** :
```tsx
const { timeLeft, isFinished, isPaused, start, pause, reset, formattedTime } = useCountdown({
  initialTime: 60, // 60 secondes
  onFinish: () => console.log('Terminé!'),
  autoStart: false,
});

// Afficher le temps
<div>{formattedTime}</div>

// Contrôler le compteur
<Button onClick={start}>Démarrer</Button>
<Button onClick={pause}>Pause</Button>
<Button onClick={reset}>Réinitialiser</Button>
```

---

## 📊 IMPACT ATTENDU

### Code Quality
- **Réduction du code répétitif** : ~50-60% selon le type
- **Maintenabilité** : Code plus cohérent et réutilisable
- **DX (Developer Experience)** : API plus simple et intuitive

### Performance
- **Geolocation** : Gestion optimisée avec watch
- **Idle** : Détection efficace avec listeners passifs
- **Interval/Timeout** : Nettoyage automatique pour éviter les fuites mémoire

### UX
- **Geolocation** : Expérience utilisateur améliorée pour les fonctionnalités basées sur la localisation
- **Idle** : Détection d'inactivité pour économiser les ressources
- **Countdown** : Compteurs à rebours pour les ventes flash, etc.

---

## 🔧 MIGRATION PROGRESSIVE

### Pour useGeolocation

**Option 1 : Remplacer les patterns manuels**
```tsx
// Ancien
const [position, setPosition] = useState(null);
useEffect(() => {
  navigator.geolocation.getCurrentPosition((pos) => {
    setPosition(pos);
  });
}, []);

// Nouveau
const { position, loading, error, getPosition } = useGeolocation({
  enableHighAccuracy: true,
});
```

### Pour useIdle

**Option 1 : Détecter l'inactivité**
```tsx
// Nouveau
const { isIdle, idleTime } = useIdle({
  timeout: 30000,
  onIdle: () => console.log('Inactif'),
});
```

### Pour usePrevious

**Option 1 : Comparer les valeurs**
```tsx
// Nouveau
const prevValue = usePrevious(value);
if (prevValue !== undefined && prevValue !== value) {
  // Valeur a changé
}
```

### Pour useInterval/useTimeout

**Option 1 : Remplacer setInterval/setTimeout**
```tsx
// Ancien
useEffect(() => {
  const id = setInterval(() => {
    // ...
  }, 1000);
  return () => clearInterval(id);
}, []);

// Nouveau
useInterval(() => {
  // ...
}, 1000);
```

### Pour useCountdown

**Option 1 : Compteur à rebours**
```tsx
// Nouveau
const { timeLeft, formattedTime, start, pause, reset } = useCountdown({
  initialTime: 60,
  onFinish: () => console.log('Terminé!'),
});
```

---

## 📝 RECOMMANDATIONS

### Priorité HAUTE
1. ✅ **Hook useGeolocation** - COMPLÉTÉ
2. ✅ **Hook useIdle** - COMPLÉTÉ
3. ✅ **Hook usePrevious** - COMPLÉTÉ
4. ✅ **Hook useInterval** - COMPLÉTÉ
5. ✅ **Hook useTimeout** - COMPLÉTÉ
6. ✅ **Hook useCountdown** - COMPLÉTÉ
7. ⏳ **Migrer progressivement** les composants vers ces hooks

### Priorité MOYENNE
8. ⏳ **Créer des hooks spécialisés** pour des cas d'usage spécifiques
9. ⏳ **Ajouter des tests** pour les nouveaux hooks

---

## ✅ CONCLUSION

**Améliorations appliquées** :
- ✅ Hook useGeolocation créé avec support du watch
- ✅ Hook useIdle créé avec détection d'inactivité
- ✅ Hook usePrevious créé pour comparer les valeurs
- ✅ Hook useInterval créé avec nettoyage automatique
- ✅ Hook useTimeout créé avec nettoyage automatique
- ✅ Hook useCountdown créé avec contrôle complet

**Impact** : 🟢 **MOYEN-ÉLEVÉ** - Réduction significative du code répétitif et amélioration de la cohérence UX.

**Prochaines étapes** :
- ⏳ Migrer les composants vers useGeolocation
- ⏳ Migrer les composants vers useIdle
- ⏳ Migrer les composants vers usePrevious
- ⏳ Migrer les composants vers useInterval/useTimeout
- ⏳ Migrer les composants vers useCountdown

---

## 📚 RESSOURCES

- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [setInterval/setTimeout](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval)

