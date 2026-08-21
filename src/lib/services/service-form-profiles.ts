import type { ServiceProductFormData } from '@/types/service-product';

export type ServiceFormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'boolean';

export type ServiceFormFieldOption = { value: string; label: string };

export type ServiceFormField = {
  key: string;
  label: string;
  hint?: string;
  type: ServiceFormFieldType;
  required?: boolean;
  placeholder?: string;
  options?: ServiceFormFieldOption[];
};

export type ServiceFormDefaults = {
  fulfillment_mode: NonNullable<ServiceProductFormData['fulfillment_mode']>;
  service_type: ServiceProductFormData['service_type'];
  location_type: ServiceProductFormData['location_type'];
  duration_minutes: number;
  requires_staff: boolean;
  pricing_type: ServiceProductFormData['pricing_type'];
};

export type ServiceFormProfile = {
  familySlug: string;
  familyLabel: string;
  headline: string;
  description: string;
  defaults: ServiceFormDefaults;
  requireSlots: boolean;
  staffRecommended: boolean;
  durationLabel: string;
  fields: ServiceFormField[];
};

const LANGS: ServiceFormFieldOption[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'pt', label: 'Portugais' },
  { value: 'ar', label: 'Arabe' },
  { value: 'wo', label: 'Wolof' },
  { value: 'other', label: 'Autre' },
];

function select(
  key: string,
  label: string,
  options: ServiceFormFieldOption[],
  extra?: Partial<ServiceFormField>
): ServiceFormField {
  return { key, label, type: 'select', options, ...extra };
}

function text(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'text', ...extra };
}

function area(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'textarea', ...extra };
}

function num(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'number', ...extra };
}

function flags(
  key: string,
  label: string,
  options: ServiceFormFieldOption[],
  extra?: Partial<ServiceFormField>
): ServiceFormField {
  return { key, label, type: 'multiselect', options, ...extra };
}

function toggle(key: string, label: string, extra?: Partial<ServiceFormField>): ServiceFormField {
  return { key, label, type: 'boolean', ...extra };
}

const PROJECT: ServiceFormDefaults = {
  fulfillment_mode: 'project',
  service_type: 'other',
  location_type: 'online',
  duration_minutes: 60,
  requires_staff: false,
  pricing_type: 'fixed',
};

const APPOINTMENT: ServiceFormDefaults = {
  fulfillment_mode: 'appointment',
  service_type: 'appointment',
  location_type: 'on_site',
  duration_minutes: 60,
  requires_staff: true,
  pricing_type: 'fixed',
};

export const SERVICE_FAMILY_LEAVES: Record<string, string[]> = {
  'svc-informatique-technologie': [
    'svc-developpement-web',
    'svc-developpement-mobile',
    'svc-creation-logiciels',
    'svc-maintenance-informatique',
    'svc-cybersecurite',
    'svc-bases-de-donnees',
    'svc-ia-automatisation',
    'svc-support-technique',
    'svc-installation-configuration',
    'svc-hebergement-serveurs',
  ],
  'svc-design-creation': [
    'svc-creation-logos',
    'svc-identite-visuelle',
    'svc-design-graphique',
    'svc-ui-ux-design',
    'svc-design-sites-web',
    'svc-flyers-affiches',
    'svc-presentations-pro',
    'svc-packaging',
    'svc-retouche-photo',
    'svc-illustration',
  ],
  'svc-marketing-communication': [
    'svc-marketing-digital',
    'svc-community-management',
    'svc-gestion-reseaux-sociaux',
    'svc-facebook-instagram-ads',
    'svc-google-ads',
    'svc-tiktok-ads',
    'svc-seo',
    'svc-email-marketing',
    'svc-copywriting-marketing',
    'svc-creation-contenu',
    'svc-strategie-marketing',
    'svc-influence-rp',
  ],
  'svc-formation-coaching': [
    'svc-coaching-professionnel',
    'svc-coaching-business',
    'svc-coaching-marketing',
    'svc-formation-informatique',
    'svc-formation-ecommerce',
    'svc-formation-langues',
    'svc-tutorat',
    'svc-mentorat',
    'svc-orientation-pro',
    'svc-accompagnement-perso',
  ],
  'svc-redaction-traduction': [
    'svc-redaction-web',
    'svc-copywriting-redaction',
    'svc-correction-relecture',
    'svc-traduction',
    'svc-transcription',
    'svc-redaction-cv',
    'svc-lettres-motivation',
    'svc-redaction-rapports',
    'svc-redaction-academique',
  ],
  'svc-photo-video-audiovisuel': [
    'svc-photographie',
    'svc-videographie',
    'svc-montage-video',
    'svc-motion-design',
    'svc-animation-2d-3d',
    'svc-voix-off',
    'svc-production-audiovisuelle',
    'svc-creation-reels',
    'svc-contenu-tiktok',
    'svc-production-evenementielle',
  ],
  'svc-services-entreprises': [
    'svc-creation-entreprise',
    'svc-domiciliation',
    'svc-gestion-administrative',
    'svc-secretariat-externalise',
    'svc-assistance-virtuelle',
    'svc-centres-appels',
    'svc-prospection-commerciale',
    'svc-televiente',
    'svc-gestion-projets',
    'svc-externalisation-services',
  ],
  'svc-maison-services-locaux': [
    'svc-nettoyage',
    'svc-entretien',
    'svc-jardinage',
    'svc-plomberie',
    'svc-electricite',
    'svc-climatisation',
    'svc-peinture',
    'svc-menuiserie',
    'svc-reparation',
    'svc-decoration-interieure',
  ],
  'svc-beaute-bien-etre': [
    'svc-coiffure',
    'svc-maquillage',
    'svc-onglerie',
    'svc-esthetique',
    'svc-massage',
    'svc-spa',
    'svc-coaching-sportif',
    'svc-nutrition-bien-etre',
    'svc-beaute-domicile',
  ],
  'svc-transport-automobile': [
    'svc-livraison',
    'svc-transport-personnes',
    'svc-location-vehicules',
    'svc-chauffeur-prive',
    'svc-entretien-automobile',
    'svc-reparation-automobile',
    'svc-diagnostic-automobile',
    'svc-lavage-automobile',
    'svc-assistance-routiere',
  ],
  'svc-evenementiel': [
    'svc-organisation-evenements',
    'svc-decoration-evenementielle',
    'svc-traiteur',
    'svc-photo-evenementielle',
    'svc-video-evenementielle',
    'svc-dj-animation',
    'svc-location-materiel',
    'svc-sonorisation',
    'svc-invitations-papeterie',
  ],
  'svc-juridique-administratif': [
    'svc-consultation-juridique',
    'svc-redaction-contrats',
    'svc-creation-societes',
    'svc-formalites-administratives',
    'svc-propriete-intellectuelle',
    'svc-droit-affaires',
    'svc-mediation',
    'svc-assistance-juridique',
  ],
};

const FAMILY_PROFILES: Record<
  string,
  Omit<ServiceFormProfile, 'fields'> & { fields: ServiceFormField[] }
> = {
  'svc-informatique-technologie': {
    familySlug: 'svc-informatique-technologie',
    familyLabel: 'Informatique & Technologie',
    headline: 'Prestation digitale sur projet',
    description: 'Précisez le livrable, la stack et le délai. Les créneaux RDV sont optionnels.',
    defaults: PROJECT,
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Délai de réalisation estimé',
    fields: [
      select(
        'deliverable',
        'Type de livrable',
        [
          { value: 'website', label: 'Site web' },
          { value: 'app', label: 'Application' },
          { value: 'api', label: 'API / backend' },
          { value: 'maintenance', label: 'Maintenance / support' },
          { value: 'audit', label: 'Audit / conseil' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      text('stack', 'Stack / outils', { placeholder: 'Ex. React, WordPress, Flutter' }),
      num('delivery_days', 'Délai (jours)', { required: true, placeholder: '14' }),
      num('revisions', 'Nombre de révisions incluses', { placeholder: '2' }),
      area('scope', 'Périmètre', { placeholder: 'Pages, fonctionnalités, intégrations…' }),
    ],
  },
  'svc-design-creation': {
    familySlug: 'svc-design-creation',
    familyLabel: 'Design & Création',
    headline: 'Création graphique sur brief',
    description: 'Indiquez les formats et le nombre de propositions. Mode projet par défaut.',
    defaults: PROJECT,
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Délai de livraison estimé',
    fields: [
      flags(
        'formats',
        'Formats livrés',
        [
          { value: 'png', label: 'PNG' },
          { value: 'jpg', label: 'JPG' },
          { value: 'svg', label: 'SVG' },
          { value: 'pdf', label: 'PDF' },
          { value: 'ai', label: 'AI / source' },
          { value: 'figma', label: 'Figma' },
        ],
        { required: true }
      ),
      num('proposals', 'Propositions initiales', { required: true, placeholder: '3' }),
      num('revisions', 'Révisions incluses', { placeholder: '2' }),
      toggle('brand_guidelines', 'Le client fournit une charte graphique'),
    ],
  },
  'svc-marketing-communication': {
    familySlug: 'svc-marketing-communication',
    familyLabel: 'Marketing & Communication',
    headline: 'Campagne ou accompagnement',
    description: 'Canaux, durée et objectifs. Projet ou suivi récurrent.',
    defaults: { ...PROJECT, fulfillment_mode: 'both', service_type: 'consultation' },
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Durée d’une session (si RDV)',
    fields: [
      flags(
        'channels',
        'Canaux',
        [
          { value: 'meta', label: 'Meta (Facebook / Instagram)' },
          { value: 'google', label: 'Google' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'email', label: 'Email' },
          { value: 'seo', label: 'SEO' },
          { value: 'content', label: 'Contenu / social' },
        ],
        { required: true }
      ),
      num('campaign_weeks', 'Durée d’accompagnement (semaines)', { placeholder: '4' }),
      text('kpis', 'Objectifs / KPIs', { placeholder: 'Leads, ventes, portée…' }),
    ],
  },
  'svc-formation-coaching': {
    familySlug: 'svc-formation-coaching',
    familyLabel: 'Formation & Coaching',
    headline: 'Séances individuelles ou de groupe',
    description: 'Durée de séance et niveau. Les créneaux permettent la réservation.',
    defaults: {
      ...APPOINTMENT,
      service_type: 'class',
      location_type: 'online',
      duration_minutes: 60,
    },
    requireSlots: true,
    staffRecommended: false,
    durationLabel: 'Durée d’une séance',
    fields: [
      num('session_count', 'Nombre de séances incluses', { required: true, placeholder: '1' }),
      select(
        'level',
        'Niveau',
        [
          { value: 'beginner', label: 'Débutant' },
          { value: 'intermediate', label: 'Intermédiaire' },
          { value: 'advanced', label: 'Avancé' },
          { value: 'all', label: 'Tous niveaux' },
        ],
        { required: true }
      ),
      select('audience', 'Public', [
        { value: 'individual', label: 'Particulier' },
        { value: 'professional', label: 'Professionnel' },
        { value: 'group', label: 'Groupe / entreprise' },
      ]),
    ],
  },
  'svc-redaction-traduction': {
    familySlug: 'svc-redaction-traduction',
    familyLabel: 'Rédaction & Traduction',
    headline: 'Livrable écrit sur projet',
    description: 'Volume, langues et délai. Pas de créneau obligatoire.',
    defaults: PROJECT,
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Délai de livraison estimé',
    fields: [
      num('word_count', 'Volume (mots)', { required: true, placeholder: '1000' }),
      select('language', 'Langue principale', LANGS, { required: true }),
      num('deadline_days', 'Délai (jours)', { required: true, placeholder: '5' }),
      text('tone', 'Ton / style', { placeholder: 'Professionnel, SEO, académique…' }),
    ],
  },
  'svc-photo-video-audiovisuel': {
    familySlug: 'svc-photo-video-audiovisuel',
    familyLabel: 'Photo, Vidéo & Audiovisuel',
    headline: 'Tournage ou post-production',
    description: 'Lieu, durée de captation et droits d’usage.',
    defaults: {
      ...APPOINTMENT,
      fulfillment_mode: 'both',
      location_type: 'customer_location',
      duration_minutes: 120,
      requires_staff: false,
    },
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Durée de prestation',
    fields: [
      num('shoot_hours', 'Durée de captation (heures)', { placeholder: '2' }),
      select(
        'usage_rights',
        'Droits d’usage',
        [
          { value: 'web', label: 'Web / réseaux' },
          { value: 'commercial', label: 'Commercial' },
          { value: 'unlimited', label: 'Illimité' },
          { value: 'personal', label: 'Usage personnel' },
        ],
        { required: true }
      ),
      text('delivery_format', 'Format de livraison', { placeholder: '4K, Reels, galerie…' }),
    ],
  },
  'svc-services-entreprises': {
    familySlug: 'svc-services-entreprises',
    familyLabel: 'Services aux entreprises',
    headline: 'Accompagnement B2B',
    description: 'Volume horaire et modalité (remote / sur site).',
    defaults: { ...PROJECT, fulfillment_mode: 'both', service_type: 'consultation' },
    requireSlots: false,
    staffRecommended: false,
    durationLabel: 'Durée d’une intervention',
    fields: [
      num('hours_per_month', 'Volume (heures / mois)', { placeholder: '20' }),
      select(
        'engagement',
        'Engagement',
        [
          { value: 'oneshot', label: 'Ponctuel' },
          { value: 'retainer', label: 'Récurrent / forfait' },
          { value: 'project', label: 'Projet borné' },
        ],
        { required: true }
      ),
      toggle('remote', 'Prestation 100 % à distance'),
    ],
  },
  'svc-maison-services-locaux': {
    familySlug: 'svc-maison-services-locaux',
    familyLabel: 'Maison & Services locaux',
    headline: 'Intervention sur site',
    description: 'Adresse du client, urgence et ampleur. Créneaux recommandés.',
    defaults: {
      ...APPOINTMENT,
      location_type: 'customer_location',
      duration_minutes: 90,
    },
    requireSlots: true,
    staffRecommended: true,
    durationLabel: 'Durée d’intervention estimée',
    fields: [
      num('surface_m2', 'Surface (m²)', { placeholder: '80' }),
      select(
        'urgency',
        'Urgence',
        [
          { value: 'standard', label: 'Standard' },
          { value: 'priority', label: 'Prioritaire (48 h)' },
          { value: 'emergency', label: 'Urgence' },
        ],
        { required: true }
      ),
      toggle('materials_included', 'Fournitures incluses'),
      area('access_notes', 'Accès / contraintes', { placeholder: 'Étage, stationnement…' }),
    ],
  },
  'svc-beaute-bien-etre': {
    familySlug: 'svc-beaute-bien-etre',
    familyLabel: 'Beauté & Bien-être',
    headline: 'Rendez-vous en salon ou à domicile',
    description: 'Durée, lieu et personnel. Les créneaux sont requis.',
    defaults: { ...APPOINTMENT, duration_minutes: 45 },
    requireSlots: true,
    staffRecommended: true,
    durationLabel: 'Durée de la séance',
    fields: [
      toggle('at_home', 'Déplacement à domicile possible'),
      select('for_whom', 'Public', [
        { value: 'women', label: 'Femmes' },
        { value: 'men', label: 'Hommes' },
        { value: 'all', label: 'Tous' },
        { value: 'children', label: 'Enfants' },
      ]),
      text('products_used', 'Produits / protocole', { placeholder: 'Optionnel' }),
    ],
  },
  'svc-transport-automobile': {
    familySlug: 'svc-transport-automobile',
    familyLabel: 'Transport & Automobile',
    headline: 'Course, livraison ou atelier',
    description: 'Zone desservie et type de véhicule / intervention.',
    defaults: {
      ...APPOINTMENT,
      location_type: 'customer_location',
      duration_minutes: 60,
    },
    requireSlots: true,
    staffRecommended: true,
    durationLabel: 'Durée estimée',
    fields: [
      text('service_zone', 'Zone desservie', {
        required: true,
        placeholder: 'Ex. Dakar, Abidjan…',
      }),
      select(
        'vehicle_type',
        'Type de véhicule / intervention',
        [
          { value: 'moto', label: 'Moto' },
          { value: 'car', label: 'Voiture' },
          { value: 'van', label: 'Utilitaire' },
          { value: 'workshop', label: 'Atelier / garage' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      toggle('round_trip', 'Aller-retour inclus'),
    ],
  },
  'svc-evenementiel': {
    familySlug: 'svc-evenementiel',
    familyLabel: 'Événementiel',
    headline: 'Prestation datée',
    description: 'Jauge, type d’événement et lieu. Date précisée au briefing.',
    defaults: {
      ...APPOINTMENT,
      fulfillment_mode: 'both',
      service_type: 'event',
      location_type: 'on_site',
      duration_minutes: 180,
    },
    requireSlots: false,
    staffRecommended: true,
    durationLabel: 'Durée de présence sur site',
    fields: [
      select(
        'event_type',
        'Type d’événement',
        [
          { value: 'wedding', label: 'Mariage' },
          { value: 'corporate', label: 'Entreprise' },
          { value: 'private', label: 'Privé' },
          { value: 'public', label: 'Public / festival' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      num('guest_count', 'Jauge estimée', { placeholder: '100' }),
      text('venue_city', 'Ville / lieu', { placeholder: 'Optionnel' }),
    ],
  },
  'svc-juridique-administratif': {
    familySlug: 'svc-juridique-administratif',
    familyLabel: 'Juridique & Administratif',
    headline: 'Consultation ou formalités',
    description: 'Domaine du droit et visio. Créneaux pour les consultations.',
    defaults: {
      ...APPOINTMENT,
      service_type: 'consultation',
      location_type: 'online',
      duration_minutes: 45,
      requires_staff: false,
    },
    requireSlots: true,
    staffRecommended: false,
    durationLabel: 'Durée de consultation',
    fields: [
      select(
        'legal_domain',
        'Domaine',
        [
          { value: 'business', label: 'Droit des affaires' },
          { value: 'labor', label: 'Droit du travail' },
          { value: 'civil', label: 'Droit civil' },
          { value: 'ip', label: 'Propriété intellectuelle' },
          { value: 'admin', label: 'Formalités / sociétés' },
          { value: 'other', label: 'Autre' },
        ],
        { required: true }
      ),
      toggle('documents_review', 'Revue de documents incluse'),
      area('prerequisites', 'Pièces à préparer', {
        placeholder: 'Statuts, contrat, pièce d’identité…',
      }),
    ],
  },
};

const OS_MOBILE: ServiceFormFieldOption[] = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'flutter', label: 'Flutter / cross-platform' },
  { value: 'other', label: 'Autre' },
];

const LEAF_EXTRA_FIELDS: Record<string, ServiceFormField[]> = {
  'svc-developpement-web': [
    select(
      'cms',
      'Plateforme',
      [
        { value: 'custom', label: 'Sur mesure' },
        { value: 'wordpress', label: 'WordPress' },
        { value: 'shopify', label: 'Shopify' },
        { value: 'webflow', label: 'Webflow' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-developpement-mobile': [
    select('mobile_os', 'Plateforme mobile', OS_MOBILE, { required: true }),
  ],
  'svc-creation-logiciels': [
    select(
      'software_type',
      'Type de logiciel',
      [
        { value: 'saas', label: 'SaaS / web app' },
        { value: 'desktop', label: 'Desktop' },
        { value: 'internal', label: 'Outil interne' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-maintenance-informatique': [
    select(
      'device_scope',
      'Périmètre',
      [
        { value: 'pc', label: 'PC / laptop' },
        { value: 'network', label: 'Réseau' },
        { value: 'server', label: 'Serveur' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-cybersecurite': [
    select(
      'security_scope',
      'Type d’audit',
      [
        { value: 'pentest', label: 'Pentest' },
        { value: 'audit', label: 'Audit' },
        { value: 'hardening', label: 'Durcissement' },
        { value: 'awareness', label: 'Sensibilisation' },
      ],
      { required: true }
    ),
  ],
  'svc-bases-de-donnees': [
    select(
      'db_engine',
      'Moteur',
      [
        { value: 'postgres', label: 'PostgreSQL' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'mongo', label: 'MongoDB' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-ia-automatisation': [
    select(
      'ai_use_case',
      'Cas d’usage',
      [
        { value: 'chatbot', label: 'Chatbot' },
        { value: 'workflow', label: 'Automatisation' },
        { value: 'data', label: 'Données / ML' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-support-technique': [
    select(
      'support_channel',
      'Canal',
      [
        { value: 'remote', label: 'À distance' },
        { value: 'onsite', label: 'Sur site' },
        { value: 'ticket', label: 'Ticketing' },
        { value: 'phone', label: 'Téléphone' },
      ],
      { required: true }
    ),
  ],
  'svc-installation-configuration': [
    text('software_target', 'Logiciel / matériel à installer', { required: true }),
  ],
  'svc-hebergement-serveurs': [
    select(
      'hosting_type',
      'Hébergement',
      [
        { value: 'vps', label: 'VPS' },
        { value: 'cloud', label: 'Cloud' },
        { value: 'dedicated', label: 'Dédié' },
        { value: 'email', label: 'Mail' },
      ],
      { required: true }
    ),
  ],
  'svc-creation-logos': [
    select(
      'logo_style',
      'Style',
      [
        { value: 'wordmark', label: 'Typographique' },
        { value: 'symbol', label: 'Symbole' },
        { value: 'mascot', label: 'Mascotte' },
        { value: 'minimal', label: 'Minimal' },
      ],
      { required: true }
    ),
  ],
  'svc-identite-visuelle': [
    flags(
      'brand_elements',
      'Éléments livrés',
      [
        { value: 'logo', label: 'Logo' },
        { value: 'colors', label: 'Couleurs' },
        { value: 'type', label: 'Typo' },
        { value: 'guide', label: 'Charte' },
      ],
      { required: true }
    ),
  ],
  'svc-design-graphique': [
    select(
      'graphic_use',
      'Usage',
      [
        { value: 'social', label: 'Réseaux sociaux' },
        { value: 'print', label: 'Print' },
        { value: 'ads', label: 'Publicité' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-ui-ux-design': [
    select(
      'ux_product',
      'Produit',
      [
        { value: 'web', label: 'Site / web app' },
        { value: 'mobile', label: 'App mobile' },
        { value: 'saas', label: 'SaaS' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-design-sites-web': [
    num('page_count', 'Nombre de pages maquettées', { required: true, placeholder: '8' }),
  ],
  'svc-flyers-affiches': [
    select(
      'print_format',
      'Format',
      [
        { value: 'a6', label: 'A6' },
        { value: 'a5', label: 'A5' },
        { value: 'a4', label: 'A4' },
        { value: 'a3', label: 'A3 / affiche' },
      ],
      { required: true }
    ),
  ],
  'svc-presentations-pro': [
    num('slide_count', 'Nombre de slides', { required: true, placeholder: '12' }),
  ],
  'svc-packaging': [text('packaged_product', 'Produit à packager', { required: true })],
  'svc-retouche-photo': [
    num('photo_count', 'Nombre de photos', { required: true, placeholder: '10' }),
  ],
  'svc-illustration': [
    select(
      'illustration_style',
      'Style',
      [
        { value: 'vector', label: 'Vectoriel' },
        { value: 'digital', label: 'Digital painting' },
        { value: 'comic', label: 'BD' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-marketing-digital': [
    select(
      'digital_focus',
      'Axe principal',
      [
        { value: 'acquisition', label: 'Acquisition' },
        { value: 'branding', label: 'Notoriété' },
        { value: 'retention', label: 'Rétention' },
        { value: 'full', label: 'Mix complet' },
      ],
      { required: true }
    ),
  ],
  'svc-community-management': [
    flags(
      'cm_platforms',
      'Plateformes',
      [
        { value: 'ig', label: 'Instagram' },
        { value: 'fb', label: 'Facebook' },
        { value: 'tt', label: 'TikTok' },
        { value: 'li', label: 'LinkedIn' },
      ],
      { required: true }
    ),
  ],
  'svc-gestion-reseaux-sociaux': [
    num('posts_per_week', 'Publications / semaine', { required: true, placeholder: '5' }),
  ],
  'svc-facebook-instagram-ads': [
    select(
      'meta_goal',
      'Objectif ads',
      [
        { value: 'traffic', label: 'Trafic' },
        { value: 'leads', label: 'Leads' },
        { value: 'sales', label: 'Ventes' },
        { value: 'awareness', label: 'Notoriété' },
      ],
      { required: true }
    ),
  ],
  'svc-google-ads': [
    select(
      'google_goal',
      'Objectif Google Ads',
      [
        { value: 'search', label: 'Search' },
        { value: 'shopping', label: 'Shopping' },
        { value: 'display', label: 'Display' },
        { value: 'youtube', label: 'YouTube' },
      ],
      { required: true }
    ),
  ],
  'svc-tiktok-ads': [
    select(
      'tiktok_goal',
      'Objectif TikTok Ads',
      [
        { value: 'views', label: 'Vues' },
        { value: 'traffic', label: 'Trafic' },
        { value: 'conversions', label: 'Conversions' },
      ],
      { required: true }
    ),
  ],
  'svc-seo': [
    select(
      'seo_scope',
      'Périmètre SEO',
      [
        { value: 'audit', label: 'Audit' },
        { value: 'content', label: 'Contenu' },
        { value: 'tech', label: 'Technique' },
        { value: 'local', label: 'Local' },
      ],
      { required: true }
    ),
  ],
  'svc-email-marketing': [
    num('list_size', 'Taille de liste (approx.)', { required: true, placeholder: '1000' }),
  ],
  'svc-copywriting-marketing': [
    select(
      'copy_asset',
      'Livrable',
      [
        { value: 'landing', label: 'Landing page' },
        { value: 'ads', label: 'Pubs' },
        { value: 'email', label: 'Emails' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-creation-contenu': [
    select(
      'content_format',
      'Format',
      [
        { value: 'posts', label: 'Posts' },
        { value: 'video', label: 'Vidéo courte' },
        { value: 'blog', label: 'Articles' },
        { value: 'mixed', label: 'Mix' },
      ],
      { required: true }
    ),
  ],
  'svc-strategie-marketing': [
    select(
      'strategy_horizon',
      'Horizon',
      [
        { value: '30d', label: '30 jours' },
        { value: '90d', label: '90 jours' },
        { value: 'year', label: 'Année' },
      ],
      { required: true }
    ),
  ],
  'svc-influence-rp': [
    select(
      'influencer_tier',
      'Profil influence',
      [
        { value: 'nano', label: 'Nano' },
        { value: 'micro', label: 'Micro' },
        { value: 'macro', label: 'Macro' },
        { value: 'pr', label: 'Presse / RP' },
      ],
      { required: true }
    ),
  ],
  'svc-coaching-professionnel': [text('coaching_theme', 'Thème du coaching', { required: true })],
  'svc-coaching-business': [
    select(
      'business_stage',
      'Stade',
      [
        { value: 'idea', label: 'Idée' },
        { value: 'launch', label: 'Lancement' },
        { value: 'growth', label: 'Croissance' },
        { value: 'scale', label: 'Scale' },
      ],
      { required: true }
    ),
  ],
  'svc-coaching-marketing': [text('marketing_skill', 'Compétence visée', { required: true })],
  'svc-formation-informatique': [text('it_topic', 'Sujet de formation', { required: true })],
  'svc-formation-ecommerce': [
    select(
      'ecom_platform',
      'Plateforme',
      [
        { value: 'shopify', label: 'Shopify' },
        { value: 'woocommerce', label: 'WooCommerce' },
        { value: 'emarzona', label: 'Emarzona' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-formation-langues': [select('teaching_lang', 'Langue enseignée', LANGS, { required: true })],
  'svc-tutorat': [
    select(
      'school_level',
      'Niveau',
      [
        { value: 'primary', label: 'Primaire' },
        { value: 'middle', label: 'Collège' },
        { value: 'high', label: 'Lycée' },
        { value: 'uni', label: 'Supérieur' },
      ],
      { required: true }
    ),
  ],
  'svc-mentorat': [text('mentor_domain', 'Domaine de mentorat', { required: true })],
  'svc-orientation-pro': [text('career_goal', 'Objectif professionnel', { required: true })],
  'svc-accompagnement-perso': [text('personal_goal', 'Objectif personnel', { required: true })],
  'svc-redaction-web': [
    select(
      'web_content_type',
      'Type de contenu',
      [
        { value: 'blog', label: 'Blog' },
        { value: 'product', label: 'Fiche produit' },
        { value: 'landing', label: 'Landing' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-copywriting-redaction': [
    select(
      'copy_goal',
      'Objectif',
      [
        { value: 'convert', label: 'Conversion' },
        { value: 'brand', label: 'Marque' },
        { value: 'launch', label: 'Lancement' },
      ],
      { required: true }
    ),
  ],
  'svc-correction-relecture': [
    select(
      'document_type',
      'Document',
      [
        { value: 'web', label: 'Web' },
        { value: 'book', label: 'Livre' },
        { value: 'academic', label: 'Académique' },
        { value: 'business', label: 'Pro' },
      ],
      { required: true }
    ),
  ],
  'svc-traduction': [
    select('source_lang', 'Langue source', LANGS, { required: true }),
    select('target_lang', 'Langue cible', LANGS, { required: true }),
  ],
  'svc-transcription': [
    select(
      'media_type',
      'Support',
      [
        { value: 'audio', label: 'Audio' },
        { value: 'video', label: 'Vidéo' },
        { value: 'meeting', label: 'Réunion' },
      ],
      { required: true }
    ),
  ],
  'svc-redaction-cv': [
    select(
      'cv_level',
      'Niveau',
      [
        { value: 'junior', label: 'Junior' },
        { value: 'confirmed', label: 'Confirmé' },
        { value: 'exec', label: 'Cadre' },
      ],
      { required: true }
    ),
  ],
  'svc-lettres-motivation': [
    text('application_target', 'Poste / formation visé(e)', { required: true }),
  ],
  'svc-redaction-rapports': [text('report_subject', 'Sujet du rapport', { required: true })],
  'svc-redaction-academique': [
    select(
      'academic_level',
      'Niveau',
      [
        { value: 'bachelor', label: 'Licence' },
        { value: 'master', label: 'Master' },
        { value: 'phd', label: 'Thèse' },
      ],
      { required: true }
    ),
  ],
  'svc-photographie': [
    select(
      'photo_event',
      'Type de shooting',
      [
        { value: 'portrait', label: 'Portrait' },
        { value: 'product', label: 'Produit' },
        { value: 'event', label: 'Événement' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-videographie': [
    select(
      'video_type',
      'Type de vidéo',
      [
        { value: 'promo', label: 'Promo' },
        { value: 'event', label: 'Événement' },
        { value: 'interview', label: 'Interview' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-montage-video': [
    num('footage_hours', 'Heures de rushes', { required: true, placeholder: '2' }),
  ],
  'svc-motion-design': [
    select(
      'motion_format',
      'Format',
      [
        { value: 'logo', label: 'Logo animé' },
        { value: 'explainer', label: 'Explainer' },
        { value: 'ads', label: 'Pub' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-animation-2d-3d': [
    select(
      'animation_kind',
      'Type',
      [
        { value: '2d', label: '2D' },
        { value: '3d', label: '3D' },
        { value: 'mixed', label: 'Mixte' },
      ],
      { required: true }
    ),
  ],
  'svc-voix-off': [select('voice_lang', 'Langue de la voix', LANGS, { required: true })],
  'svc-production-audiovisuelle': [
    select(
      'production_scale',
      'Échelle',
      [
        { value: 'short', label: 'Court' },
        { value: 'spot', label: 'Spot' },
        { value: 'documentary', label: 'Documentaire' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-creation-reels': [
    num('reel_count', 'Nombre de reels', { required: true, placeholder: '8' }),
  ],
  'svc-contenu-tiktok': [
    num('tiktok_count', 'Nombre de vidéos', { required: true, placeholder: '8' }),
  ],
  'svc-production-evenementielle': [
    text('event_name', 'Nom / type d’événement', { required: true }),
  ],
  'svc-creation-entreprise': [
    select(
      'legal_form',
      'Forme visée',
      [
        { value: 'sarl', label: 'SARL' },
        { value: 'sas', label: 'SAS / SASU' },
        { value: 'ei', label: 'Entreprise individuelle' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-domiciliation': [text('domicile_city', 'Ville de domiciliation', { required: true })],
  'svc-gestion-administrative': [
    num('docs_per_month', 'Volume docs / mois (approx.)', { required: true, placeholder: '30' }),
  ],
  'svc-secretariat-externalise': [
    num('hours_per_week', 'Heures / semaine', { required: true, placeholder: '10' }),
  ],
  'svc-assistance-virtuelle': [text('va_tools', 'Outils utilisés', { required: true })],
  'svc-centres-appels': [select('call_lang', 'Langue des appels', LANGS, { required: true })],
  'svc-prospection-commerciale': [
    select(
      'lead_channel',
      'Canal',
      [
        { value: 'phone', label: 'Téléphone' },
        { value: 'email', label: 'Email' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'mixed', label: 'Mix' },
      ],
      { required: true }
    ),
  ],
  'svc-televiente': [text('product_sold', 'Offre vendue', { required: true })],
  'svc-gestion-projets': [
    select(
      'methodology',
      'Méthode',
      [
        { value: 'agile', label: 'Agile' },
        { value: 'waterfall', label: 'Cycle en V' },
        { value: 'hybrid', label: 'Hybride' },
      ],
      { required: true }
    ),
  ],
  'svc-externalisation-services': [
    text('outsourced_function', 'Fonction externalisée', { required: true }),
  ],
  'svc-nettoyage': [
    select(
      'property_type',
      'Type de lieu',
      [
        { value: 'home', label: 'Maison' },
        { value: 'apartment', label: 'Appartement' },
        { value: 'office', label: 'Bureau' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-entretien': [
    select(
      'maintenance_freq',
      'Fréquence',
      [
        { value: 'once', label: 'Ponctuel' },
        { value: 'weekly', label: 'Hebdo' },
        { value: 'monthly', label: 'Mensuel' },
      ],
      { required: true }
    ),
  ],
  'svc-jardinage': [
    select(
      'garden_type',
      'Type d’espace',
      [
        { value: 'lawn', label: 'Pelouse' },
        { value: 'plants', label: 'Plantes' },
        { value: 'full', label: 'Jardin complet' },
      ],
      { required: true }
    ),
  ],
  'svc-plomberie': [
    select(
      'issue_type',
      'Type d’intervention',
      [
        { value: 'leak', label: 'Fuite' },
        { value: 'install', label: 'Installation' },
        { value: 'unclog', label: 'Débouchage' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-electricite': [
    select(
      'electrical_job',
      'Intervention',
      [
        { value: 'repair', label: 'Dépannage' },
        { value: 'install', label: 'Installation' },
        { value: 'upgrade', label: 'Mise aux normes' },
      ],
      { required: true }
    ),
  ],
  'svc-climatisation': [
    select(
      'ac_job',
      'Intervention',
      [
        { value: 'install', label: 'Pose' },
        { value: 'service', label: 'Entretien' },
        { value: 'repair', label: 'Réparation' },
      ],
      { required: true }
    ),
  ],
  'svc-peinture': [num('rooms_count', 'Nombre de pièces', { required: true, placeholder: '2' })],
  'svc-menuiserie': [
    select(
      'wood_job',
      'Ouvrage',
      [
        { value: 'door', label: 'Porte' },
        { value: 'furniture', label: 'Meuble' },
        { value: 'repair', label: 'Réparation' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-reparation': [text('item_to_repair', 'Objet à réparer', { required: true })],
  'svc-decoration-interieure': [text('room_focus', 'Pièce / espace', { required: true })],
  'svc-coiffure': [
    select(
      'service_focus',
      'Prestation',
      [
        { value: 'cut', label: 'Coupe' },
        { value: 'color', label: 'Coloration' },
        { value: 'braids', label: 'Tresses / locking' },
        { value: 'styling', label: 'Coiffage' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-maquillage': [
    select(
      'makeup_occasion',
      'Occasion',
      [
        { value: 'wedding', label: 'Mariage' },
        { value: 'event', label: 'Événement' },
        { value: 'daily', label: 'Quotidien' },
        { value: 'photo', label: 'Shooting' },
      ],
      { required: true }
    ),
  ],
  'svc-onglerie': [
    select(
      'nail_type',
      'Prestation',
      [
        { value: 'gel', label: 'Gel' },
        { value: 'acrylic', label: 'Résine' },
        { value: 'semi', label: 'Semi-permanent' },
        { value: 'care', label: 'Soin' },
      ],
      { required: true }
    ),
  ],
  'svc-esthetique': [text('aesthetic_care', 'Soin demandé', { required: true })],
  'svc-massage': [
    select(
      'massage_type',
      'Type de massage',
      [
        { value: 'relax', label: 'Relaxant' },
        { value: 'sport', label: 'Sportif' },
        { value: 'deep', label: 'Profond' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-spa': [
    select(
      'spa_formula',
      'Formule',
      [
        { value: 'massage', label: 'Massage' },
        { value: 'ritual', label: 'Rituel' },
        { value: 'day', label: 'Journée spa' },
      ],
      { required: true }
    ),
  ],
  'svc-coaching-sportif': [text('sport_goal', 'Objectif sportif', { required: true })],
  'svc-nutrition-bien-etre': [text('diet_goal', 'Objectif nutrition', { required: true })],
  'svc-beaute-domicile': [text('home_beauty_service', 'Prestation à domicile', { required: true })],
  'svc-livraison': [
    select(
      'parcel_type',
      'Type de colis',
      [
        { value: 'document', label: 'Document' },
        { value: 'small', label: 'Petit colis' },
        { value: 'medium', label: 'Moyen' },
        { value: 'fragile', label: 'Fragile' },
      ],
      { required: true }
    ),
  ],
  'svc-transport-personnes': [
    num('passenger_count', 'Nombre de passagers', { required: true, placeholder: '3' }),
  ],
  'svc-location-vehicules': [
    select(
      'vehicle_class',
      'Catégorie',
      [
        { value: 'eco', label: 'Éco' },
        { value: 'sedan', label: 'Berline' },
        { value: 'suv', label: 'SUV' },
        { value: 'van', label: 'Utilitaire' },
      ],
      { required: true }
    ),
  ],
  'svc-chauffeur-prive': [
    select(
      'trip_type',
      'Trajet',
      [
        { value: 'airport', label: 'Aéroport' },
        { value: 'city', label: 'Ville' },
        { value: 'event', label: 'Événement' },
        { value: 'day', label: 'Mise à disposition' },
      ],
      { required: true }
    ),
  ],
  'svc-entretien-automobile': [text('auto_service', 'Prestation entretien', { required: true })],
  'svc-reparation-automobile': [text('auto_repair', 'Panne / réparation', { required: true })],
  'svc-diagnostic-automobile': [text('vehicle_brand', 'Marque / modèle', { required: true })],
  'svc-lavage-automobile': [
    select(
      'wash_type',
      'Lavage',
      [
        { value: 'ext', label: 'Extérieur' },
        { value: 'int', label: 'Intérieur' },
        { value: 'full', label: 'Complet' },
      ],
      { required: true }
    ),
  ],
  'svc-assistance-routiere': [
    select(
      'breakdown_type',
      'Type de panne',
      [
        { value: 'battery', label: 'Batterie' },
        { value: 'tire', label: 'Pneu' },
        { value: 'tow', label: 'Remorquage' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-organisation-evenements': [
    select(
      'event_format',
      'Format',
      [
        { value: 'wedding', label: 'Mariage' },
        { value: 'corporate', label: 'Corporate' },
        { value: 'private', label: 'Privé' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-decoration-evenementielle': [text('event_theme', 'Thème / ambiance', { required: true })],
  'svc-traiteur': [
    select(
      'menu_style',
      'Style de menu',
      [
        { value: 'buffet', label: 'Buffet' },
        { value: 'plated', label: 'Assis' },
        { value: 'cocktail', label: 'Cocktail' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-photo-evenementielle': [
    num('coverage_hours', 'Heures de couverture', { required: true, placeholder: '6' }),
  ],
  'svc-video-evenementielle': [
    select(
      'video_deliverable',
      'Livrable',
      [
        { value: 'highlight', label: 'Highlight' },
        { value: 'full', label: 'Film complet' },
        { value: 'teaser', label: 'Teaser' },
      ],
      { required: true }
    ),
  ],
  'svc-dj-animation': [text('music_style', 'Style musical', { required: true })],
  'svc-location-materiel': [text('equipment_needed', 'Matériel demandé', { required: true })],
  'svc-sonorisation': [
    num('sound_capacity', 'Jauge (personnes)', { required: true, placeholder: '100' }),
  ],
  'svc-invitations-papeterie': [
    select(
      'invite_format',
      'Format',
      [
        { value: 'print', label: 'Imprimé' },
        { value: 'digital', label: 'Digital' },
        { value: 'both', label: 'Les deux' },
      ],
      { required: true }
    ),
  ],
  'svc-consultation-juridique': [
    select(
      'format',
      'Format',
      [
        { value: 'visio', label: 'Visio' },
        { value: 'phone', label: 'Téléphone' },
        { value: 'office', label: 'Cabinet' },
      ],
      { required: true }
    ),
  ],
  'svc-redaction-contrats': [text('contract_type', 'Type de contrat', { required: true })],
  'svc-creation-societes': [
    select(
      'company_form',
      'Forme sociale',
      [
        { value: 'sarl', label: 'SARL' },
        { value: 'sas', label: 'SAS' },
        { value: 'ei', label: 'EI' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-formalites-administratives': [text('formality_type', 'Formalité', { required: true })],
  'svc-propriete-intellectuelle': [
    select(
      'ip_type',
      'Objet',
      [
        { value: 'trademark', label: 'Marque' },
        { value: 'copyright', label: 'Droit d’auteur' },
        { value: 'patent', label: 'Brevet' },
        { value: 'other', label: 'Autre' },
      ],
      { required: true }
    ),
  ],
  'svc-droit-affaires': [text('business_matter', 'Sujet', { required: true })],
  'svc-mediation': [text('dispute_type', 'Nature du litige', { required: true })],
  'svc-assistance-juridique': [
    select(
      'legal_urgency',
      'Urgence',
      [
        { value: 'low', label: 'Conseil' },
        { value: 'medium', label: 'Sous 48h' },
        { value: 'high', label: 'Urgent' },
      ],
      { required: true }
    ),
  ],
};

const LEAF_TO_FAMILY: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_FAMILY_LEAVES).flatMap(([family, leaves]) =>
    leaves.map(leaf => [leaf, family])
  )
);

export function findServiceFamilySlug(
  parentSlug?: string | null,
  leafSlug?: string | null
): string | null {
  if (parentSlug && FAMILY_PROFILES[parentSlug]) return parentSlug;
  if (leafSlug && FAMILY_PROFILES[leafSlug]) return leafSlug;
  if (leafSlug && LEAF_TO_FAMILY[leafSlug]) return LEAF_TO_FAMILY[leafSlug];
  return null;
}

export function getServiceFormProfile(
  parentSlug?: string | null,
  leafSlug?: string | null
): ServiceFormProfile | null {
  const familySlug = findServiceFamilySlug(parentSlug, leafSlug);
  if (!familySlug) return null;
  const base = FAMILY_PROFILES[familySlug];
  if (!base) return null;
  const extras = leafSlug ? (LEAF_EXTRA_FIELDS[leafSlug] ?? []) : [];
  const seen = new Set(extras.map(f => f.key));
  return {
    ...base,
    fields: [...extras, ...base.fields.filter(f => !seen.has(f.key))],
  };
}

export function profileDefaultsPatch(profile: ServiceFormProfile): Partial<ServiceProductFormData> {
  return { ...profile.defaults };
}

export function listServiceLeafSlugs(): string[] {
  return Object.values(SERVICE_FAMILY_LEAVES).flat();
}

export function getServiceLeafExtraFields(leafSlug: string): ServiceFormField[] {
  return LEAF_EXTRA_FIELDS[leafSlug] ?? [];
}

export type ServiceCategoryAttributes = Record<string, string | number | boolean | string[]>;

export function validateServiceFormAttributes(
  profile: ServiceFormProfile | null,
  values: ServiceCategoryAttributes | undefined
): string[] {
  if (!profile) return [];
  const attrs = values || {};
  const errors: string[] = [];
  for (const field of profile.fields) {
    if (!field.required) continue;
    const value = attrs[field.key];
    const emptyArray = Array.isArray(value) && value.length === 0;
    if (value === undefined || value === null || value === '' || emptyArray) {
      errors.push(`${field.label} est requis pour ${profile.familyLabel}`);
    }
  }
  return errors;
}

export function formatServiceAttributeValue(
  field: ServiceFormField,
  value: ServiceCategoryAttributes[string] | undefined
): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) {
    return value.map(v => field.options?.find(o => o.value === v)?.label ?? v).join(', ');
  }
  if (field.options) {
    return field.options.find(o => o.value === String(value))?.label ?? String(value);
  }
  return String(value);
}
