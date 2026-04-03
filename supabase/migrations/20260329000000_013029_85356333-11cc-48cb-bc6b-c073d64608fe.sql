
-- =====================================================
-- MIGRATION 3: SYSTÈME D'AFFILIATION
-- =====================================================

-- Affiliés
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  commission_rate numeric DEFAULT 10,
  total_earnings numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  pending_balance numeric DEFAULT 0,
  payment_method text,
  payment_details jsonb,
  bio text,
  website_url text,
  referral_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Liens d'affiliation
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  short_code text NOT NULL UNIQUE,
  url text,
  click_count integer DEFAULT 0,
  conversion_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Clics d'affiliation
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id uuid NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  referrer text,
  tracking_cookie text,
  cookie_expires_at timestamptz,
  converted boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Commissions d'affiliation
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  commission_rate numeric,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Retraits d'affiliation
CREATE TABLE IF NOT EXISTS public.affiliate_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_method text,
  payment_details jsonb,
  processed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Parrainages
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referral_code text,
  status text DEFAULT 'pending',
  reward_amount numeric DEFAULT 0,
  reward_claimed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies: affiliates
CREATE POLICY "Users can view own affiliate profile" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create affiliate profile" ON public.affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate profile" ON public.affiliates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Store owners can view store affiliates" ON public.affiliates FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = affiliates.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Admins can view all affiliates" ON public.affiliates FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Policies: affiliate_links
CREATE POLICY "Affiliates can view own links" ON public.affiliate_links FOR SELECT USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_links.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Affiliates can create links" ON public.affiliate_links FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_links.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Affiliates can update own links" ON public.affiliate_links FOR UPDATE USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_links.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Affiliate links viewable for tracking" ON public.affiliate_links FOR SELECT USING (is_active = true);

-- Policies: affiliate_clicks
CREATE POLICY "Anyone can insert clicks" ON public.affiliate_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Affiliates can view own clicks" ON public.affiliate_clicks FOR SELECT USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_clicks.affiliate_id AND affiliates.user_id = auth.uid()));

-- Policies: affiliate_commissions
CREATE POLICY "Affiliates can view own commissions" ON public.affiliate_commissions FOR SELECT USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_commissions.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Store owners can manage commissions" ON public.affiliate_commissions FOR ALL USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = affiliate_commissions.store_id AND stores.user_id = auth.uid()));

-- Policies: affiliate_withdrawals
CREATE POLICY "Affiliates can view own withdrawals" ON public.affiliate_withdrawals FOR SELECT USING (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_withdrawals.affiliate_id AND affiliates.user_id = auth.uid()));
CREATE POLICY "Affiliates can request withdrawals" ON public.affiliate_withdrawals FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM affiliates WHERE affiliates.id = affiliate_withdrawals.affiliate_id AND affiliates.user_id = auth.uid()));

-- Policies: referrals
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_store_id ON public.affiliates(store_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_affiliate_id ON public.affiliate_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_short_code ON public.affiliate_links(short_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_link_id ON public.affiliate_clicks(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_tracking_cookie ON public.affiliate_clicks(tracking_cookie);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

-- Triggers
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON public.affiliate_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_commissions_updated_at BEFORE UPDATE ON public.affiliate_commissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_affiliate_withdrawals_updated_at BEFORE UPDATE ON public.affiliate_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
