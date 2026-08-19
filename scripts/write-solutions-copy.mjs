import { readFileSync, writeFileSync } from 'node:fs';

const a = '\u00e0';
const A = '\u00c0';
const c = '\u00e7';
const e = '\u00e9';
const E = '\u00c9';
const gr = '\u00e8';
const ea = '\u00ea';
const i = '\u00ee';
const o = '\u00f4';
const u = '\u00f9';
const ue = '\u00fb';
const inf = '\u221e';
const em = '\u2014';
const mdash = em;
const circ = '\u00e2';

const copy = {
  physical: {
    heroTag: 'Produits physiques',
    heroTitle: `Vendez, exp${e}diez et d${e}veloppez`,
    heroTitleHighlight: 'votre boutique physique.',
    heroSubtitle: `De la gestion de stock ${a} la livraison FedEx, en passant par le paiement ${a} la livraison et la garantie ${mdash} tout ce dont une boutique physique a besoin, sur une seule plateforme.`,
    statsItems: [
      { value: '20+', label: `cat${e}gories de produits` },
      { value: '3', label: 'modes de paiement physique' },
      { value: '100%', label: `automatis${e}` },
    ],
    categories: [
      `V${e}tements & Mode`,
      'Accessoires',
      'Artisanat',
      `${E}lectronique`,
      'Maison & Jardin',
      'Sport & Fitness',
      `Beaut${e} & Cosm${e}tiques`,
      'Livres & Papeterie',
      'Jouets & Jeux',
      `Alimentation & ${E}picerie`,
      `D${e}coration & Design`,
      'Bijoux & Montres',
      `Sant${e} & Bien-${e}tre`,
      `B${e}b${e} & Enfant`,
      'Animalerie',
      'Automobile & Moto',
      'Outils & Bricolage',
      'Jardinage & Plein air',
    ],
    features: [
      {
        title: 'Gestion de stock & variantes',
        description: `Suivi en temps r${e}el des quantit${e}s, gestion des tailles/couleurs/formats et alertes de rupture automatiques.`,
      },
      {
        title: `Exp${e}dition FedEx int${e}gr${e}e`,
        description: `Calcul de tarifs en direct, impression d'${e}tiquettes et suivi colis depuis votre tableau de bord.`,
      },
      {
        title: `Garantie ${a} la commande`,
        description: `Demandez un acompte au moment de la commande via mobile money, le client r${gr}gle le solde ${a} la livraison.`,
      },
      {
        title: `Paiement ${a} la livraison (COD)`,
        description: `Acceptez les paiements cash ou mobile money directement ${a} la livraison, sans risque de fraude.`,
      },
      {
        title: 'Contact WhatsApp sur fiche produit',
        description: `Un bouton WhatsApp directement sur la fiche permet ${a} l'acheteur de vous contacter avant d'acheter.`,
      },
      {
        title: 'Analytics & rapports de ventes',
        description: `Tableaux de bord en temps r${e}el : revenus, articles les plus vendus, retours, paniers abandonn${e}s.`,
      },
      {
        title: `R${e}cup${e}ration de paniers abandonn${e}s`,
        description: `Relances e-mail automatiques pour les clients qui n'ont pas finalis${e} leur commande.`,
      },
      {
        title: 'Multi-zones de livraison',
        description: `D${e}finissez vos propres tarifs par ville, r${e}gion ou pays et proposez la livraison gratuite ${a} partir d'un seuil.`,
      },
    ],
    steps: [
      {
        number: '01',
        title: `Cr${e}ez votre boutique en 5 minutes`,
        description: `Nom, logo, domaine personnalis${e}, th${gr}me ${mdash} votre boutique est en ligne imm${e}diatement.`,
      },
      {
        number: '02',
        title: 'Ajoutez vos produits',
        description: `Photos, variantes, prix, stock ${mdash} le wizard guid${e} vous accompagne ${a} chaque ${e}tape.`,
      },
      {
        number: '03',
        title: 'Vendez et encaissez',
        description: `Partagez votre lien boutique ou apparaissez sur le marketplace Emarzona. Payez en ligne, ${a} la livraison ou avec garantie.`,
      },
    ],
    seoTitle: 'Vendre des produits physiques en ligne | Emarzona',
    seoDescription: `Boutique e-commerce compl${gr}te pour vendre vos produits physiques : gestion de stock, livraison FedEx, COD, garantie et mobile money. Lancez-vous en 5 minutes.`,
  },
  digital: {
    heroTag: 'Produits digitaux',
    heroTitle: `Livrez instantan${e}ment,`,
    heroTitleHighlight: 'encaissez automatiquement.',
    heroSubtitle: `Ebooks, templates, logiciels, cours, musique ${mdash} vendez n'importe quel fichier num${e}rique avec livraison instantan${e}e, liens s${e}curis${e}s et protection contre le partage non autoris${e}.`,
    statsItems: [
      { value: '23+', label: 'types de produits digitaux' },
      { value: '0%', label: 'commission sur certains types' },
      { value: inf, label: `t${e}l${e}chargements par licence` },
    ],
    categories: [
      'Ebooks & Guides',
      `Templates & Mod${gr}les`,
      'Logiciels & Applications',
      'Formations & Cours',
      'Ressources graphiques',
      'Audio & Musique',
      `Vid${e}os & Montage`,
      'Plugins & Extensions',
      `Th${gr}mes & Presets`,
      'Scripts & Snippets',
      `Polices de caract${gr}res`,
      `Mod${gr}les 3D`,
      `Photos & Vid${e}os stock`,
      'Podcasts',
    ],
    features: [
      {
        title: `Livraison instantan${e}e s${e}curis${e}e`,
        description: `Le fichier est livr${e} d${gr}s la confirmation du paiement, via un lien tokenis${e} ${a} usage unique et ${a} dur${e}e limit${e}e.`,
      },
      {
        title: 'Protection DRM & licences',
        description: `Chaque achat g${e}n${gr}re une licence unique li${e}e ${a} l'acheteur, prot${e}geant votre contenu contre la redistribution.`,
      },
      {
        title: 'Bundles & packs de produits',
        description: `Regroupez plusieurs fichiers en un bundle vendu ${a} prix r${e}duit pour augmenter votre panier moyen.`,
      },
      {
        title: 'Vente internationale',
        description: 'Acceptez les paiements en FCFA, EUR, USD et plus de 30 devises. Vos clients partout dans le monde.',
      },
      {
        title: `Analytics de t${e}l${e}chargement`,
        description: `Suivez les t${e}l${e}chargements, les licences actives et les revenus par produit depuis votre tableau de bord.`,
      },
      {
        title: "Programme d'affiliation",
        description: `Cr${e}ez un r${e}seau de promoteurs qui partagent vos produits contre commission ${mdash} enti${gr}rement automatis${e}.`,
      },
    ],
    steps: [
      {
        number: '01',
        title: 'Uploadez votre fichier',
        description: `PDF, ZIP, MP3, MP4, EXE ${mdash} tous les formats jusqu'${a} 2 Go. H${e}bergement inclus.`,
      },
      {
        number: '02',
        title: 'Configurez votre offre',
        description: `Prix, pr${e}visualisation, restrictions de t${e}l${e}chargement, affili${e}s ${mdash} tout en un.`,
      },
      {
        number: '03',
        title: 'Partagez et encaissez',
        description: `Lien direct, page boutique ou marketplace. Le paiement arrive, le fichier part ${mdash} automatiquement.`,
      },
    ],
    seoTitle: 'Vendre des produits digitaux | Emarzona',
    seoDescription: `Plateforme de vente de produits digitaux : ebooks, templates, logiciels, musique. Livraison instantan${e}e, licences s${e}curis${e}es, affiliation automatis${e}e.`,
  },
  services: {
    heroTag: 'Services & prestations',
    heroTitle: 'Vendez votre expertise,',
    heroTitleHighlight: `automatisez les r${e}servations.`,
    heroSubtitle: `Consultation, coaching, design, d${e}veloppement, photographie ${mdash} proposez vos services avec calendrier de r${e}servation, paiement en ligne et gestion de client${gr}le int${e}gr${e}e.`,
    statsItems: [
      { value: '26+', label: `cat${e}gories de services` },
      { value: '100%', label: `r${e}servations automatis${e}es` },
      { value: '0', label: `no-show gr${circ}ce aux acomptes` },
    ],
    categories: [
      'Consultation & Coaching',
      'Design graphique',
      `D${e}veloppement web & mobile`,
      'Marketing & SEO',
      `R${e}daction & Traduction`,
      'UI/UX Design',
      'Illustration & Animation',
      `Vid${e}o & Montage`,
      'Audio & Musique',
      'Voix-off & Podcast',
      `R${e}seaux sociaux`,
      'Data & Analytics',
      'Cloud & DevOps',
      `Cybers${e}curit${e}`,
      'Support technique',
    ],
    features: [
      {
        title: `Calendrier de r${e}servation int${e}gr${e}`,
        description: `Vos disponibilit${e}s en ligne, r${e}servation en quelques clics pour vos clients, sans aller-retour par message.`,
      },
      {
        title: `Acomptes & paiement s${e}curis${e}`,
        description: `Exigez un acompte ${a} la r${e}servation pour ${e}viter les no-shows. Le client paie en ligne, vous ${e}tes prot${e}g${e}.`,
      },
      {
        title: 'Rappels automatiques',
        description: `Emails et notifications de rappel envoy${e}s automatiquement avant chaque rendez-vous.`,
      },
      {
        title: `Gestion des cr${e}neaux & dur${e}es`,
        description: `D${e}finissez la dur${e}e de vos prestations, vos jours de cong${e}, les pauses entre rendez-vous.`,
      },
      {
        title: "Liste d'attente",
        description: `Si votre agenda est complet, les clients peuvent rejoindre une liste d'attente et ${e}tre notifi${e}s automatiquement.`,
      },
      {
        title: `Avis v${e}rifi${e}s`,
        description: `Collectez des avis clients apr${gr}s chaque prestation pour construire votre r${e}putation sur la plateforme.`,
      },
    ],
    steps: [
      {
        number: '01',
        title: `Cr${e}ez votre offre de service`,
        description: `Titre, description, tarif, dur${e}e, modes de prestation (en ligne, en personne, hybride).`,
      },
      {
        number: '02',
        title: 'Configurez votre calendrier',
        description: `D${e}finissez vos disponibilit${e}s. Les clients voient vos cr${e}neaux libres en temps r${e}el.`,
      },
      {
        number: '03',
        title: `Acceptez les r${e}servations & encaissez`,
        description: `Les clients r${e}servent et paient en ligne. Vous recevez une notification et g${e}rez tout depuis votre dashboard.`,
      },
    ],
    seoTitle: 'Vendre des services en ligne | Emarzona',
    seoDescription: `Plateforme de vente de services : r${e}servation en ligne, calendrier int${e}gr${e}, acomptes, rappels automatiques. Parfait pour consultants, coachs, freelances.`,
  },
  courses: {
    heroTag: 'Cours en ligne',
    heroTitle: 'Enseignez au monde entier,',
    heroTitleHighlight: `mon${e}tisez votre savoir.`,
    heroSubtitle: `Cr${e}ez des formations compl${gr}tes avec vid${e}os, quiz, certificats et contenu drip. Vos ${e}l${gr}ves progressent ${a} leur rythme, vous encaissez en automatique ${mdash} comme Udemy, mais votre propre marque.`,
    statsItems: [
      { value: '23+', label: 'domaines de formation' },
      { value: '100%', label: `auto-h${e}berg${e}` },
      { value: inf, label: `${e}l${gr}ves simultan${e}s` },
    ],
    categories: [
      'Programmation & Tech',
      `Design & Cr${e}ativit${e}`,
      'Marketing Digital',
      'Business & Entrepreneuriat',
      'Langues',
      `Photographie & Vid${e}o`,
      'Musique & Production',
      `${E}criture & Communication`,
      `Sant${e} & Bien-${e}tre`,
      'Cuisine & Arts de table',
      'Sport & Fitness',
      'Finance & Investissement',
      `Psychologie & D${e}veloppement personnel`,
      'Art & Dessin',
      'Data Science & IA',
      `Cybers${e}curit${e}`,
    ],
    features: [
      {
        title: `Lecteur vid${e}o int${e}gr${e}`,
        description: `Uploadez vos vid${e}os directement, sans YouTube ni Vimeo. Lecture adaptative, sous-titres, vitesse de lecture.`,
      },
      {
        title: 'Contenu drip (publication progressive)',
        description: `D${e}bloquez les modules automatiquement selon l'avancement de l'${e}l${gr}ve ou un calendrier pr${e}d${e}fini.`,
      },
      {
        title: `Certificats de compl${e}tion`,
        description: `G${e}n${e}rez et ${e}mettez des certificats personnalis${e}s v${e}rifiables ${a} la fin de chaque formation.`,
      },
      {
        title: `Quiz & ${e}valuations`,
        description: `Int${e}grez des quiz interactifs ${a} chaque module pour tester la compr${e}hension de vos ${e}l${gr}ves.`,
      },
      {
        title: `Espace communaut${e}`,
        description: `Cr${e}ez un espace d'${e}change entre ${e}l${gr}ves et formateur directement dans la plateforme de formation.`,
      },
      {
        title: `Suivi de progression d${e}taill${e}`,
        description: `Tableaux de bord pour suivre l'avancement de chaque ${e}l${gr}ve, le taux de compl${e}tion et les r${e}sultats des quiz.`,
      },
    ],
    steps: [
      {
        number: '01',
        title: `Cr${e}ez votre formation`,
        description: `Structurez vos modules, uploadez vos vid${e}os, ajoutez quiz et ressources ${mdash} le tout en quelques heures.`,
      },
      {
        number: '02',
        title: 'Fixez votre prix',
        description: `Acc${gr}s unique, abonnement ou bundle de formations. Coupon de r${e}duction, prix de lancement.`,
      },
      {
        number: '03',
        title: 'Inscriptions & certificats',
        description: `Partagez votre page de cours. Les ${e}l${gr}ves s'inscrivent, progressent et re${c}oivent leur certificat automatiquement.`,
      },
    ],
    seoTitle: `Cr${e}er et vendre des cours en ligne | Emarzona`,
    seoDescription: `Plateforme de formation en ligne : vid${e}os, drip content, quiz, certificats, communaut${e}. Lancez votre ${ea}cole en ligne comme Udemy, avec votre marque.`,
  },
  artist: {
    heroTag: `Oeuvres & cr${e}ations`,
    heroTitle: `Exposez, vendez et prot${e}gez`,
    heroTitleHighlight: "vos oeuvres d'artiste.",
    heroSubtitle: `Galerie portfolio, ${e}ditions limit${e}es, certificats d'authenticit${e}, ench${gr}res publiques ${mdash} une vitrine premium pour les peintres, sculpteurs, illustrateurs, photographes et cr${e}ateurs.`,
    statsItems: [
      { value: '16+', label: 'disciplines artistiques' },
      { value: '100%', label: `tra${c}abilit${e} de provenance` },
      { value: '1', label: 'certificat par oeuvre' },
    ],
    categories: [
      'Peinture',
      'Dessin & Illustration',
      `Sculpture & C${e}ramique`,
      "Photographie d'art",
      `Art num${e}rique`,
      'Gravure & Estampe',
      'Collage & Techniques mixtes',
      'Art mural',
      'Art verrier',
      'Art textile',
      "Livre d'artiste",
    ],
    features: [
      {
        title: `Portfolio en ligne haute r${e}solution`,
        description: `Galerie immersive avec zoom, d${e}tails de l'oeuvre, dimensions, mat${e}riaux et prix. Impression de votre univers artistique.`,
      },
      {
        title: `${E}ditions limit${e}es & num${e}rot${e}es`,
        description: `Cr${e}ez des s${e}ries limit${e}es num${e}rot${e}es. Chaque acheteur sait qu'il poss${gr}de l'original ou un num${e}ro unique.`,
      },
      {
        title: `Certificat d'authenticit${e} num${e}rique`,
        description: `Chaque vente g${e}n${gr}re un certificat v${e}rifiable en ligne avec QR code, pr${e}venant les contrefa${c}ons.`,
      },
      {
        title: `Ench${gr}res publiques`,
        description: `Proposez vos oeuvres ${a} l'ench${gr}re et laissez le march${e} fixer le prix. Fonctionnement s${e}curis${e} avec mise ${a} prix.`,
      },
      {
        title: 'Collections & expositions',
        description: `Organisez vos oeuvres en collections th${e}matiques ou chronologiques pour une meilleure mise en valeur.`,
      },
      {
        title: 'Historique de provenance',
        description: `Chaque transfert de propri${e}t${e} est enregistr${e}, constituant un pedigree num${e}rique immuable pour l'oeuvre.`,
      },
    ],
    steps: [
      {
        number: '01',
        title: `Cr${e}ez votre galerie`,
        description: `Bio d'artiste, portfolio, style, disciplines ${mdash} votre page est votre carte de visite professionnelle.`,
      },
      {
        number: '02',
        title: 'Publiez vos oeuvres',
        description: `Photos haute r${e}solution, description, dimensions, ${e}dition, prix. Certificat d'authenticit${e} g${e}n${e}r${e} automatiquement.`,
      },
      {
        number: '03',
        title: 'Vendez & documentez',
        description: `Achat direct ou ench${gr}re. ${A} chaque vente, le certificat et la provenance sont transmis au nouvel acqu${e}reur.`,
      },
    ],
    seoTitle: "Vendre des oeuvres d'artiste en ligne | Emarzona",
    seoDescription: `Galerie e-commerce pour artistes : peinture, sculpture, illustration, photographie. Certificats d'authenticit${e}, ${e}ditions limit${e}es, ench${gr}res publiques.`,
  },
  protect: {
    heroTag: 'Protection acheteur',
    heroTitle: 'Achetez en confiance,',
    heroTitleHighlight: `Emarzona vous prot${gr}ge.`,
    heroSubtitle: `Emarzona Protect couvre chaque commande ${e}ligible : produits non re${c}us, non conformes, t${e}l${e}chargements d${e}faillants. R${e}clamez sous 45 jours, remboursement assist${e} garanti.`,
    statsItems: [
      { value: '45', label: `jours pour r${e}clamer` },
      { value: '5', label: 'types de produits couverts' },
      { value: '100%', label: "sans frais pour l'acheteur" },
    ],
    categories: [
      'Produits physiques',
      'Produits digitaux',
      'Services',
      'Cours en ligne',
      "Oeuvres d'artiste",
    ],
    features: [
      {
        title: `Fen${e}tre de r${e}clamation de 45 jours`,
        description: "Vous avez 45 jours apr\u00e8s la commande pour ouvrir un litige si quelque chose ne va pas.",
      },
      {
        title: 'Couverture sur tous les types',
        description: `Physique, digital, service, cours, artiste ${mdash} Emarzona Protect couvre les 5 verticaux de la plateforme.`,
      },
      {
        title: `Remboursement assist${e}`,
        description: `Un m${e}diateur Emarzona analyse chaque litige. Remboursement partiel ou total selon le cas.`,
      },
      {
        title: 'Protection contre la non-livraison',
        description: `Produit non re${c}u, acc${gr}s non accord${e}, fichier corrompu ${mdash} autant de motifs valides de r${e}clamation.`,
      },
      {
        title: `M${e}diation ${e}quitable`,
        description: `Syst${gr}me de preuve des deux c${o}t${e}s. La d${e}cision finale prot${gr}ge autant l'acheteur que le vendeur de bonne foi.`,
      },
      {
        title: "Sans frais pour l'acheteur",
        description: `Emarzona Protect est inclus dans chaque commande ${e}ligible. Aucun abonnement, aucun frais cach${e}.`,
      },
    ],
    steps: [
      {
        number: '01',
        title: 'Commandez sur Emarzona',
        description: `Toute commande ${e}ligible est automatiquement couverte. Aucune action requise.`,
      },
      {
        number: '02',
        title: `Ouvrez un litige si n${e}cessaire`,
        description: `Dans les 45 jours, depuis votre espace client, d${e}crivez le probl${gr}me et ajoutez vos preuves.`,
      },
      {
        number: '03',
        title: `R${e}solution rapide`,
        description: `L'${e}quipe Emarzona m${e}diatise et tranche. Remboursement trait${e} sous 5 ${a} 10 jours ouvr${e}s.`,
      },
    ],
    seoTitle: `Emarzona Protect ${mdash} Protection acheteur | Emarzona`,
    seoDescription: `Protection acheteur Emarzona : 45 jours pour r${e}clamer, couverture sur les 5 types de produits, remboursement assist${e} sans frais. Achetez en confiance.`,
  },
};

writeFileSync('src/config/solutions-pages-copy.json', JSON.stringify(copy, null, 2), 'utf8');
const check = JSON.parse(readFileSync('src/config/solutions-pages-copy.json', 'utf8'));
if (!check.courses.heroTitleHighlight.includes('\u00e9')) {
  throw new Error('UTF-8 write failed');
}
if (check.courses.heroSubtitle.includes('\uFFFD')) {
  throw new Error('Replacement character in copy');
}
console.log('Wrote solutions-pages-copy.json', check.courses.heroTitleHighlight);
