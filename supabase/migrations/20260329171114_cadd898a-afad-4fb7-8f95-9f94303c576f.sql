
-- =====================================================
-- 3. ARTIST SYSTEM: Create all missing tables
-- =====================================================

-- artist_products (core table)
CREATE TABLE IF NOT EXISTS public.artist_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  artist_type text DEFAULT 'visual_artist',
  artist_name text NOT NULL DEFAULT '',
  artist_bio text DEFAULT '',
  artist_website text DEFAULT '',
  artist_photo_url text,
  artist_social_links jsonb DEFAULT '{}'::jsonb,
  artwork_title text DEFAULT '',
  artwork_year integer,
  artwork_medium text DEFAULT '',
  artwork_dimensions jsonb DEFAULT '{"width":null,"height":null,"depth":null,"unit":"cm"}'::jsonb,
  artwork_link_url text,
  artwork_edition_type text DEFAULT 'original',
  edition_number integer,
  total_editions integer,
  requires_shipping boolean DEFAULT true,
  shipping_handling_time integer DEFAULT 5,
  shipping_fragile boolean DEFAULT false,
  shipping_insurance_required boolean DEFAULT false,
  shipping_insurance_amount numeric,
  certificate_of_authenticity boolean DEFAULT false,
  certificate_file_url text DEFAULT '',
  signature_authenticated boolean DEFAULT false,
  signature_location text DEFAULT '',
  writer_specific jsonb,
  musician_specific jsonb,
  visual_artist_specific jsonb,
  designer_specific jsonb,
  multimedia_specific jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artist products viewable by everyone" ON public.artist_products FOR SELECT USING (true);
CREATE POLICY "Store owners can manage artist products" ON public.artist_products FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = artist_products.store_id AND stores.user_id = auth.uid())
);

-- artist_product_auctions
CREATE TABLE IF NOT EXISTS public.artist_product_auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  auction_title text NOT NULL,
  auction_description text,
  auction_slug text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  extended_end_date timestamptz,
  starting_price numeric NOT NULL DEFAULT 0,
  reserve_price numeric,
  buy_now_price numeric,
  current_bid numeric DEFAULT 0,
  minimum_bid_increment numeric DEFAULT 1,
  status text DEFAULT 'draft',
  total_bids integer DEFAULT 0,
  unique_bidders integer DEFAULT 0,
  views_count integer DEFAULT 0,
  allow_automatic_extension boolean DEFAULT true,
  extension_minutes integer DEFAULT 5,
  require_verification boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_product_auctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auctions viewable by everyone" ON public.artist_product_auctions FOR SELECT USING (true);
CREATE POLICY "Store owners can manage auctions" ON public.artist_product_auctions FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = artist_product_auctions.store_id AND stores.user_id = auth.uid())
);

-- auction_bids
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES public.artist_product_auctions(id) ON DELETE CASCADE NOT NULL,
  bidder_id uuid NOT NULL,
  bid_amount numeric NOT NULL,
  currency text DEFAULT 'XOF',
  bid_type text DEFAULT 'manual',
  max_bid_amount numeric,
  is_proxy_bid boolean DEFAULT false,
  status text DEFAULT 'active',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bids viewable on active auctions" ON public.auction_bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can bid" ON public.auction_bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);
CREATE POLICY "Users can view own bids" ON public.auction_bids FOR SELECT USING (auth.uid() = bidder_id);

-- auction_watchlist
CREATE TABLE IF NOT EXISTS public.auction_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES public.artist_product_auctions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  notify_on_new_bid boolean DEFAULT true,
  notify_on_ending_soon boolean DEFAULT true,
  notify_on_ending boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(auction_id, user_id)
);

ALTER TABLE public.auction_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own watchlist" ON public.auction_watchlist FOR ALL USING (auth.uid() = user_id);

-- artist_portfolios
CREATE TABLE IF NOT EXISTS public.artist_portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  portfolio_name text NOT NULL,
  portfolio_slug text NOT NULL,
  portfolio_description text,
  portfolio_bio text,
  portfolio_image_url text,
  portfolio_links jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  total_artworks integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public portfolios viewable" ON public.artist_portfolios FOR SELECT USING (is_public = true);
CREATE POLICY "Store owners can manage portfolios" ON public.artist_portfolios FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = artist_portfolios.store_id AND stores.user_id = auth.uid())
);

-- artist_galleries
CREATE TABLE IF NOT EXISTS public.artist_galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES public.artist_portfolios(id) ON DELETE CASCADE NOT NULL,
  gallery_name text NOT NULL,
  gallery_slug text NOT NULL,
  gallery_description text,
  gallery_cover_image_url text,
  gallery_category text,
  gallery_tags text[],
  is_public boolean DEFAULT true,
  display_order integer DEFAULT 0,
  total_artworks integer DEFAULT 0,
  total_views integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public galleries viewable" ON public.artist_galleries FOR SELECT USING (is_public = true);
CREATE POLICY "Store owners can manage galleries" ON public.artist_galleries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM artist_portfolios ap JOIN stores s ON s.id = ap.store_id
    WHERE ap.id = artist_galleries.portfolio_id AND s.user_id = auth.uid()
  )
);

-- gallery_artworks
CREATE TABLE IF NOT EXISTS public.gallery_artworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES public.artist_galleries(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE CASCADE NOT NULL,
  artwork_title text,
  artwork_description text,
  artwork_image_url text,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_artworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gallery artworks viewable" ON public.gallery_artworks FOR SELECT USING (true);
CREATE POLICY "Store owners can manage gallery artworks" ON public.gallery_artworks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM artist_galleries ag JOIN artist_portfolios ap ON ap.id = ag.portfolio_id JOIN stores s ON s.id = ap.store_id
    WHERE ag.id = gallery_artworks.gallery_id AND s.user_id = auth.uid()
  )
);

-- artist_collections
CREATE TABLE IF NOT EXISTS public.artist_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE SET NULL,
  collection_name text NOT NULL,
  collection_slug text NOT NULL,
  collection_description text,
  collection_short_description text,
  collection_type text DEFAULT 'thematic',
  cover_image_url text,
  cover_image_alt text,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_public boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public collections viewable" ON public.artist_collections FOR SELECT USING (is_public = true);
CREATE POLICY "Store owners can manage collections" ON public.artist_collections FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = artist_collections.store_id AND stores.user_id = auth.uid())
);

-- artist_collection_items
CREATE TABLE IF NOT EXISTS public.artist_collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES public.artist_collections(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE CASCADE NOT NULL,
  display_order integer DEFAULT 0,
  is_featured_in_collection boolean DEFAULT false,
  collection_notes text,
  added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection items viewable" ON public.artist_collection_items FOR SELECT USING (true);
CREATE POLICY "Store owners can manage collection items" ON public.artist_collection_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM artist_collections ac JOIN stores s ON s.id = ac.store_id
    WHERE ac.id = artist_collection_items.collection_id AND s.user_id = auth.uid()
  )
);

-- artist_product_dedications
CREATE TABLE IF NOT EXISTS public.artist_product_dedications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  dedication_text text NOT NULL,
  recipient_name text,
  font_style text DEFAULT 'standard',
  text_position text DEFAULT 'center',
  status text DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  preview_image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_product_dedications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage dedications" ON public.artist_product_dedications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM artist_products ap JOIN stores s ON s.id = ap.store_id
    WHERE ap.id = artist_product_dedications.artist_product_id AND s.user_id = auth.uid()
  )
);

-- dedication_templates
CREATE TABLE IF NOT EXISTS public.dedication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  template_text text NOT NULL,
  font_style text DEFAULT 'standard',
  text_position text DEFAULT 'center',
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dedication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates viewable" ON public.dedication_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Store owners can manage templates" ON public.dedication_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = dedication_templates.store_id AND stores.user_id = auth.uid())
);

-- artwork_provenance
CREATE TABLE IF NOT EXISTS public.artwork_provenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  provenance_type text DEFAULT 'creation',
  event_date date NOT NULL,
  recorded_date timestamptz DEFAULT now(),
  previous_owner_id uuid,
  previous_owner_name text,
  current_owner_id uuid,
  current_owner_name text,
  location_country text,
  location_city text,
  location_address text,
  description text,
  notes text,
  documents jsonb DEFAULT '[]'::jsonb,
  certificates jsonb DEFAULT '[]'::jsonb,
  blockchain_hash text,
  blockchain_tx_id text,
  blockchain_network text,
  is_verified boolean DEFAULT false,
  verified_by text,
  verified_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artwork_provenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provenance viewable by everyone" ON public.artwork_provenance FOR SELECT USING (true);
CREATE POLICY "Store owners can manage provenance" ON public.artwork_provenance FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = artwork_provenance.store_id AND stores.user_id = auth.uid())
);

-- artwork_certificates (different from course certificates)
CREATE TABLE IF NOT EXISTS public.artwork_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  certificate_type text DEFAULT 'authenticity',
  certificate_number text,
  issued_by text NOT NULL,
  issued_by_contact text,
  issued_date date NOT NULL,
  expiry_date date,
  certificate_content text,
  certificate_pdf_url text,
  is_verified boolean DEFAULT false,
  verification_code text,
  qr_code_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artwork_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artwork certificates viewable" ON public.artwork_certificates FOR SELECT USING (true);
CREATE POLICY "Store owners can manage artwork certificates" ON public.artwork_certificates FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = artwork_certificates.store_id AND stores.user_id = auth.uid())
);

-- artwork_3d_models
CREATE TABLE IF NOT EXISTS public.artwork_3d_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  model_url text NOT NULL,
  model_type text DEFAULT 'glb',
  model_size_bytes bigint,
  thumbnail_url text,
  preview_images text[],
  model_metadata jsonb DEFAULT '{}'::jsonb,
  auto_rotate boolean DEFAULT true,
  auto_play boolean DEFAULT true,
  show_controls boolean DEFAULT true,
  background_color text DEFAULT '#ffffff',
  camera_position jsonb,
  camera_target jsonb,
  views_count integer DEFAULT 0,
  interactions_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artwork_3d_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "3D models viewable by everyone" ON public.artwork_3d_models FOR SELECT USING (true);
CREATE POLICY "Store owners can manage 3d models" ON public.artwork_3d_models FOR ALL USING (
  EXISTS (SELECT 1 FROM stores WHERE stores.id = artwork_3d_models.store_id AND stores.user_id = auth.uid())
);

-- artist_product_certificates (purchase certificates)
CREATE TABLE IF NOT EXISTS public.artist_product_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id),
  order_item_id uuid,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  artist_product_id uuid REFERENCES public.artist_products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  certificate_number text NOT NULL,
  certificate_type text DEFAULT 'authenticity',
  edition_number integer,
  total_edition integer,
  signed_by_artist boolean DEFAULT false,
  signed_date date,
  certificate_pdf_url text,
  certificate_image_url text,
  artwork_title text NOT NULL,
  artist_name text NOT NULL,
  artwork_medium text,
  artwork_year integer,
  purchase_date date NOT NULL,
  buyer_name text NOT NULL,
  buyer_email text,
  is_generated boolean DEFAULT false,
  generated_at timestamptz,
  downloaded_at timestamptz,
  download_count integer DEFAULT 0,
  is_valid boolean DEFAULT true,
  revoked boolean DEFAULT false,
  revoked_at timestamptz,
  revoked_reason text,
  is_public boolean DEFAULT false,
  verification_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_product_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificates publicly verifiable" ON public.artist_product_certificates FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own certificates" ON public.artist_product_certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Store owners can manage certificates" ON public.artist_product_certificates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM artist_products ap JOIN stores s ON s.id = ap.store_id
    WHERE ap.id = artist_product_certificates.artist_product_id AND s.user_id = auth.uid()
  )
);

-- Add updated_at triggers for all artist tables
CREATE TRIGGER update_artist_products_updated_at BEFORE UPDATE ON public.artist_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_product_auctions_updated_at BEFORE UPDATE ON public.artist_product_auctions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_portfolios_updated_at BEFORE UPDATE ON public.artist_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_galleries_updated_at BEFORE UPDATE ON public.artist_galleries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_collections_updated_at BEFORE UPDATE ON public.artist_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_product_dedications_updated_at BEFORE UPDATE ON public.artist_product_dedications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dedication_templates_updated_at BEFORE UPDATE ON public.dedication_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artwork_provenance_updated_at BEFORE UPDATE ON public.artwork_provenance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artwork_certificates_updated_at BEFORE UPDATE ON public.artwork_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artwork_3d_models_updated_at BEFORE UPDATE ON public.artwork_3d_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artist_product_certificates_updated_at BEFORE UPDATE ON public.artist_product_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
