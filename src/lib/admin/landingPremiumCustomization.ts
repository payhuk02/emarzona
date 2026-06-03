/**
 * Configuration admin pour la page d'accueil premium (landingPremium).
 * Les `id` correspondent aux clés i18n (sans préfixe landingPremium).
 */

import {
  Home,
  Menu,
  Star,
  Package,
  Zap,
  DollarSign,
  Globe,
  Store,
  Coins,
  Mail,
  Megaphone,
  Settings,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import landingPremiumFR from '@/i18n/locales/landing-premium/fr.json';
import {
  FOOTER_COLUMNS,
  FOOTER_LEGAL_LINKS,
  FOOTER_SOCIAL_NETWORKS,
} from '@/lib/admin/footerLinksConfig';

export const LANDING_PREMIUM_PAGE_ID = 'landingPremium';

export type LandingPremiumElementType = 'text' | 'textarea' | 'image' | 'color' | 'url' | 'email';

export interface LandingPremiumElement {
  id: string;
  label: string;
  type: LandingPremiumElementType;
  defaultValue?: string;
  description?: string;
}

export interface LandingPremiumSection {
  id: string;
  name: string;
  icon: LucideIcon;
  elements: LandingPremiumElement[];
}

const lp = landingPremiumFR;

function text(id: string, label: string, defaultValue: string): LandingPremiumElement {
  return { id, label, type: 'text', defaultValue };
}

function area(id: string, label: string, defaultValue: string): LandingPremiumElement {
  return { id, label, type: 'textarea', defaultValue };
}

function url(
  id: string,
  label: string,
  defaultValue: string,
  description?: string
): LandingPremiumElement {
  return { id, label, type: 'url', defaultValue, description };
}

function email(id: string, label: string, defaultValue: string): LandingPremiumElement {
  return { id, label, type: 'email', defaultValue };
}

function itemFields(
  prefix: string,
  items: { title: string; desc: string }[],
  cardLabel: string
): LandingPremiumElement[] {
  return items.flatMap((item, i) => [
    text(`${prefix}.${i}.title`, `${cardLabel} ${i + 1} — Titre`, item.title),
    area(`${prefix}.${i}.desc`, `${cardLabel} ${i + 1} — Description`, item.desc),
  ]);
}

function stringListFields(
  prefix: string,
  items: string[],
  itemLabel: string
): LandingPremiumElement[] {
  return items.map((value, i) => text(`${prefix}.${i}`, `${itemLabel} ${i + 1}`, value));
}

export const FOOTER_CUSTOMIZATION_SECTION_ID = 'footer';

export const LANDING_PREMIUM_SECTIONS: LandingPremiumSection[] = [
  {
    id: 'seo',
    name: 'SEO & marque',
    icon: Search,
    elements: [
      text('seo.title', 'Titre SEO', lp.seo.title),
      area('seo.description', 'Description SEO', lp.seo.description),
      text('logoAlt', 'Texte alternatif logo', lp.logoAlt),
    ],
  },
  {
    id: 'nav',
    name: 'Navigation',
    icon: Menu,
    elements: [
      text('nav.marketplace', 'Lien Marketplace', lp.nav.marketplace),
      text('nav.features', 'Lien Fonctionnalités', lp.nav.features),
      text('nav.solutions', 'Lien Solutions', lp.nav.solutions),
      text('nav.pricing', 'Lien Tarifs', lp.nav.pricing),
      text('nav.resources', 'Lien Ressources', lp.nav.resources),
      text('nav.about', 'Lien À propos', lp.nav.about),
      text('nav.login', 'Bouton Connexion', lp.nav.login),
      text('nav.getStarted', 'Bouton Démarrer (desktop)', lp.nav.getStarted),
      text('nav.getStartedShort', 'Bouton Démarrer (mobile)', lp.nav.getStartedShort),
      text('nav.menuOpen', 'Menu — ouvrir', lp.nav.menuOpen),
      text('nav.menuClose', 'Menu — fermer', lp.nav.menuClose),
    ],
  },
  {
    id: 'hero',
    name: 'Hero',
    icon: Home,
    elements: [
      text('hero.eyebrow', 'Surtitre', lp.hero.eyebrow),
      text('hero.titleLine1', 'Titre — ligne 1', lp.hero.titleLine1),
      text('hero.titleLine2', 'Titre — ligne 2', lp.hero.titleLine2),
      text('hero.titleHighlight', 'Titre — accent', lp.hero.titleHighlight),
      area('hero.subtitle', 'Sous-titre', lp.hero.subtitle),
      text('hero.ctaPrimary', 'CTA principal', lp.hero.ctaPrimary),
      text('hero.ctaSecondary', 'CTA secondaire', lp.hero.ctaSecondary),
      text('hero.caption', 'Légende visuel', lp.hero.caption),
      text('hero.trust.noCard', 'Confiance — sans carte', lp.hero.trust.noCard),
      text('hero.trust.instant', 'Confiance — installation', lp.hero.trust.instant),
      text('hero.trust.support', 'Confiance — support', lp.hero.trust.support),
      text('compass.globeAlt', 'Alt globe hero', lp.compass.globeAlt),
      text('compass.orbit.physical', 'Orbite — Physique', lp.compass.orbit.physical),
      text('compass.orbit.digital', 'Orbite — Digital', lp.compass.orbit.digital),
      text('compass.orbit.service', 'Orbite — Service', lp.compass.orbit.service),
      text('compass.orbit.course', 'Orbite — Cours', lp.compass.orbit.course),
      text('compass.orbit.artist', 'Orbite — Artiste', lp.compass.orbit.artist),
    ],
  },
  {
    id: 'trustLogos',
    name: 'Bandeau confiance',
    icon: Star,
    elements: [text('trustLogos.title', 'Titre', lp.trustLogos.title)],
  },
  {
    id: 'sellWays',
    name: 'Modèles de vente',
    icon: Package,
    elements: [
      text('sellWays.eyebrow', 'Surtitre', lp.sellWays.eyebrow),
      text('sellWays.titleLine1', 'Titre — ligne 1', lp.sellWays.titleLine1),
      text('sellWays.titleLine2', 'Titre — ligne 2', lp.sellWays.titleLine2),
      area('sellWays.subtitle', 'Sous-titre', lp.sellWays.subtitle),
      ...itemFields('sellWays.items', lp.sellWays.items, 'Carte'),
    ],
  },
  {
    id: 'features',
    name: 'Fonctionnalités',
    icon: Zap,
    elements: [
      text('features.eyebrow', 'Surtitre', lp.features.eyebrow),
      text('features.title', 'Titre', lp.features.title),
      text('features.titleHighlight', 'Titre — accent', lp.features.titleHighlight),
      area('features.subtitle', 'Sous-titre', lp.features.subtitle),
      ...itemFields('features.items', lp.features.items, 'Fonctionnalité'),
    ],
  },
  {
    id: 'adapt',
    name: 'Section Adapt',
    icon: Settings,
    elements: [
      text('adapt.eyebrow', 'Surtitre', lp.adapt.eyebrow),
      text('adapt.title', 'Titre', lp.adapt.title),
      text('adapt.titleHighlight', 'Titre — accent', lp.adapt.titleHighlight),
      area('adapt.subtitle', 'Sous-titre', lp.adapt.subtitle),
      ...stringListFields('adapt.benefits', lp.adapt.benefits, 'Avantage'),
      text('adapt.ctaPrimary', 'CTA principal', lp.adapt.ctaPrimary),
      text('adapt.ctaSecondary', 'CTA secondaire', lp.adapt.ctaSecondary),
      text('adapt.photoAlt', 'Alt photo', lp.adapt.photoAlt),
      text('adapt.cardRevenue', 'Carte — libellé revenus', lp.adapt.cardRevenue),
      text('adapt.cardGrowth', 'Carte — croissance', lp.adapt.cardGrowth),
      text('adapt.cardSatisfaction', 'Carte — satisfaction', lp.adapt.cardSatisfaction),
      text('adapt.cardReviews', 'Carte — avis', lp.adapt.cardReviews),
    ],
  },
  {
    id: 'storesMarquee',
    name: 'Boutiques (marquee)',
    icon: Store,
    elements: [
      text('storesMarquee.title', 'Titre', lp.storesMarquee.title),
      text('storesMarquee.storeLabel', 'Libellé boutique', lp.storesMarquee.storeLabel),
    ],
  },
  {
    id: 'countries',
    name: 'Pays',
    icon: Globe,
    elements: [
      text('countries.eyebrow', 'Surtitre', lp.countries.eyebrow),
      text('countries.titleLine1', 'Titre — ligne 1', lp.countries.titleLine1),
      text(
        'countries.titleHighlight',
        'Titre — accent (utiliser {{count}})',
        lp.countries.titleHighlight
      ),
      area('countries.subtitle', 'Sous-titre', lp.countries.subtitle),
      text('countries.regions.africa', 'Région Afrique', lp.countries.regions.africa),
      text('countries.regions.europe', 'Région Europe', lp.countries.regions.europe),
      text('countries.regions.americas', 'Région Amériques', lp.countries.regions.americas),
      text('countries.regions.middleEast', 'Région Moyen-Orient', lp.countries.regions.middleEast),
    ],
  },
  {
    id: 'currencies',
    name: 'Devises',
    icon: Coins,
    elements: [
      text('currencies.eyebrow', 'Surtitre', lp.currencies.eyebrow),
      text('currencies.titleLine1', 'Titre — ligne 1', lp.currencies.titleLine1),
      text('currencies.titleHighlight', 'Titre — accent', lp.currencies.titleHighlight),
      area('currencies.subtitle', 'Sous-titre (utiliser {{count}})', lp.currencies.subtitle),
    ],
  },
  {
    id: 'pricing',
    name: 'Tarifs',
    icon: DollarSign,
    elements: [
      text('pricing.eyebrow', 'Surtitre', lp.pricing.eyebrow),
      text('pricing.title', 'Titre', lp.pricing.title),
      text('pricing.titleHighlight', 'Titre — accent', lp.pricing.titleHighlight),
      area('pricing.subtitle', 'Sous-titre', lp.pricing.subtitle),
      area('pricing.footnote', 'Note de bas de page', lp.pricing.footnote),
      text('pricing.periodMonth', 'Période — mois', lp.pricing.periodMonth),
      text('pricing.periodSale', 'Période — vente', lp.pricing.periodSale),
      // Plans physiques (Basic/Standard/Premium)
      text(
        'pricing.physicalBasic.name',
        'Physique Basic — nom',
        lp.pricing.physicalBasic?.name ?? ''
      ),
      text(
        'pricing.physicalBasic.badge',
        'Physique Basic — badge',
        lp.pricing.physicalBasic?.badge ?? ''
      ),
      area(
        'pricing.physicalBasic.desc',
        'Physique Basic — description',
        lp.pricing.physicalBasic?.desc ?? ''
      ),
      text(
        'pricing.physicalBasic.cta',
        'Physique Basic — CTA',
        lp.pricing.physicalBasic?.cta ?? ''
      ),
      ...stringListFields(
        'pricing.physicalBasic.features',
        lp.pricing.physicalBasic?.features ?? [],
        'Physique Basic — fonctionnalité'
      ),

      text(
        'pricing.physicalStandard.name',
        'Physique Standard — nom',
        lp.pricing.physicalStandard?.name ?? ''
      ),
      text(
        'pricing.physicalStandard.badge',
        'Physique Standard — badge',
        lp.pricing.physicalStandard?.badge ?? ''
      ),
      area(
        'pricing.physicalStandard.desc',
        'Physique Standard — description',
        lp.pricing.physicalStandard?.desc ?? ''
      ),
      text(
        'pricing.physicalStandard.cta',
        'Physique Standard — CTA',
        lp.pricing.physicalStandard?.cta ?? ''
      ),
      ...stringListFields(
        'pricing.physicalStandard.features',
        lp.pricing.physicalStandard?.features ?? [],
        'Physique Standard — fonctionnalité'
      ),

      text(
        'pricing.physicalPremium.name',
        'Physique Premium — nom',
        lp.pricing.physicalPremium?.name ?? ''
      ),
      text(
        'pricing.physicalPremium.badge',
        'Physique Premium — badge',
        lp.pricing.physicalPremium?.badge ?? ''
      ),
      area(
        'pricing.physicalPremium.desc',
        'Physique Premium — description',
        lp.pricing.physicalPremium?.desc ?? ''
      ),
      text(
        'pricing.physicalPremium.cta',
        'Physique Premium — CTA',
        lp.pricing.physicalPremium?.cta ?? ''
      ),
      ...stringListFields(
        'pricing.physicalPremium.features',
        lp.pricing.physicalPremium?.features ?? [],
        'Physique Premium — fonctionnalité'
      ),

      // Plan commission (digital/services/cours/œuvres)
      text('pricing.commission.name', 'Commission — nom', lp.pricing.commission?.name ?? ''),
      text('pricing.commission.badge', 'Commission — badge', lp.pricing.commission?.badge ?? ''),
      area(
        'pricing.commission.desc',
        'Commission — description',
        lp.pricing.commission?.desc ?? ''
      ),
      text('pricing.commission.cta', 'Commission — CTA', lp.pricing.commission?.cta ?? ''),
      ...stringListFields(
        'pricing.commission.features',
        lp.pricing.commission?.features ?? [],
        'Commission — fonctionnalité'
      ),
    ],
  },
  {
    id: 'cta',
    name: 'CTA final',
    icon: Megaphone,
    elements: [
      text('cta.titleLine1', 'Titre — ligne 1', lp.cta.titleLine1),
      text('cta.titleLine2', 'Titre — ligne 2', lp.cta.titleLine2),
      area('cta.subtitle', 'Sous-titre', lp.cta.subtitle),
      text('cta.ctaPrimary', 'CTA principal', lp.cta.ctaPrimary),
      text('cta.ctaSecondary', 'CTA secondaire', lp.cta.ctaSecondary),
      text('cta.globeAria', 'Aria-label globe', lp.cta.globeAria),
    ],
  },
  {
    id: 'footer',
    name: 'Pied de page',
    icon: Mail,
    elements: [
      area('footer.tagline', 'Accroche', lp.footer.tagline),
      text('footer.newsletter', 'Titre newsletter', lp.footer.newsletter),
      text('footer.newsletterDesc', 'Description newsletter', lp.footer.newsletterDesc),
      text('footer.emailPlaceholder', 'Placeholder e-mail', lp.footer.emailPlaceholder),
      text('footer.subscribe', 'Bouton inscription', lp.footer.subscribe),
      text('footer.copyright', 'Copyright (utiliser {{year}})', lp.footer.copyright),
      text('footer.terms', 'Conditions', lp.footer.terms),
      text('footer.privacy', 'Confidentialité', lp.footer.privacy),
      text('footer.cookies', 'Cookies', lp.footer.cookies),
      text(
        'footer.columns.product.title',
        'Colonne Produit — titre',
        lp.footer.columns.product.title
      ),
      text(
        'footer.columns.product.features',
        'Lien Fonctionnalités',
        lp.footer.columns.product.features
      ),
      text(
        'footer.columns.product.marketplace',
        'Lien Marketplace',
        lp.footer.columns.product.marketplace
      ),
      text('footer.columns.product.pricing', 'Lien Tarifs', lp.footer.columns.product.pricing),
      text(
        'footer.columns.product.integrations',
        'Lien Intégrations',
        lp.footer.columns.product.integrations
      ),
      text(
        'footer.columns.resources.title',
        'Colonne Ressources — titre',
        lp.footer.columns.resources.title
      ),
      text('footer.columns.resources.blog', 'Lien Blog', lp.footer.columns.resources.blog),
      text('footer.columns.resources.docs', 'Lien Documentation', lp.footer.columns.resources.docs),
      text('footer.columns.resources.help', "Lien Centre d'aide", lp.footer.columns.resources.help),
      text(
        'footer.columns.resources.community',
        'Lien Communauté',
        lp.footer.columns.resources.community
      ),
      text(
        'footer.columns.company.title',
        'Colonne Entreprise — titre',
        lp.footer.columns.company.title
      ),
      text('footer.columns.company.about', 'Lien À propos', lp.footer.columns.company.about),
      text('footer.columns.company.contact', 'Lien Contact', lp.footer.columns.company.contact),
      text('footer.columns.company.careers', 'Lien Carrières', lp.footer.columns.company.careers),
      text('footer.columns.company.press', 'Lien Presse', lp.footer.columns.company.press),
      ...FOOTER_COLUMNS.flatMap(col =>
        col.links.map(link =>
          url(
            link.hrefKey,
            `URL — ${link.linkKey} (${col.colKey})`,
            link.defaultHref,
            'Chemin interne (/about), ancre (/#tarifs), mailto: ou URL externe https://'
          )
        )
      ),
      ...FOOTER_LEGAL_LINKS.map(link =>
        url(link.hrefKey, `URL — ${link.linkKey}`, link.defaultHref)
      ),
      ...FOOTER_SOCIAL_NETWORKS.map(s =>
        url(s.hrefKey, `Réseau — ${s.network}`, s.defaultHref, 'Laisser vide pour masquer l’icône')
      ),
      email('footer.contactEmail', 'E-mail contact (fallback)', 'contact@emarzona.com'),
    ],
  },
];
