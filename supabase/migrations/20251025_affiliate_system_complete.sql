-- =========================================================
-- Migration : Système d'affiliation complet
-- Date : 25/10/2025
-- Description : Tables + fonctions pour système d'affiliation
--              Permet aux vendeurs de définir des taux d'affiliation
--              personnalisés pour leurs produits
-- =========================================================

-- =========================================================
-- TABLE 1 : AFFILIATES (Affiliés)
-- =========================================================

CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- Peut être NULL (affiliés non-inscrits)
  
  -- Informations affilié
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Identifiant unique d'affilié
  affiliate_code TEXT NOT NULL UNIQUE,  -- Ex: "JOHN2024", auto-généré
  
  -- Statistiques
  total_clicks INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,            -- Total ventes générées
  total_commission_earned NUMERIC DEFAULT 0,   -- Total commissions gagnées
  total_commission_paid NUMERIC DEFAULT 0,     -- Total commissions payées
  pending_commission NUMERIC DEFAULT 0,        -- Commissions en attente
  
  -- Informations bancaires (pour paiement)
  payment_method TEXT,  -- mobile_money, bank_transfer, paypal
  payment_details JSONB,  -- {phone: "...", iban: "...", etc}
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  suspension_reason TEXT,
  suspended_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_email ON public.affiliates(email);
CREATE INDEX idx_affiliates_code ON public.affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);

-- Comments
COMMENT ON TABLE public.affiliates IS 'Table des affiliés - personnes qui promeuvent des produits';
COMMENT ON COLUMN public.affiliates.affiliate_code IS 'Code unique identifiant l''affilié (ex: JOHN2024)';
COMMENT ON COLUMN public.affiliates.total_commission_earned IS 'Total des commissions gagnées (toutes statuts)';
COMMENT ON COLUMN public.affiliates.pending_commission IS 'Commissions en attente de paiement';

-- RLS Policies
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own data"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can update their own data"
  ON public.affiliates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can register as affiliate"
  ON public.affiliates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all affiliates"
  ON public.affiliates FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all affiliates"
  ON public.affiliates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- TABLE 2 : PRODUCT_AFFILIATE_SETTINGS
-- =========================================================

CREATE TABLE public.product_affiliate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Configuration affiliation
  affiliate_enabled BOOLEAN NOT NULL DEFAULT false,
  commission_rate NUMERIC NOT NULL DEFAULT 0 CHECK (commission_rate >= 0 AND commission_rate <= 100),  -- Pourcentage (0-100)
  commission_type TEXT NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  fixed_commission_amount NUMERIC DEFAULT 0,  -- Si commission fixe (ex: 5000 XOF par vente)
  
  -- Durée tracking
  cookie_duration_days INTEGER NOT NULL DEFAULT 30 CHECK (cookie_duration_days > 0),  -- Durée cookie (7, 30, 60, 90 jours)
  
  -- Restrictions
  max_commission_per_sale NUMERIC,  -- Commission max par vente (optionnel)
  min_order_amount NUMERIC DEFAULT 0,  -- Montant min commande pour commission
  
  -- Conditions
  allow_self_referral BOOLEAN DEFAULT false,  -- Permet auto-affiliation (acheter son propre lien)
  require_approval BOOLEAN DEFAULT false,  -- Nécessite approbation vendeur pour devenir affilié
  
  -- Description pour affiliés
  terms_and_conditions TEXT,  -- Conditions spécifiques
  promotional_materials JSONB DEFAULT '{}'::jsonb,  -- Banners, images, textes promo
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_product_affiliate_settings_product_id ON public.product_affiliate_settings(product_id);
CREATE INDEX idx_product_affiliate_settings_store_id ON public.product_affiliate_settings(store_id);
CREATE INDEX idx_product_affiliate_settings_enabled ON public.product_affiliate_settings(affiliate_enabled) WHERE affiliate_enabled = true;

-- Comments
COMMENT ON TABLE public.product_affiliate_settings IS 'Configuration d''affiliation par produit (taux, durée cookie, etc.)';
COMMENT ON COLUMN public.product_affiliate_settings.commission_rate IS 'Taux de commission en pourcentage (0-100)';
COMMENT ON COLUMN public.product_affiliate_settings.cookie_duration_days IS 'Durée de validité du cookie de tracking (en jours)';

-- RLS Policies
ALTER TABLE public.product_affiliate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage their product affiliate settings"
  ON public.product_affiliate_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = product_affiliate_settings.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view affiliate-enabled products"
  ON public.product_affiliate_settings FOR SELECT
  USING (affiliate_enabled = true);

CREATE POLICY "Admins can view all settings"
  ON public.product_affiliate_settings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_product_affiliate_settings_updated_at
BEFORE UPDATE ON public.product_affiliate_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TABLE 3 : AFFILIATE_LINKS (Liens d'affiliation)
-- =========================================================

CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Lien unique
  link_code TEXT NOT NULL UNIQUE,  -- Ex: "JOHN-REACT-2024" ou hash court
  full_url TEXT NOT NULL,  -- URL complète : https://payhuk.com/products/formation-react?aff=JOHN-REACT-2024
  
  -- Statistiques
  total_clicks INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_commission NUMERIC DEFAULT 0,
  
  -- Métadonnées tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  custom_parameters JSONB DEFAULT '{}'::jsonb,  -- Paramètres personnalisés
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Contrainte unique : un affilié ne peut avoir qu'un seul lien actif par produit
  UNIQUE(affiliate_id, product_id)
);

-- Indexes
CREATE INDEX idx_affiliate_links_affiliate_id ON public.affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_product_id ON public.affiliate_links(product_id);
CREATE INDEX idx_affiliate_links_link_code ON public.affiliate_links(link_code);
CREATE INDEX idx_affiliate_links_status ON public.affiliate_links(status);

-- Comments
COMMENT ON TABLE public.affiliate_links IS 'Liens d''affiliation uniques générés par les affiliés pour chaque produit';
COMMENT ON COLUMN public.affiliate_links.link_code IS 'Code unique du lien (ex: ABC123DEF456)';

-- RLS Policies
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own links"
  ON public.affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_links.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create links for affiliate-enabled products"
  ON public.affiliate_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_links.affiliate_id
      AND affiliates.user_id = auth.uid()
      AND affiliates.status = 'active'
    )
    AND EXISTS (
      SELECT 1 FROM public.product_affiliate_settings
      WHERE product_affiliate_settings.product_id = affiliate_links.product_id
      AND product_affiliate_settings.affiliate_enabled = true
    )
  );

CREATE POLICY "Affiliates can update their own links"
  ON public.affiliate_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_links.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can view links for their products"
  ON public.affiliate_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = affiliate_links.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all links"
  ON public.affiliate_links FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_affiliate_links_updated_at
BEFORE UPDATE ON public.affiliate_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TABLE 4 : AFFILIATE_CLICKS (Tracking des clics)
-- =========================================================

CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Informations visiteur
  ip_address INET,
  user_agent TEXT,
  referer_url TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,  -- mobile, desktop, tablet
  browser TEXT,
  os TEXT,
  
  -- Cookie tracking
  tracking_cookie TEXT NOT NULL,  -- Cookie unique stocké dans navigateur
  cookie_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Conversion
  converted BOOLEAN DEFAULT false,  -- A mené à une vente ?
  order_id UUID REFERENCES public.orders(id),
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_affiliate_clicks_link_id ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_product_id ON public.affiliate_clicks(product_id);
CREATE INDEX idx_affiliate_clicks_tracking_cookie ON public.affiliate_clicks(tracking_cookie);
CREATE INDEX idx_affiliate_clicks_converted ON public.affiliate_clicks(converted);
CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at DESC);
CREATE INDEX idx_affiliate_clicks_order_id ON public.affiliate_clicks(order_id) WHERE order_id IS NOT NULL;

-- Comments
COMMENT ON TABLE public.affiliate_clicks IS 'Tracking de tous les clics sur les liens d''affiliation';
COMMENT ON COLUMN public.affiliate_clicks.tracking_cookie IS 'Cookie unique pour tracker la conversion';
COMMENT ON COLUMN public.affiliate_clicks.converted IS 'Indique si le clic a mené à une vente';

-- RLS Policies
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct user access to clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (false);  -- Accès uniquement via fonctions/triggers

CREATE POLICY "Admins can view all clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (true);  -- Les fonctions SQL peuvent insérer

-- =========================================================
-- TABLE 5 : AFFILIATE_COMMISSIONS (Commissions affiliés)
-- =========================================================

CREATE TABLE public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  
  -- Montants
  order_total NUMERIC NOT NULL,  -- Montant total commande
  commission_base NUMERIC NOT NULL,  -- Base calcul commission (après commission plateforme)
  commission_rate NUMERIC NOT NULL,  -- Taux appliqué (%)
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')),
  commission_amount NUMERIC NOT NULL,  -- Montant commission
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'cancelled')),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Paiement
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES auth.users(id),
  payment_method TEXT,
  payment_reference TEXT,
  payment_proof_url TEXT,
  
  -- Métadonnées
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX idx_affiliate_commissions_order_id ON public.affiliate_commissions(order_id);
CREATE INDEX idx_affiliate_commissions_status ON public.affiliate_commissions(status);
CREATE INDEX idx_affiliate_commissions_store_id ON public.affiliate_commissions(store_id);
CREATE INDEX idx_affiliate_commissions_created_at ON public.affiliate_commissions(created_at DESC);

-- Comments
COMMENT ON TABLE public.affiliate_commissions IS 'Commissions générées par les ventes via affiliation';
COMMENT ON COLUMN public.affiliate_commissions.commission_base IS 'Montant sur lequel la commission est calculée (après commission plateforme)';
COMMENT ON COLUMN public.affiliate_commissions.status IS 'pending=en attente, approved=approuvé, paid=payé, rejected=rejeté';

-- RLS Policies
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_commissions.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can view commissions for their products"
  ON public.affiliate_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = affiliate_commissions.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can approve/reject commissions"
  ON public.affiliate_commissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = affiliate_commissions.store_id
      AND stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all commissions"
  ON public.affiliate_commissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_affiliate_commissions_updated_at
BEFORE UPDATE ON public.affiliate_commissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TABLE 6 : AFFILIATE_WITHDRAWALS (Retraits affiliés)
-- =========================================================

CREATE TABLE public.affiliate_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  
  -- Montant
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  
  -- Méthode de paiement
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mobile_money', 'bank_transfer', 'paypal', 'stripe')),
  payment_details JSONB NOT NULL,  -- {phone: "...", account: "...", etc}
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Approbation
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Traitement
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),
  transaction_reference TEXT,
  proof_url TEXT,
  
  -- Échec
  failed_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  
  -- Métadonnées
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_affiliate_withdrawals_affiliate_id ON public.affiliate_withdrawals(affiliate_id);
CREATE INDEX idx_affiliate_withdrawals_status ON public.affiliate_withdrawals(status);
CREATE INDEX idx_affiliate_withdrawals_created_at ON public.affiliate_withdrawals(created_at DESC);

-- Comments
COMMENT ON TABLE public.affiliate_withdrawals IS 'Demandes de retrait des commissions par les affiliés';
COMMENT ON COLUMN public.affiliate_withdrawals.status IS 'pending=en attente, processing=en cours, completed=complété, failed=échoué';

-- RLS Policies
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own withdrawals"
  ON public.affiliate_withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_withdrawals.affiliate_id
      AND affiliates.user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create their own withdrawals"
  ON public.affiliate_withdrawals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates
      WHERE affiliates.id = affiliate_withdrawals.affiliate_id
      AND affiliates.user_id = auth.uid()
      AND affiliates.status = 'active'
    )
  );

CREATE POLICY "Admins can manage all withdrawals"
  ON public.affiliate_withdrawals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger pour updated_at
CREATE TRIGGER update_affiliate_withdrawals_updated_at
BEFORE UPDATE ON public.affiliate_withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- FONCTION 1 : Générer code affilié unique
-- =========================================================

CREATE OR REPLACE FUNCTION public.generate_affiliate_code(
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_base TEXT;
  v_suffix TEXT;
  v_exists BOOLEAN;
  v_counter INTEGER := 0;
BEGIN
  -- Base du code (prénom + année)
  IF p_first_name IS NOT NULL THEN
    v_base := upper(substring(regexp_replace(p_first_name, '[^a-zA-Z]', '', 'g'), 1, 4));
  ELSE
    v_base := 'AFF';
  END IF;
  
  v_base := v_base || to_char(now(), 'YY');
  
  -- Boucle jusqu'à trouver un code unique
  LOOP
    v_suffix := '';
    IF v_counter > 0 THEN
      v_suffix := lpad(v_counter::text, 3, '0');
    END IF;
    
    v_code := v_base || v_suffix;
    
    -- Vérifier si le code existe déjà
    SELECT EXISTS(SELECT 1 FROM affiliates WHERE affiliate_code = v_code) INTO v_exists;
    
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
    
    v_counter := v_counter + 1;
    
    -- Sécurité : éviter boucle infinie
    IF v_counter > 999 THEN
      -- Ajouter timestamp pour garantir unicité
      v_code := v_base || substring(md5(random()::text), 1, 4);
      RETURN upper(v_code);
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.generate_affiliate_code IS 'Génère un code affilié unique (ex: JOHN25, MARIE25001)';

-- =========================================================
-- FONCTION 2 : Générer lien d'affiliation
-- =========================================================

CREATE OR REPLACE FUNCTION public.generate_affiliate_link_code(
  p_affiliate_code TEXT,
  p_product_slug TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_hash TEXT;
BEGIN
  -- Créer un hash court unique
  v_hash := encode(digest(p_affiliate_code || '-' || p_product_slug || '-' || gen_random_uuid()::text, 'sha256'), 'hex');
  v_code := substring(v_hash, 1, 12);  -- 12 caractères
  
  RETURN upper(v_code);
END;
$$;

COMMENT ON FUNCTION public.generate_affiliate_link_code IS 'Génère un code de lien d''affiliation unique (12 caractères)';

-- =========================================================
-- FONCTION 3 : Tracker un clic
-- =========================================================

CREATE OR REPLACE FUNCTION public.track_affiliate_click(
  p_link_code TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referer_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link affiliate_links%ROWTYPE;
  v_tracking_cookie TEXT;
  v_cookie_expires_at TIMESTAMP;
  v_product_settings product_affiliate_settings%ROWTYPE;
  v_click_id UUID;
BEGIN
  -- Récupérer le lien d'affiliation
  SELECT * INTO v_link
  FROM affiliate_links
  WHERE link_code = p_link_code AND status = 'active';
  
  IF v_link IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid affiliate link'
    );
  END IF;
  
  -- Récupérer les paramètres du produit
  SELECT * INTO v_product_settings
  FROM product_affiliate_settings
  WHERE product_id = v_link.product_id
  AND affiliate_enabled = true;
  
  IF v_product_settings IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Affiliate program not enabled for this product'
    );
  END IF;
  
  -- Générer cookie de tracking
  v_tracking_cookie := encode(gen_random_uuid()::text::bytea, 'base64');
  v_cookie_expires_at := now() + (v_product_settings.cookie_duration_days || ' days')::INTERVAL;
  
  -- Enregistrer le clic
  INSERT INTO affiliate_clicks (
    affiliate_link_id,
    affiliate_id,
    product_id,
    ip_address,
    user_agent,
    referer_url,
    tracking_cookie,
    cookie_expires_at
  ) VALUES (
    v_link.id,
    v_link.affiliate_id,
    v_link.product_id,
    p_ip_address::INET,
    p_user_agent,
    p_referer_url,
    v_tracking_cookie,
    v_cookie_expires_at
  ) RETURNING id INTO v_click_id;
  
  -- Incrémenter compteur de clics
  UPDATE affiliate_links
  SET 
    total_clicks = total_clicks + 1,
    last_used_at = now(),
    updated_at = now()
  WHERE id = v_link.id;
  
  UPDATE affiliates
  SET 
    total_clicks = total_clicks + 1,
    updated_at = now()
  WHERE id = v_link.affiliate_id;
  
  -- Retourner info pour cookie
  RETURN jsonb_build_object(
    'success', true,
    'tracking_cookie', v_tracking_cookie,
    'expires_at', v_cookie_expires_at,
    'product_id', v_link.product_id::text,
    'store_id', v_link.store_id::text,
    'click_id', v_click_id::text,
    'redirect_url', v_link.full_url
  );
END;
$$;

COMMENT ON FUNCTION public.track_affiliate_click IS 'Enregistre un clic sur un lien d''affiliation et retourne les données du cookie';

-- =========================================================
-- FONCTION 4 : Calculer et créer commission affiliation
-- =========================================================

CREATE OR REPLACE FUNCTION public.calculate_affiliate_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_click affiliate_clicks%ROWTYPE;
  v_affiliate_link affiliate_links%ROWTYPE;
  v_product_settings product_affiliate_settings%ROWTYPE;
  v_product_id UUID;
  v_commission_base NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- Récupérer le produit de la commande (premier item)
  SELECT oi.product_id INTO v_product_id
  FROM order_items oi
  WHERE oi.order_id = NEW.id
  LIMIT 1;
  
  IF v_product_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier si la commande provient d'un clic affilié (via cookie ou paramètre)
  -- On cherche un clic récent non expiré pour ce produit
  SELECT ac.* INTO v_affiliate_click
  FROM affiliate_clicks ac
  WHERE ac.product_id = v_product_id
  AND ac.tracking_cookie IS NOT NULL
  AND ac.cookie_expires_at > now()
  AND ac.converted = false
  ORDER BY ac.clicked_at DESC
  LIMIT 1;
  
  -- Si pas de clic affilié trouvé, rien à faire
  IF v_affiliate_click IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le lien d'affiliation
  SELECT * INTO v_affiliate_link
  FROM affiliate_links
  WHERE id = v_affiliate_click.affiliate_link_id
  AND status = 'active';
  
  IF v_affiliate_link IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer les paramètres d'affiliation du produit
  SELECT * INTO v_product_settings
  FROM product_affiliate_settings
  WHERE product_id = v_product_id
  AND affiliate_enabled = true;
  
  IF v_product_settings IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier le montant minimum
  IF NEW.total_amount < v_product_settings.min_order_amount THEN
    RETURN NEW;
  END IF;
  
  -- Calculer la base de commission (montant vendeur après commission plateforme)
  -- Montant total - commission plateforme (10%)
  v_commission_base := NEW.total_amount * 0.90;
  
  -- Calculer la commission affilié
  IF v_product_settings.commission_type = 'percentage' THEN
    v_commission_amount := v_commission_base * (v_product_settings.commission_rate / 100);
  ELSE
    v_commission_amount := v_product_settings.fixed_commission_amount;
  END IF;
  
  -- Appliquer la commission max si définie
  IF v_product_settings.max_commission_per_sale IS NOT NULL THEN
    v_commission_amount := LEAST(v_commission_amount, v_product_settings.max_commission_per_sale);
  END IF;
  
  -- Créer la commission affilié
  INSERT INTO affiliate_commissions (
    affiliate_id,
    affiliate_link_id,
    product_id,
    store_id,
    order_id,
    order_total,
    commission_base,
    commission_rate,
    commission_type,
    commission_amount,
    status
  ) VALUES (
    v_affiliate_link.affiliate_id,
    v_affiliate_link.id,
    v_product_id,
    v_affiliate_link.store_id,
    NEW.id,
    NEW.total_amount,
    v_commission_base,
    v_product_settings.commission_rate,
    v_product_settings.commission_type,
    v_commission_amount,
    'pending'  -- En attente validation
  );
  
  -- Marquer le clic comme converti
  UPDATE affiliate_clicks
  SET 
    converted = true,
    order_id = NEW.id,
    converted_at = now()
  WHERE id = v_affiliate_click.id;
  
  -- Mettre à jour les statistiques du lien
  UPDATE affiliate_links
  SET 
    total_sales = total_sales + 1,
    total_revenue = total_revenue + NEW.total_amount,
    total_commission = total_commission + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_link.id;
  
  -- Mettre à jour les statistiques de l'affilié
  UPDATE affiliates
  SET 
    total_sales = total_sales + 1,
    total_revenue = total_revenue + NEW.total_amount,
    total_commission_earned = total_commission_earned + v_commission_amount,
    pending_commission = pending_commission + v_commission_amount,
    updated_at = now()
  WHERE id = v_affiliate_link.affiliate_id;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.calculate_affiliate_commission IS 'Calcule automatiquement la commission d''affiliation lors d''une nouvelle commande';

-- =========================================================
-- TRIGGER : Attribution commission sur nouvelle commande
-- =========================================================

CREATE TRIGGER track_affiliate_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_affiliate_commission();

-- =========================================================
-- VUES UTILES (Optionnel - pour faciliter les requêtes)
-- =========================================================

-- Vue : Top affiliés
CREATE OR REPLACE VIEW public.top_affiliates AS
SELECT 
  a.id,
  a.display_name,
  a.email,
  a.affiliate_code,
  a.total_clicks,
  a.total_sales,
  a.total_revenue,
  a.total_commission_earned,
  a.pending_commission,
  CASE 
    WHEN a.total_clicks > 0 THEN (a.total_sales::NUMERIC / a.total_clicks) * 100
    ELSE 0
  END as conversion_rate,
  CASE 
    WHEN a.total_sales > 0 THEN a.total_revenue / a.total_sales
    ELSE 0
  END as avg_order_value
FROM affiliates a
WHERE a.status = 'active'
ORDER BY a.total_commission_earned DESC;

COMMENT ON VIEW public.top_affiliates IS 'Vue des meilleurs affiliés avec statistiques calculées';

-- Vue : Produits avec affiliation
CREATE OR REPLACE VIEW public.affiliate_products AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.price,
  p.image_url,
  pas.commission_rate,
  pas.commission_type,
  pas.cookie_duration_days,
  s.name as store_name,
  s.slug as store_slug,
  COUNT(DISTINCT al.id) as total_affiliates,
  COALESCE(SUM(al.total_clicks), 0) as total_clicks,
  COALESCE(SUM(al.total_sales), 0) as total_sales
FROM products p
INNER JOIN product_affiliate_settings pas ON pas.product_id = p.id
INNER JOIN stores s ON s.id = p.store_id
LEFT JOIN affiliate_links al ON al.product_id = p.id AND al.status = 'active'
WHERE pas.affiliate_enabled = true
  AND p.is_active = true
GROUP BY p.id, p.name, p.slug, p.price, p.image_url, pas.commission_rate, pas.commission_type, pas.cookie_duration_days, s.name, s.slug
ORDER BY total_clicks DESC;

COMMENT ON VIEW public.affiliate_products IS 'Vue des produits disponibles pour l''affiliation avec leurs stats';

-- =========================================================
-- DONNÉES DE TEST (Optionnel - à supprimer en production)
-- =========================================================

-- Exemple : Activer l'affiliation sur un produit existant
-- (Décommentez si vous voulez tester)

/*
INSERT INTO product_affiliate_settings (
  product_id,
  store_id,
  affiliate_enabled,
  commission_rate,
  commission_type,
  cookie_duration_days,
  min_order_amount
)
SELECT 
  p.id,
  p.store_id,
  true,
  20.00, -- 20% de commission
  'percentage',
  30, -- Cookie valide 30 jours
  0
FROM products p
LIMIT 1
ON CONFLICT (product_id) DO NOTHING;
*/

-- =========================================================
-- FIN DE LA MIGRATION
-- =========================================================

