-- FAQ plateforme Emarzona : catégories, entrées, lecture publique et gestion admin

CREATE TABLE IF NOT EXISTS public.platform_faq_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'seller', 'buyer')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.platform_faq_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_faq_items_category
  ON public.platform_faq_items(category_id);

CREATE INDEX IF NOT EXISTS idx_platform_faq_items_active
  ON public.platform_faq_items(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_platform_faq_categories_active
  ON public.platform_faq_categories(is_active)
  WHERE is_active = true;

ALTER TABLE public.platform_faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_faq_categories_public_select
  ON public.platform_faq_categories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY platform_faq_items_public_select
  ON public.platform_faq_items
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1
      FROM public.platform_faq_categories c
      WHERE c.id = category_id AND c.is_active = true
    )
  );

CREATE POLICY platform_faq_categories_admin_all
  ON public.platform_faq_categories
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY platform_faq_items_admin_all
  ON public.platform_faq_items
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TRIGGER platform_faq_categories_updated_at
  BEFORE UPDATE ON public.platform_faq_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER platform_faq_items_updated_at
  BEFORE UPDATE ON public.platform_faq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_public_platform_faqs()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'slug', c.slug,
        'title', c.title,
        'description', c.description,
        'audience', c.audience,
        'sort_order', c.sort_order,
        'items', (
          SELECT COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'id', i.id,
                'question', i.question,
                'answer', i.answer,
                'keywords', i.keywords,
                'sort_order', i.sort_order
              )
              ORDER BY i.sort_order, i.created_at
            ),
            '[]'::jsonb
          )
          FROM public.platform_faq_items i
          WHERE i.category_id = c.id AND i.is_active = true
        )
      )
      ORDER BY c.sort_order, c.created_at
    ),
    '[]'::jsonb
  )
  FROM public.platform_faq_categories c
  WHERE c.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_platform_faqs() TO anon, authenticated;

-- Seed : catégories et questions fréquentes Emarzona
INSERT INTO public.platform_faq_categories (slug, title, description, audience, sort_order)
VALUES
  (
    'getting-started',
    'Démarrer sur Emarzona',
    'Création de boutique, types de commerce et premiers pas pour les vendeurs.',
    'seller',
    10
  ),
  (
    'product-types',
    'Types de produits',
    'Les cinq verticaux Emarzona : digital, physique, service, cours et artiste.',
    'all',
    20
  ),
  (
    'payments',
    'Paiements et commissions',
    'Encaissement, Moneroo, commissions plateforme et facturation.',
    'all',
    30
  ),
  (
    'orders-shipping',
    'Commandes et livraison',
    'Suivi de commande, expédition FedEx et fulfillment post-paiement.',
    'all',
    40
  ),
  (
    'digital-courses',
    'Produits digitaux et cours',
    'Téléchargements sécurisés, cours en ligne et inscriptions gratuites.',
    'all',
    50
  ),
  (
    'account-security',
    'Compte et sécurité',
    'Authentification, données personnelles et litiges.',
    'all',
    60
  ),
  (
    'buyers',
    'Guide acheteur',
    'Achat sans compte, contact vendeur, remboursements et affiliation.',
    'buyer',
    70
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.platform_faq_items (category_id, question, answer, keywords, sort_order)
SELECT c.id, v.question, v.answer, v.keywords, v.sort_order
FROM public.platform_faq_categories c
JOIN (
  VALUES
    (
      'getting-started',
      'Qu''est-ce qu''Emarzona ?',
      'Emarzona est une plateforme e-commerce tout-en-un qui permet de vendre des produits digitaux, physiques, des services, des cours en ligne et des œuvres d''artistes depuis une boutique personnalisée. Vous gérez catalogue, commandes, paiements et clients au même endroit.',
      ARRAY['emarzona', 'plateforme', 'e-commerce', 'boutique'],
      10
    ),
    (
      'getting-started',
      'Comment créer ma première boutique ?',
      'Inscrivez-vous sur emarzona.com, complétez votre profil vendeur, choisissez le type de commerce dans les paramètres de la boutique, puis ajoutez vos premiers produits depuis le tableau de bord. Votre boutique est accessible sur un sous-domaine myemarzona.shop.',
      ARRAY['création', 'boutique', 'onboarding', 'vendeur'],
      20
    ),
    (
      'getting-started',
      'Quels types de commerce puis-je choisir ?',
      'Emarzona propose cinq verticaux : digital (fichiers et licences), physique (stock et livraison), service (réservations et créneaux), cours (formation en ligne) et artiste (œuvres et éditions). Le type choisi oriente les fonctionnalités disponibles dans votre tableau de bord.',
      ARRAY['verticaux', 'type commerce', 'digital', 'physique'],
      30
    ),
    (
      'getting-started',
      'Combien coûte Emarzona ?',
      'Les plans et commissions sont détaillés sur la page Tarifs. Emarzona applique une commission sur les ventes selon votre formule ; les frais de paiement dépendent du prestataire (ex. Moneroo). Consultez votre tableau de bord pour le détail des retraits.',
      ARRAY['tarifs', 'commission', 'pricing', 'abonnement'],
      40
    ),
    (
      'product-types',
      'Quels types de produits puis-je vendre ?',
      'Vous pouvez vendre des fichiers digitaux, des produits physiques avec gestion de stock, des services avec réservation, des cours avec modules et quiz, ainsi que des œuvres d''artistes. Chaque type dispose de fiches produit et de workflows adaptés.',
      ARRAY['produits', 'catalogue', 'verticaux'],
      10
    ),
    (
      'product-types',
      'Puis-je vendre plusieurs verticaux dans la même boutique ?',
      'Selon la configuration de votre boutique, vous pouvez proposer plusieurs familles de produits. Le panier acheteur accepte un panier multi-types dans la limite des règles de checkout (certains services réservés peuvent nécessiter une validation avant paiement).',
      ARRAY['panier', 'multi-type', 'mixte'],
      20
    ),
    (
      'product-types',
      'Qu''est-ce qu''un produit artiste sur Emarzona ?',
      'Le verticale artiste permet de vendre des œuvres originales ou en édition limitée avec fiches dédiées, médias haute qualité et options de livraison ou de retrait selon votre configuration.',
      ARRAY['artiste', 'œuvre', 'édition'],
      30
    ),
    (
      'product-types',
      'Comment fonctionne le catalogue de cours ?',
      'Les cours sont listés sur /courses et sur votre boutique. Vous structurez modules, leçons et évaluations depuis le tableau de bord. Les cours gratuits permettent une inscription directe ; les cours payants passent par le checkout Emarzona.',
      ARRAY['cours', 'formation', 'catalogue'],
      40
    ),
    (
      'payments',
      'Quels moyens de paiement sont acceptés ?',
      'Emarzona s''appuie notamment sur Moneroo pour le mobile money et les cartes en Afrique, avec orchestration depuis votre tableau de bord. D''autres prestataires peuvent être disponibles selon votre région et la configuration admin.',
      ARRAY['moneroo', 'paiement', 'mobile money', 'carte'],
      10
    ),
    (
      'payments',
      'Comment fonctionnent les commissions Emarzona ?',
      'Une commission plateforme est prélevée sur chaque vente réussie selon votre plan. Le solde net est crédité sur votre portefeuille vendeur ; vous pouvez demander un retrait selon les règles et délais affichés dans Paramètres > Paiements.',
      ARRAY['commission', 'retrait', 'portefeuille'],
      20
    ),
    (
      'payments',
      'Quand le vendeur reçoit-il ses fonds ?',
      'Les fonds sont enregistrés après confirmation du paiement. Les délais de disponibilité et de virement dépendent du prestataire et des vérifications KYC éventuelles. Suivez l''état dans Admin > Paiements ou votre tableau de bord vendeur.',
      ARRAY['virement', 'délai', 'encaissement'],
      30
    ),
    (
      'payments',
      'La TVA est-elle calculée automatiquement ?',
      'Le checkout Emarzona applique les règles de TVA configurées pour votre boutique et la zone de livraison. Vérifiez vos paramètres fiscaux et consultez la facture générée après commande pour le détail des taxes.',
      ARRAY['tva', 'taxe', 'facture'],
      40
    ),
    (
      'orders-shipping',
      'Comment suivre une commande physique ?',
      'Après paiement, vous recevez un e-mail de confirmation avec le numéro de commande. Connectez-vous à votre compte client ou consultez la page de suivi fournie par le vendeur pour voir le statut d''expédition et le numéro de suivi transporteur.',
      ARRAY['suivi', 'commande', 'expédition'],
      10
    ),
    (
      'orders-shipping',
      'Emarzona propose-t-il l''intégration FedEx ?',
      'Oui, les boutiques physiques peuvent connecter FedEx pour générer des étiquettes et suivre les colis. Configurez l''intégration dans Paramètres > Livraison et définissez vos zones et tarifs.',
      ARRAY['fedex', 'livraison', 'transporteur'],
      20
    ),
    (
      'orders-shipping',
      'Que se passe-t-il si le fulfillment échoue après paiement ?',
      'Emarzona surveille le fulfillment post-paiement. En cas d''anomalie (stock, livraison digitale, etc.), une alerte est créée pour l''équipe et le vendeur est notifié. Le support peut vous aider via support@emarzona.com.',
      ARRAY['fulfillment', 'alerte', 'sla'],
      30
    ),
    (
      'orders-shipping',
      'Puis-je commander plusieurs types de produits dans un même panier ?',
      'Oui, le panier Emarzona accepte des articles de verticaux différents (digital, physique, service, cours, artiste). Certaines combinaisons avec services réservés peuvent nécessiter une validation avant le paiement final.',
      ARRAY['panier', 'checkout', 'multi-type'],
      40
    ),
    (
      'digital-courses',
      'Comment télécharger un produit digital après achat ?',
      'Après paiement confirmé, vous recevez un e-mail avec un lien de téléchargement sécurisé. Vous pouvez aussi accéder à vos achats depuis votre compte client. Les liens sont signés et limités dans le temps pour protéger vos fichiers.',
      ARRAY['téléchargement', 'digital', 'fichier'],
      10
    ),
    (
      'digital-courses',
      'Les liens de téléchargement expirent-ils ?',
      'Oui, les liens de téléchargement sont émis avec une durée de validité limitée (TTL) pour des raisons de sécurité. Si un lien a expiré, reconnectez-vous à votre compte ou contactez le support avec votre numéro de commande.',
      ARRAY['ttl', 'expiration', 'lien signé'],
      20
    ),
    (
      'digital-courses',
      'Comment m''inscrire à un cours gratuit ?',
      'Rendez-vous sur la fiche du cours ou le catalogue /courses, puis cliquez sur S''inscrire gratuitement. Aucun paiement n''est requis ; vous accédez au contenu depuis votre espace apprenant après inscription.',
      ARRAY['cours gratuit', 'inscription', 'formation'],
      30
    ),
    (
      'digital-courses',
      'Les quiz et certifications sont-ils inclus ?',
      'Les vendeurs peuvent activer quiz, tentatives et certificats selon le cours. Après réussite, un certificat ou badge peut être délivré automatiquement selon la configuration du formateur.',
      ARRAY['quiz', 'certificat', 'évaluation'],
      40
    ),
    (
      'account-security',
      'Comment activer l''authentification à deux facteurs ?',
      'Depuis votre compte, accédez aux paramètres de sécurité et activez la 2FA (application d''authentification ou SMS selon disponibilité). Nous recommandons la 2FA pour tous les comptes vendeurs.',
      ARRAY['2fa', 'sécurité', 'authentification'],
      10
    ),
    (
      'account-security',
      'Mes données sont-elles conformes au RGPD ?',
      'Emarzona traite les données selon sa Politique de confidentialité. Vous pouvez exercer vos droits d''accès, de rectification et de suppression en contactant privacy@emarzona.com ou via les paramètres de votre compte.',
      ARRAY['rgpd', 'données', 'confidentialité'],
      20
    ),
    (
      'account-security',
      'Comment contester une commande ou ouvrir un litige ?',
      'Contactez d''abord le vendeur via la page de la boutique. Si le problème persiste, ouvrez un litige depuis votre commande ou écrivez à support@emarzona.com en indiquant le numéro de commande et les pièces justificatives.',
      ARRAY['litige', 'dispute', 'remboursement'],
      30
    ),
    (
      'account-security',
      'Que faire si j''ai oublié mon mot de passe ?',
      'Sur la page de connexion, cliquez sur Mot de passe oublié et suivez le lien reçu par e-mail. Le lien est à usage unique et expire après un délai limité.',
      ARRAY['mot de passe', 'connexion', 'réinitialisation'],
      40
    ),
    (
      'buyers',
      'Dois-je créer un compte pour acheter ?',
      'Un compte facilite le suivi des commandes, cours et téléchargements. Certaines boutiques acceptent le checkout invité ; vous recevrez alors une confirmation par e-mail avec les liens d''accès.',
      ARRAY['compte', 'invité', 'acheteur'],
      10
    ),
    (
      'buyers',
      'Comment contacter un vendeur ?',
      'Utilisez le formulaire ou la messagerie disponible sur la page de la boutique du vendeur. Pour les questions plateforme (paiement, compte), contactez support@emarzona.com.',
      ARRAY['contact', 'vendeur', 'message'],
      20
    ),
    (
      'buyers',
      'Quelle est la politique de remboursement ?',
      'Les conditions dépendent du vendeur et du type de produit. Consultez la Politique de remboursement Emarzona et les CGV affichées avant achat. Les produits digitaux et services peuvent avoir des règles spécifiques.',
      ARRAY['remboursement', 'retour', 'cgv'],
      30
    ),
    (
      'buyers',
      'Comment rejoindre le programme d''affiliation ?',
      'Le programme d''affiliation permet de promouvoir des produits et de percevoir une commission sur les ventes qualifiées. Inscrivez-vous depuis votre compte ou la page dédiée Affiliation, puis partagez vos liens de parrainage.',
      ARRAY['affiliation', 'parrainage', 'commission'],
      40
    )
) AS v(cat_slug, question, answer, keywords, sort_order)
  ON c.slug = v.cat_slug
WHERE NOT EXISTS (SELECT 1 FROM public.platform_faq_items LIMIT 1);
