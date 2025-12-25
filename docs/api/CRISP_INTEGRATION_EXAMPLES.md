# 💬 EXEMPLES D'INTÉGRATION CRISP - TOUS PRODUITS

**Date :** 27 octobre 2025  
**Universalité :** ✅ Digital ✅ Physical ✅ Service ✅ Course

---

## 📋 INTÉGRATION DANS PRODUCTDETAIL.TSX

### Code universel pour TOUS les types de produits

```typescript
/**
 * Page : ProductDetail
 * Fonctionne pour : Digital, Physical, Service, Course
 */

import { useCrispProduct } from '@/hooks/useCrispProduct';

const ProductDetail = () => {
  const { slug } = useParams();
  const { storeSlug } = useParams();
  
  // Récupérer le produit (votre hook existant)
  const { data: product, isLoading } = useProduct(storeSlug, slug);

  // 🎯 Crisp : Configuration automatique basée sur le type de produit
  useCrispProduct(product ? {
    id: product.id,
    name: product.name,
    type: product.type, // 'digital' | 'physical' | 'service' | 'course'
    storeName: product.store?.name,
    price: product.price,
  } : null);

  // ...reste du composant
};
```

**✅ C'est tout !** Crisp s'adapte automatiquement au type de produit.

---

## 🎯 CE QUI SE PASSE AUTOMATIQUEMENT

### Pour un **Produit Digital**

```typescript
// Quand product.type === 'digital'

// Segment créé : "digital-product-visitor"
// Session data :
{
  product_type: "digital",
  product_name: "Mon Ebook PDF",
  product_id: "abc123",
  store_name: "Librairie Numérique"
}

// Event envoyé : "viewed_product"
{
  type: "digital",
  name: "Mon Ebook PDF",
  id: "abc123"
}
```

**Message auto (si configuré) :**
```
👋 Vous consultez "Mon Ebook PDF"
📥 Téléchargement immédiat après achat
❓ Questions sur le contenu ?
```

### Pour un **Produit Physique**

```typescript
// Quand product.type === 'physical'

// Segment créé : "physical-product-visitor"
// Session data :
{
  product_type: "physical",
  product_name: "T-Shirt Premium",
  product_id: "xyz789",
  store_name: "Ma Boutique"
}
```

**Message auto (si configuré) :**
```
👋 Vous consultez "T-Shirt Premium"
🚚 Livraison sous 3-5 jours
📦 Frais de port calculés au checkout
❓ Questions sur la taille ou la livraison ?
```

### Pour un **Service**

```typescript
// Quand product.type === 'service'

// Segment créé : "service-visitor"
// Session data :
{
  product_type: "service",
  product_name: "Consultation Marketing",
  product_id: "srv456",
  store_name: "Expert Marketing"
}
```

**Message auto (si configuré) :**
```
👋 Vous consultez "Consultation Marketing"
📅 Réservation flexible
💼 Premier appel gratuit
❓ Questions sur nos disponibilités ?
```

### Pour un **Cours en Ligne**

```typescript
// Quand product.type === 'course'

// Segment créé : "course-visitor"
// Session data :
{
  product_type: "course",
  product_name: "React Avancé",
  product_id: "crs789",
  store_name: "École du Web"
}
```

**Message auto (si configuré) :**
```
👋 Vous consultez "React Avancé"
🎓 Accès à vie + certificat
📚 12 heures de vidéo
✅ Garantie satisfait ou remboursé 14 jours
❓ Questions sur le programme ?
```

---

## 💳 INTÉGRATION CHECKOUT (UNIVERSEL)

### Code pour la page Checkout

```typescript
/**
 * Page : Checkout
 * Fonctionne pour : Digital, Physical, Service, Course
 */

import { useCrispCheckout } from '@/hooks/useCrispProduct';

const Checkout = () => {
  const { product } = useCheckoutContext();

  // 🎯 Crisp : Contexte checkout (priorité support)
  useCrispCheckout(product ? {
    id: product.id,
    name: product.name,
    type: product.type,
    price: product.price,
  } : null);

  // ...checkout form
};
```

**Résultat :**
```typescript
// Segment : "checkout-visitor" (priorité HIGH)
// Event : "started_checkout"
{
  product_type: "digital", // ou physical, service, course
  amount: 29.99,
  currency: "XOF"
}
```

**Message auto (urgent) :**
```
💳 Besoin d'aide pour finaliser votre commande ?
🔒 Paiement 100% sécurisé
❓ Je peux vous aider !
```

---

## 🎉 INTÉGRATION POST-ACHAT

### Code pour la page Success

```typescript
/**
 * Page : PaymentSuccess
 * Fonctionne pour : Digital, Physical, Service, Course
 */

import { useEffect } from 'react';
import { setCrispPostPurchaseContext } from '@/lib/crisp';

const PaymentSuccess = () => {
  const { order } = useOrder();

  useEffect(() => {
    if (order) {
      // 🎯 Crisp : Contexte post-achat
      setCrispPostPurchaseContext(
        order.product.type,
        order.id,
        order.total_amount
      );
    }
  }, [order]);

  // ...reste du composant
};
```

**Résultat :**
```typescript
// Segment : "customer" (client confirmé)
// Event : "completed_purchase"
{
  product_type: "course",
  order_id: "ord_abc123",
  amount: 49.99
}
```

**Message auto (congratulations) :**
```
🎉 Félicitations pour votre achat !
📥 Votre accès est maintenant disponible
❓ Besoin d'aide pour démarrer ?
```

---

## 🤖 AUTOMATISATIONS PAR TYPE DE PRODUIT

### Configuration dans Crisp Dashboard

#### Automation 1 : Digital Products

**Déclencheur :** Segment = `digital-product-visitor`  
**Délai :** 20 secondes  
**Message :**
```
👋 Vous consultez un produit numérique

✅ Téléchargement immédiat
✅ Accès illimité
✅ Paiement sécurisé

Besoin d'infos avant d'acheter ? 😊
```

#### Automation 2 : Physical Products

**Déclencheur :** Segment = `physical-product-visitor`  
**Délai :** 25 secondes  
**Message :**
```
👋 Vous consultez un produit physique

🚚 Livraison sous 3-5 jours
📦 Frais de port calculés automatiquement
🔄 Retours gratuits (14 jours)

Questions sur la livraison ? 😊
```

#### Automation 3 : Services

**Déclencheur :** Segment = `service-visitor`  
**Délai :** 15 secondes (plus urgent)  
**Message :**
```
👋 Vous consultez un service

📅 Réservation en ligne simple
💼 Premier appel gratuit
⭐ Satisfaction garantie

Parlons de vos besoins ! 😊
```

#### Automation 4 : Courses

**Déclencheur :** Segment = `course-visitor`  
**Délai :** 30 secondes  
**Message :**
```
👋 Vous consultez un cours en ligne

🎓 Accès à vie
📚 Certificat inclus
✅ Garantie satisfait ou remboursé 14 jours
🎁 Ressources téléchargeables

Questions sur le contenu ? 😊
```

---

## 📊 SEGMENTS AVANCÉS (COMBINAISONS)

### Segment 1 : Visiteurs hésitants (digital)

```
Conditions :
- Segment = digital-product-visitor
- Temps sur page > 2 minutes
- Pas d'achat

Action :
Message : "Je vois que vous hésitez... Puis-je vous aider ? 💬"
```

### Segment 2 : Abandon panier (physical)

```
Conditions :
- Segment = checkout-visitor
- Product type = physical
- Temps inactif > 3 minutes

Action :
Message : "Besoin d'aide avec la livraison ? 🚚"
```

### Segment 3 : Questions pré-vente (service)

```
Conditions :
- Segment = service-visitor
- A cliqué sur "Réserver"
- N'a pas finalisé

Action :
Message : "Besoin d'un devis personnalisé ? Contactez-moi ! 💼"
```

### Segment 4 : Étudiants potentiels (course)

```
Conditions :
- Segment = course-visitor
- A consulté plusieurs cours
- Pas encore inscrit

Action :
Message : "Quel cours vous intéresse le plus ? Je peux vous guider ! 🎓"
```

---

## 🎯 CONTEXTE ENRICHI PAR TYPE

### Digital : Données supplémentaires

```typescript
setCrispSessionData({
  product_type: 'digital',
  file_format: 'PDF',
  file_size: '12 MB',
  download_count: 'unlimited',
  instant_access: true,
});
```

### Physical : Données supplémentaires

```typescript
setCrispSessionData({
  product_type: 'physical',
  stock_status: 'in_stock',
  shipping_zone: 'france',
  delivery_time: '3-5 days',
  free_shipping_threshold: 50,
});
```

### Service : Données supplémentaires

```typescript
setCrispSessionData({
  product_type: 'service',
  availability: 'next_week',
  duration: '1h',
  booking_required: true,
  first_consultation_free: true,
});
```

### Course : Données supplémentaires

```typescript
setCrispSessionData({
  product_type: 'course',
  duration_hours: 12,
  lessons_count: 48,
  level: 'intermediate',
  certificate_included: true,
  lifetime_access: true,
});
```

---

## 🚀 QUICK WINS (IMPLÉMENTATION RAPIDE)

### Win 1 : Message bienvenue universel (5 min)

**Setup :**
1. Crisp → Settings → Chatbox → Greeting
2. Message : "👋 Besoin d'aide ? Nous sommes là pour vous !"

**Impact :** +15% engagement

### Win 2 : Email notifications (2 min)

**Setup :**
1. Crisp → Settings → Integrations → Email
2. Activer notifications

**Impact :** Réponse même hors ligne

### Win 3 : FAQ automatique (15 min)

**Setup :**
1. Crisp → Knowledge → Add Articles
2. Créer 5 FAQs :
   - "Comment acheter ?"
   - "Moyens de paiement ?"
   - "Livraison ?" (physical)
   - "Accès cours ?" (course)
   - "Remboursement ?"

**Impact :** -40% questions répétitives

### Win 4 : Horaires de disponibilité (3 min)

**Setup :**
1. Crisp → Settings → Availability
2. Définir horaires (ex: 9h-18h)
3. Message hors ligne : "Nous sommes absents. Nous répondrons dès notre retour !"

**Impact :** Expectations claires

---

## 📱 MOBILE-FIRST

### App Crisp (support en déplacement)

**iOS :** https://apps.apple.com/app/crisp/id1023673985  
**Android :** https://play.google.com/store/apps/details?id=im.crisp.client

**Features :**
- ✅ Notifications push temps réel
- ✅ Réponses depuis smartphone
- ✅ Voir contexte produit
- ✅ Quick replies (templates)
- ✅ Photos/fichiers

**Pro tip :** Configurer quick replies pour réponses rapides mobiles

---

## 🎉 RÉSUMÉ : CRISP EST UNIVERSEL ! ✅

| Type Produit | Segment | Contexte | Automatisation |
|--------------|---------|----------|----------------|
| **Digital** | `digital-product-visitor` | ✅ Format, taille | ✅ Message téléchargement |
| **Physical** | `physical-product-visitor` | ✅ Stock, livraison | ✅ Message livraison |
| **Service** | `service-visitor` | ✅ Dispo, durée | ✅ Message booking |
| **Course** | `course-visitor` | ✅ Durée, certificat | ✅ Message inscription |

**Un seul système → 4 types de produits ! 🚀**

---

## 🔥 PROCHAINES ÉTAPES

1. ✅ Crisp configuré (Website ID dans .env)
2. ✅ Code intégré (déjà fait dans Payhuk)
3. 📝 Créer 3-5 automatisations
4. 🤖 Configurer chatbot FAQ
5. 📱 Installer app mobile
6. 📊 Review analytics après 1 semaine

**Crisp est prêt pour TOUS vos produits ! 💬🎯**

