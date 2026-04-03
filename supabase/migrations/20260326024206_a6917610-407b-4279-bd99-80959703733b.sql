
-- =============================================
-- CORE TABLES FOR EMARZONA E-COMMERCE PLATFORM
-- =============================================

-- 1. PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  email text,
  phone text,
  bio text,
  country text,
  city text,
  language text DEFAULT 'fr',
  referral_code text UNIQUE,
  referred_by uuid REFERENCES public.profiles(id),
  is_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  parent_id uuid REFERENCES public.categories(id),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- 3. STORES
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  banner_url text,
  is_active boolean DEFAULT true,
  default_currency text DEFAULT 'XOF',
  -- Contact
  contact_email text,
  contact_phone text,
  support_email text,
  sales_email text,
  support_phone text,
  whatsapp_number text,
  -- Social
  facebook_url text,
  instagram_url text,
  twitter_url text,
  linkedin_url text,
  youtube_url text,
  tiktok_url text,
  pinterest_url text,
  snapchat_url text,
  discord_url text,
  twitch_url text,
  telegram_username text,
  -- Domain
  custom_domain text,
  domain_status text DEFAULT 'not_configured',
  domain_verification_token text,
  domain_verified_at timestamptz,
  domain_error_message text,
  ssl_enabled boolean DEFAULT false,
  redirect_www boolean DEFAULT false,
  redirect_https boolean DEFAULT true,
  dns_records jsonb,
  -- Theme & Colors
  primary_color text,
  secondary_color text,
  accent_color text,
  background_color text,
  text_color text,
  text_secondary_color text,
  button_primary_color text,
  button_primary_text text,
  button_secondary_color text,
  button_secondary_text text,
  link_color text,
  link_hover_color text,
  border_radius text,
  shadow_intensity text,
  theme_color text,
  -- Typography
  heading_font text,
  body_font text,
  font_size_base text,
  heading_size_h1 text,
  heading_size_h2 text,
  heading_size_h3 text,
  line_height text,
  letter_spacing text,
  -- Layout
  header_style text DEFAULT 'standard',
  footer_style text DEFAULT 'standard',
  sidebar_enabled boolean DEFAULT false,
  sidebar_position text DEFAULT 'left',
  product_grid_columns integer DEFAULT 3,
  product_card_style text DEFAULT 'standard',
  navigation_style text DEFAULT 'horizontal',
  -- Images
  favicon_url text,
  apple_touch_icon_url text,
  watermark_url text,
  placeholder_image_url text,
  -- Location
  address_line1 text,
  address_line2 text,
  city text,
  state_province text,
  postal_code text,
  country text,
  latitude double precision,
  longitude double precision,
  timezone text,
  opening_hours jsonb,
  -- Info banner
  info_message text,
  info_message_color text,
  info_message_font text,
  about text,
  -- Legal & Marketing (JSONB)
  legal_pages jsonb,
  marketing_content jsonb,
  -- SEO
  meta_title text,
  meta_description text,
  meta_keywords text,
  og_image text,
  seo_score integer,
  -- Analytics & Tracking
  google_analytics_id text,
  google_analytics_enabled boolean DEFAULT false,
  facebook_pixel_id text,
  facebook_pixel_enabled boolean DEFAULT false,
  google_tag_manager_id text,
  google_tag_manager_enabled boolean DEFAULT false,
  tiktok_pixel_id text,
  tiktok_pixel_enabled boolean DEFAULT false,
  custom_tracking_scripts text,
  custom_scripts_enabled boolean DEFAULT false,
  -- Additional contacts
  press_email text,
  partnership_email text,
  sales_phone text,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stores are viewable by everyone" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Users can insert own stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stores" ON public.stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stores" ON public.stores FOR DELETE USING (auth.uid() = user_id);

-- 4. PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  short_description text,
  price numeric NOT NULL DEFAULT 0,
  promotional_price numeric,
  currency text DEFAULT 'XOF',
  image_url text,
  images jsonb,
  category text,
  product_type text DEFAULT 'digital',
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_draft boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  tags text[],
  licensing_type text,
  license_terms text,
  -- Physical product fields
  free_shipping boolean DEFAULT false,
  shipping_cost numeric DEFAULT 0,
  stock_quantity integer,
  -- Access control
  hide_from_store boolean DEFAULT false,
  password_protected boolean DEFAULT false,
  access_control text DEFAULT 'public',
  purchase_limit integer,
  hide_purchase_count boolean DEFAULT false,
  -- Pricing
  pricing_model text DEFAULT 'one_time',
  -- Digital product fields
  downloadable_files jsonb,
  file_access_type text DEFAULT 'immediate',
  -- Linked products (freemium)
  free_product_id uuid REFERENCES public.products(id),
  paid_product_id uuid REFERENCES public.products(id),
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Store owners can insert products" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can update products" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can delete products" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);

-- 5. CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  full_name text,
  name text,
  email text,
  phone text,
  country text,
  city text,
  address text,
  total_orders integer DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view customers" ON public.customers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can insert customers" ON public.customers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can update customers" ON public.customers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);

-- 6. ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES public.customers(id),
  order_number text NOT NULL UNIQUE,
  total_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'XOF',
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'unpaid',
  payment_method text,
  payment_type text DEFAULT 'full',
  percentage_paid numeric,
  remaining_amount numeric,
  delivery_status text,
  shipping_address jsonb,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can insert orders" ON public.orders FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can update orders" ON public.orders FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);

-- 7. ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id),
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items viewable by store owners" ON public.order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = order_id AND s.user_id = auth.uid()
  )
);
CREATE POLICY "Order items insertable by store owners" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = order_id AND s.user_id = auth.uid()
  )
);

-- 8. PAYMENTS / TRANSACTIONS
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.customers(id),
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'XOF',
  status text DEFAULT 'pending',
  payment_method text,
  moneroo_transaction_id text,
  moneroo_payment_method text,
  customer_name text,
  customer_email text,
  is_held boolean DEFAULT false,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can insert payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can update payments" ON public.payments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);

-- 9. TRANSACTIONS (Moneroo)
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  customer_id uuid REFERENCES public.customers(id),
  customer_name text,
  customer_email text,
  moneroo_transaction_id text,
  moneroo_payment_method text,
  amount numeric,
  currency text DEFAULT 'XOF',
  status text DEFAULT 'pending',
  metadata jsonb,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can insert transactions" ON public.transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);
CREATE POLICY "Store owners can update transactions" ON public.transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);

-- 10. REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text NOT NULL,
  product_type text,
  quality_rating integer,
  value_rating integer,
  service_rating integer,
  delivery_rating integer,
  course_content_rating integer,
  instructor_rating integer,
  verified_purchase boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  reviewer_name text,
  reviewer_avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- 11. USER ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- UTILITY FUNCTIONS (RPC)
-- =============================================

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
BEGIN
  new_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6));
  RETURN new_number;
END;
$$;

-- Generate slug
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(trim(input_text), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$;

-- Check store slug availability
CREATE OR REPLACE FUNCTION public.is_store_slug_available(check_slug text, exclude_store_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF exclude_store_id IS NOT NULL THEN
    RETURN NOT EXISTS (SELECT 1 FROM public.stores WHERE slug = check_slug AND id != exclude_store_id);
  ELSE
    RETURN NOT EXISTS (SELECT 1 FROM public.stores WHERE slug = check_slug);
  END IF;
END;
$$;

-- Check product slug availability
CREATE OR REPLACE FUNCTION public.is_product_slug_available(check_slug text, check_store_id uuid, exclude_product_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF exclude_product_id IS NOT NULL THEN
    RETURN NOT EXISTS (SELECT 1 FROM public.products WHERE slug = check_slug AND store_id = check_store_id AND id != exclude_product_id);
  ELSE
    RETURN NOT EXISTS (SELECT 1 FROM public.products WHERE slug = check_slug AND store_id = check_store_id);
  END IF;
END;
$$;

-- Generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN upper(substr(gen_random_uuid()::text, 1, 8));
END;
$$;

-- Get platform customization (returns empty settings for now)
CREATE OR REPLACE FUNCTION public.get_platform_customization()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'platform_name', 'Emarzona',
    'primary_color', '#F59E0B',
    'secondary_color', '#1E293B',
    'logo_url', null,
    'favicon_url', null,
    'maintenance_mode', false
  );
END;
$$;

-- Get AI recommendation settings (returns default settings)
CREATE OR REPLACE FUNCTION public.get_ai_recommendation_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'enabled', true,
    'model', 'collaborative_filtering',
    'max_recommendations', 10,
    'min_score', 0.5,
    'personalization_enabled', true
  );
END;
$$;

-- Get dashboard stats RPC
CREATE OR REPLACE FUNCTION public.get_dashboard_stats_rpc(store_id uuid, period_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  start_date timestamptz;
  total_products integer;
  active_products integer;
  total_orders integer;
  completed_orders integer;
  total_revenue numeric;
  total_customers integer;
BEGIN
  start_date := now() - (period_days || ' days')::interval;

  SELECT count(*), count(*) FILTER (WHERE is_active) INTO total_products, active_products
  FROM public.products WHERE products.store_id = get_dashboard_stats_rpc.store_id;

  SELECT count(*), count(*) FILTER (WHERE status = 'completed'),
         COALESCE(sum(total_amount) FILTER (WHERE status = 'completed'), 0)
  INTO total_orders, completed_orders, total_revenue
  FROM public.orders WHERE orders.store_id = get_dashboard_stats_rpc.store_id
    AND created_at >= start_date;

  SELECT count(*) INTO total_customers
  FROM public.customers WHERE customers.store_id = get_dashboard_stats_rpc.store_id;

  result := jsonb_build_object(
    'total_products', total_products,
    'active_products', active_products,
    'total_orders', total_orders,
    'completed_orders', completed_orders,
    'total_revenue', total_revenue,
    'total_customers', total_customers,
    'period_days', period_days
  );

  RETURN result;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
