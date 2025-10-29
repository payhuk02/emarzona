import { Template } from '@/types/templates-v2';

export const codingBootcampTemplate: Template = {
  id: 'course-coding-bootcamp-lambda',
  name: 'Coding Bootcamp - Full Stack Developer',
  description: 'Template professionnel pour bootcamp de programmation - Style Lambda School',
  category: 'course',
  subCategory: 'coding',
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    tags: ['coding', 'bootcamp', 'programming', 'full-stack', 'lambda', 'web-development', 'career-change'],
    tier: 'free',
    designStyle: 'tech',
    industry: 'education-tech',
    language: 'fr',
    isPopular: true,
    isFeatured: true,
    usageCount: 4521,
    rating: 4.9,
    reviewCount: 876,
    lastUpdated: '2025-01-15',
    previewImages: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1280&h=720'],
  },
  data: {
    productName: '{{ course_name }}',
    slug: '{{ course_name | slugify }}',
    shortDescription: 'Bootcamp intensif Full Stack. De zéro à développeur pro en 6 mois. Garantie embauche ou remboursé.',
    longDescription: `# 💻 VOTRE NOUVELLE CARRIÈRE EN TECH

## {{ course_name }} - Devenez Développeur Pro

Formation **intensive et pratique** pour devenir développeur Full Stack. Garantie embauche ou remboursé !

## 🎯 PROGRAMME COMPLET

### Front-End (8 semaines)
- 🌐 HTML5, CSS3, JavaScript ES6+
- ⚛️ React.js & Hooks
- 🎨 Tailwind CSS
- 📱 Responsive Design
- ♿ Accessibilité web

### Back-End (8 semaines)
- 🟢 Node.js & Express
- 🗄️ Bases de données (SQL, MongoDB)
- 🔐 Authentification & Sécurité
- 🚀 API REST & GraphQL
- ☁️ Cloud & Déploiement

### Full Stack (8 semaines)
- 🔧 Projets complets
- 👥 Travail en équipe Agile
- 🚀 CI/CD & DevOps bases
- 📊 Portfolio professionnel
- 🎤 Préparation entretiens

## 💼 GARANTIE EMPLOI

**{{ job_guarantee_rate }}% de nos étudiants** trouvent un emploi tech en moins de {{ job_search_months }} mois !

✅ **Garantie remboursé** si pas d'emploi après {{ job_guarantee_period }} mois  
✅ **Salaire moyen** {{ average_salary }}€/an  
✅ **Coaching carrière** inclus  
✅ **Réseau entreprises** {{ partner_companies }}+ partenaires  

## 📚 CE QUI EST INCLUS

✅ **{{ total_hours }}h** de cours  
✅ **{{ projects_count }}+ projets** réels  
✅ **Mentor dédié** 1-on-1  
✅ **Support 24/7** communauté  
✅ **Certifications** reconnues  
✅ **Laptop inclus** (option)  

## 💰 FINANCEMENT

### Paiement Après Emploi (ISA)
**0€ d'avance !**
- Commencez sans payer
- {{ isa_percentage }}% du salaire pendant {{ isa_duration }} mois
- Seulement si salaire > {{ isa_threshold }}€

### Paiement Classique
**{{ price_upfront }}€** (ou {{ monthly_payment }}€/mois)
- -{{ early_discount }}% si paiement avant {{ early_deadline }}
- Éligible CPF & Pôle Emploi
- Facilités jusqu'à {{ max_installments }} fois

## 👨‍💻 NOS INSTRUCTEURS

- 🏆 **Devs seniors** GAFAM & licornes
- 📚 **{{ instructor_experience }}+ ans** d'expérience
- 🎓 **Pédagogie éprouvée** taux réussite {{ success_rate }}%
- 💼 **Experts recrutement** tech

## 📅 FORMAT

**{{ duration }} mois intensif**
- 📅 Lun-Ven: 9h-18h
- 💻 100% en ligne ou hybride
- 🤝 Groupes {{ cohort_size }} étudiants max
- 🔄 Cohortes tous les {{ cohort_frequency }}

## ⭐ TÉMOIGNAGES

> "{{ review_1_text }}" - **{{ review_1_author }}**, {{ review_1_title }}

> "{{ review_2_text }}" - **{{ review_2_author }}**, {{ review_2_title }}

## 🚀 POSTULEZ MAINTENANT

**Prochaine cohorte:** {{ next_cohort_date }}

📝 **Candidature gratuite** (30 min)  
💬 **Entretien admissions**  
🎯 **Test technique simple**  
✅ **Résultats sous 48h**

📧 {{ email }}  
📞 {{ phone }}

---

**Votre avenir tech commence ici !** 🚀`,
    price: 7990.00,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1280&h=720&fit=crop', alt: 'Coding Bootcamp', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#E23539', secondary: '#2C2C2C', accent: '#FFB81C', background: '#FFFFFF', text: '#2C2C2C' },
    seo: { metaTitle: 'Bootcamp Full Stack | De Zéro à Dev en 6 Mois | Garantie Emploi', metaDescription: 'Formation intensive développeur Full Stack. {{ job_guarantee_rate }}% emploi garanti. Financement ISA 0€ d\'avance. Cohorte {{ next_cohort_date }}.', keywords: ['bootcamp', 'coding', 'full-stack', 'lambda school', 'développeur', 'formation'] },
    course: {
      level: 'beginner-to-advanced',
      duration: 6,
      durationUnit: 'months',
      totalHours: 960,
      format: ['live-online', 'recorded', 'projects'],
      certificate: true,
      modules: [
        { id: 'frontend', name: 'Front-End Development', lessons: 40, duration: 8, durationUnit: 'weeks' },
        { id: 'backend', name: 'Back-End Development', lessons: 40, duration: 8, durationUnit: 'weeks' },
        { id: 'fullstack', name: 'Full Stack Projects', lessons: 40, duration: 8, durationUnit: 'weeks' },
      ],
      instructor: { name: '{{ instructor_name }}', title: 'Senior Full Stack Developer', experience: '{{ instructor_experience }}+ ans' },
      pricing: [
        { id: 'isa', name: 'ISA', price: 0, description: 'Payez après emploi' },
        { id: 'upfront', name: 'Upfront', price: 7990, description: 'Paiement avance', isPopular: true },
        { id: 'monthly', name: 'Mensuel', price: 1500, sessions: 6, description: '6 mensualités' },
      ],
    },
  },
};

export default codingBootcampTemplate;

