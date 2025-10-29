import { Template } from '@/types/templates-v2';

export const legalServicesTemplate: Template = {
  id: 'service-legal-services-legalzoom',
  name: 'Legal Services & Consultation (PREMIUM)',
  description: 'Template PREMIUM pour services juridiques - Style LegalZoom professionnel',
  category: 'service',
  subCategory: 'legal',
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    tags: ['legal', 'lawyer', 'consultation', 'juridique', 'avocat', 'legalzoom', 'contract', 'litigation'],
    tier: 'premium',
    designStyle: 'corporate',
    industry: 'legal',
    language: 'fr',
    isPopular: true,
    usageCount: 1567,
    rating: 4.9,
    reviewCount: 234,
    lastUpdated: '2025-01-15',
    previewImages: ['https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720'],
  },
  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Services juridiques professionnels. Avocat certifié, expertise reconnue, conseil stratégique.',
    longDescription: `# ⚖️ EXPERTISE JURIDIQUE DE CONFIANCE

## {{ service_name }} - Protection Légale

Conseil juridique **expert et personnalisé** pour sécuriser vos intérêts personnels et professionnels.

## 📋 NOS DOMAINES D'EXPERTISE

### Droit des Affaires
- 🏢 Création société (SARL, SAS, SASU)
- 📄 Rédaction contrats commerciaux
- 🤝 Fusions & acquisitions
- 💼 Droit social & RH

### Droit Civil
- 🏠 Immobilier (achat, vente, bail)
- 👨‍👩‍👧 Droit de la famille (divorce, succession)
- 💰 Contentieux civil
- 📜 Testaments & donations

### Droit du Travail
- 👔 Licenciement & rupture
- 📋 Contrats de travail
- ⚖️ Prud'hommes
- 💼 Négociations collectives

### Propriété Intellectuelle
- 🎨 Marques & brevets
- 📝 Droits d'auteur
- 🔒 Secrets d'affaires
- ⚡ Contrefaçon

## 💎 NOS SERVICES

### Consultation (1h)
**{{ price_consultation }}€**
- Analyse situation
- Conseil stratégique
- Pistes de résolution
- Compte-rendu écrit

### Forfait Accompagnement
**À partir de {{ price_package }}€**
- Suivi personnalisé
- Rédaction documents
- Représentation négociations
- Disponibilité prioritaire

### Contentieux
**Sur devis**
- Évaluation cas
- Stratégie procédurale
- Représentation judiciaire
- Suivi complet dossier

## 👨‍⚖️ NOTRE CABINET

### Expertise
- 🎓 Avocats certifiés Barreau
- ⭐ {{ years_experience }}+ ans expérience
- 🏆 {{ cases_won }}+ affaires gagnées
- 📊 {{ success_rate }}% taux succès

### Valeurs
- ⚖️ **Éthique** - Déontologie stricte
- 🔒 **Confidentialité** - Secret professionnel absolu
- 💡 **Excellence** - Expertise pointue
- 🤝 **Proximité** - Écoute client

## 🛡️ GARANTIES

✅ Secret professionnel absolu  
✅ Assurance responsabilité civile  
✅ Honoraires transparents  
✅ Devis détaillé gratuit  
✅ Pas de frais cachés  

## 📞 CONSULTATION INITIALE

**30 min gratuites** pour évaluer votre situation

📧 {{ email }}  
📞 {{ phone }}  
🏢 {{ address }}

**Disponible 7j/7 pour urgences**

---

**Votre défense, notre engagement** ⚖️`,
    price: 250.00,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1280&h=720&fit=crop', alt: 'Legal Services', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#1A365D', secondary: '#2C5282', accent: '#D4AF37', background: '#FFFFFF', text: '#1A202C' },
    seo: { metaTitle: 'Avocat & Services Juridiques | Consultation Gratuite | {{ city }}', metaDescription: 'Cabinet d\'avocats certifiés. Droit affaires, civil, travail. {{ years_experience }}+ ans expérience. Consultation initiale gratuite.', keywords: ['avocat', 'juridique', 'legal', 'legalzoom', 'conseil', 'droit'] },
    service: { duration: 60, durationUnit: 'minutes', packages: [
      { id: 'consultation', name: 'Consultation', price: 250, sessions: 1, description: '1h conseil stratégique' },
      { id: 'package', name: 'Accompagnement', price: 1500, sessions: 1, description: 'Suivi personnalisé', isPopular: true },
      { id: 'litigation', name: 'Contentieux', price: 0, sessions: 1, description: 'Sur devis selon dossier' },
    ]},
  },
};

export default legalServicesTemplate;

