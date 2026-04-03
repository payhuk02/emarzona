
-- BATCH 2A: Create tables (no dynamic policy loops)

CREATE TABLE IF NOT EXISTS public.digital_product_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, license_key text NOT NULL, license_type text DEFAULT 'standard',
  status text DEFAULT 'active', max_activations integer DEFAULT 1, current_activations integer DEFAULT 0,
  expires_at timestamptz, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE, store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL, discount_type text DEFAULT 'percentage', discount_value numeric NOT NULL,
  max_uses integer, current_uses integer DEFAULT 0, min_purchase_amount numeric,
  starts_at timestamptz, expires_at timestamptz, is_active boolean DEFAULT true, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  bundle_name text NOT NULL, description text, price numeric NOT NULL, compare_at_price numeric,
  product_ids uuid[] DEFAULT '{}', is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL, event_types text[] DEFAULT '{}', is_active boolean DEFAULT true,
  secret text, headers jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.digital_product_webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, payload jsonb, response_status integer, response_body text,
  success boolean DEFAULT false, error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, plan_type text DEFAULT 'monthly', status text DEFAULT 'active',
  amount numeric, currency text DEFAULT 'XOF', current_period_start timestamptz, current_period_end timestamptz,
  cancelled_at timestamptz, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  version_number text NOT NULL, file_url text NOT NULL, file_name text, file_size bigint,
  changelog text, is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_file_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL, file_name text, file_type text, file_size bigint, mime_type text,
  checksum text, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_file_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  category_name text NOT NULL, description text, sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_drip_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  content_name text NOT NULL, content_url text, release_delay_days integer DEFAULT 0,
  sort_order integer DEFAULT 0, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_product_update_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id uuid REFERENCES public.digital_product_updates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, status text DEFAULT 'pending', sent_at timestamptz, read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_license_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES public.digital_product_licenses(id) ON DELETE CASCADE NOT NULL,
  device_name text, device_id text, ip_address text, is_active boolean DEFAULT true,
  activated_at timestamptz DEFAULT now(), deactivated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.digital_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, slug text, description text, price numeric NOT NULL,
  product_ids uuid[] DEFAULT '{}', image_url text, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE, user_id uuid,
  file_url text, file_name text, ip_address text, user_agent text, download_token text,
  status text DEFAULT 'completed', created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.download_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, token text UNIQUE NOT NULL, max_downloads integer DEFAULT 5,
  download_count integer DEFAULT 0, expires_at timestamptz, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.download_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.download_tokens(id), product_id uuid REFERENCES public.products(id),
  user_id uuid, ip_address text, user_agent text, status text DEFAULT 'success', error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.drip_content_releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES public.digital_product_drip_schedule(id) ON DELETE CASCADE,
  user_id uuid NOT NULL, released_at timestamptz DEFAULT now(), accessed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.license_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES public.digital_product_licenses(id) ON DELETE CASCADE NOT NULL,
  device_info jsonb, ip_address text, is_active boolean DEFAULT true,
  activated_at timestamptz DEFAULT now(), deactivated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.license_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid REFERENCES public.digital_product_licenses(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, event_data jsonb, ip_address text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.version_download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES public.digital_product_file_versions(id) ON DELETE CASCADE,
  user_id uuid, ip_address text, created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.version_download_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid REFERENCES public.digital_product_file_versions(id) ON DELETE CASCADE,
  user_id uuid, error_message text, error_code text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.version_rollback_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  from_version_id uuid, to_version_id uuid, rolled_back_by uuid, reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.expiration_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE, license_id uuid,
  user_id uuid NOT NULL, alert_type text DEFAULT 'license_expiring',
  alert_date timestamptz, is_sent boolean DEFAULT false, sent_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.secured_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, amount numeric NOT NULL, currency text DEFAULT 'XOF',
  payment_method text, provider text, provider_transaction_id text,
  status text DEFAULT 'pending', escrow_status text DEFAULT 'held',
  released_at timestamptz, refunded_at timestamptz, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, rating integer NOT NULL, title text, content text,
  pros text, cons text, is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false, is_featured boolean DEFAULT false,
  helpful_count integer DEFAULT 0, images jsonb, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_review_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL UNIQUE,
  average_rating numeric DEFAULT 0, total_reviews integer DEFAULT 0,
  rating_1 integer DEFAULT 0, rating_2 integer DEFAULT 0, rating_3 integer DEFAULT 0,
  rating_4 integer DEFAULT 0, rating_5 integer DEFAULT 0,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.review_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.product_reviews(id) ON DELETE CASCADE NOT NULL,
  media_type text DEFAULT 'image', media_url text NOT NULL, thumbnail_url text, alt_text text,
  display_order integer DEFAULT 0, created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.product_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, content text NOT NULL, is_store_reply boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.product_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, vote_type text DEFAULT 'helpful',
  created_at timestamptz DEFAULT now() NOT NULL, UNIQUE(review_id, user_id)
);
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  views integer DEFAULT 0, clicks integer DEFAULT 0, add_to_cart integer DEFAULT 0,
  purchases integer DEFAULT 0, revenue numeric DEFAULT 0, conversion_rate numeric DEFAULT 0,
  period_start timestamptz, period_end timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  user_id uuid, session_id text, source text, referrer text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  version_number text NOT NULL, changes jsonb, published_at timestamptz, created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_size_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  chart_name text NOT NULL, chart_data jsonb, unit text DEFAULT 'cm',
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  cost_type text DEFAULT 'cogs', amount numeric NOT NULL, currency text DEFAULT 'XOF',
  effective_date date, notes text,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  kit_name text NOT NULL, description text, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.kit_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid REFERENCES public.product_kits(id) ON DELETE CASCADE NOT NULL,
  component_product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1, is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.kit_assemblies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid REFERENCES public.product_kits(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id), status text DEFAULT 'pending',
  assembled_at timestamptz, notes text,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  promotion_type text DEFAULT 'discount', discount_value numeric, discount_type text DEFAULT 'percentage',
  starts_at timestamptz, ends_at timestamptz, is_active boolean DEFAULT true,
  max_uses integer, current_uses integer DEFAULT 0, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.promotion_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id uuid REFERENCES public.product_promotions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL, order_id uuid REFERENCES public.orders(id),
  discount_applied numeric, created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  bundle_name text NOT NULL, description text, bundle_price numeric NOT NULL,
  is_active boolean DEFAULT true, image_url text,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid REFERENCES public.product_bundles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1, created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  template_name text NOT NULL, template_data jsonb, product_type text, is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.product_return_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  policy_name text NOT NULL, description text, return_window_days integer DEFAULT 30,
  conditions text, is_default boolean DEFAULT false, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.return_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  policy_name text NOT NULL, description text, return_window_days integer DEFAULT 30,
  refund_type text DEFAULT 'full', conditions jsonb, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.variant_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES public.physical_product_variants(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL, alt_text text, display_order integer DEFAULT 0, is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid, warehouse_id uuid REFERENCES public.warehouses(id), sku text,
  quantity integer DEFAULT 0, reserved_quantity integer DEFAULT 0, available_quantity integer DEFAULT 0,
  reorder_point integer DEFAULT 5, reorder_quantity integer DEFAULT 10, cost_per_unit numeric,
  location text, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.auto_reorder_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  supplier_id uuid REFERENCES public.suppliers(id), reorder_point integer DEFAULT 5,
  reorder_quantity integer DEFAULT 10, max_stock integer DEFAULT 100, is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.lot_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid REFERENCES public.product_lots(id) ON DELETE CASCADE NOT NULL,
  movement_type text NOT NULL, quantity integer NOT NULL, from_location text, to_location text,
  reference_id uuid, reference_type text, notes text, performed_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.lot_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id uuid REFERENCES public.product_lots(id) ON DELETE CASCADE NOT NULL,
  from_warehouse_id uuid REFERENCES public.warehouses(id), to_warehouse_id uuid REFERENCES public.warehouses(id),
  quantity integer NOT NULL, status text DEFAULT 'pending', transferred_at timestamptz, notes text,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.serial_number_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number_id uuid REFERENCES public.serial_numbers(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, event_data jsonb, performed_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  forecast_date date NOT NULL, predicted_demand integer, confidence_level numeric,
  model_used text, actual_demand integer, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.reorder_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  suggested_quantity integer NOT NULL, reason text, priority text DEFAULT 'medium',
  status text DEFAULT 'pending', actioned_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.stock_rotation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  report_date date NOT NULL, report_data jsonb, total_products integer,
  slow_moving_count integer, fast_moving_count integer,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.warehouse_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid, quantity integer DEFAULT 0, reserved_quantity integer DEFAULT 0,
  location_code text, bin_number text,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.warehouse_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  location_code text NOT NULL, zone text, aisle text, rack text, shelf text, bin text,
  is_active boolean DEFAULT true, capacity integer, current_items integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.warehouse_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_warehouse_id uuid REFERENCES public.warehouses(id) NOT NULL,
  to_warehouse_id uuid REFERENCES public.warehouses(id) NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending', initiated_by uuid, notes text, completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.warehouse_transfer_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid REFERENCES public.warehouse_transfers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid, quantity integer NOT NULL, received_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.warehouse_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL, status text DEFAULT 'allocated',
  allocated_at timestamptz DEFAULT now(), picked_at timestamptz, packed_at timestamptz, shipped_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.warehouse_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid REFERENCES public.warehouses(id) ON DELETE CASCADE NOT NULL,
  metric_date date NOT NULL, orders_processed integer DEFAULT 0, items_shipped integer DEFAULT 0,
  avg_fulfillment_time_hours numeric, accuracy_rate numeric DEFAULT 100, utilization_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.supplier_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  order_number text, status text DEFAULT 'pending', total_amount numeric DEFAULT 0,
  currency text DEFAULT 'XOF', expected_delivery_date date, actual_delivery_date date,
  notes text, metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.supplier_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_order_id uuid REFERENCES public.supplier_orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL, unit_price numeric NOT NULL, received_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  supplier_sku text, supplier_price numeric, lead_time_days integer,
  min_order_quantity integer DEFAULT 1, is_preferred boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL, updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.digital_product_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_file_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_drip_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_update_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drip_content_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_download_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_download_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_rollback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiration_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secured_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_review_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_size_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_return_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_reorder_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serial_number_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_rotation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies (explicit, no dynamic loops)
CREATE POLICY "rls_digital_product_licenses" ON public.digital_product_licenses FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "rls_digital_product_coupons" ON public.digital_product_coupons FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_digital_product_bundles" ON public.digital_product_bundles FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_digital_product_webhooks" ON public.digital_product_webhooks FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_read_digital_product_webhook_logs" ON public.digital_product_webhook_logs FOR SELECT TO authenticated USING (webhook_id IN (SELECT id FROM public.digital_product_webhooks WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_digital_product_subscriptions" ON public.digital_product_subscriptions FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR user_id = auth.uid());
CREATE POLICY "rls_digital_product_file_versions" ON public.digital_product_file_versions FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_digital_product_file_metadata" ON public.digital_product_file_metadata FOR ALL TO authenticated USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_digital_product_file_categories" ON public.digital_product_file_categories FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_digital_product_drip_schedule" ON public.digital_product_drip_schedule FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_digital_product_update_notifications" ON public.digital_product_update_notifications FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_digital_license_activations" ON public.digital_license_activations FOR ALL TO authenticated USING (license_id IN (SELECT id FROM public.digital_product_licenses WHERE user_id = auth.uid()));
CREATE POLICY "rls_digital_bundles" ON public.digital_bundles FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_download_logs" ON public.download_logs FOR ALL TO authenticated USING (user_id = auth.uid() OR product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_download_tokens" ON public.download_tokens FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_download_events" ON public.download_events FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_drip_content_releases" ON public.drip_content_releases FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_license_activations" ON public.license_activations FOR ALL TO authenticated USING (license_id IN (SELECT id FROM public.digital_product_licenses WHERE user_id = auth.uid()));
CREATE POLICY "rls_license_events_read" ON public.license_events FOR SELECT TO authenticated USING (license_id IN (SELECT id FROM public.digital_product_licenses WHERE user_id = auth.uid()));
CREATE POLICY "rls_license_events_insert" ON public.license_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rls_version_download_logs" ON public.version_download_logs FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_version_download_errors" ON public.version_download_errors FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_version_rollback_logs" ON public.version_rollback_logs FOR ALL TO authenticated USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_expiration_alerts" ON public.expiration_alerts FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_secured_payments" ON public.secured_payments FOR ALL TO authenticated USING (user_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_product_reviews_public" ON public.product_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "rls_product_reviews_manage" ON public.product_reviews FOR ALL TO authenticated USING (user_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_product_review_stats_public" ON public.product_review_stats FOR SELECT USING (true);
CREATE POLICY "rls_review_media_public" ON public.review_media FOR SELECT USING (true);
CREATE POLICY "rls_review_replies" ON public.review_replies FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_review_votes" ON public.review_votes FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "rls_product_analytics" ON public.product_analytics FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_product_clicks_insert" ON public.product_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "rls_product_clicks_read" ON public.product_clicks FOR SELECT TO authenticated USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_product_versions" ON public.product_versions FOR ALL TO authenticated USING (product_id IN (SELECT id FROM public.products WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_product_size_charts" ON public.product_size_charts FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_product_costs" ON public.product_costs FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_product_kits" ON public.product_kits FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_kit_components" ON public.kit_components FOR ALL TO authenticated USING (kit_id IN (SELECT id FROM public.product_kits WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_kit_assemblies" ON public.kit_assemblies FOR ALL TO authenticated USING (kit_id IN (SELECT id FROM public.product_kits WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_product_promotions" ON public.product_promotions FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_promotion_usage_read" ON public.promotion_usage FOR SELECT TO authenticated USING (promotion_id IN (SELECT id FROM public.product_promotions WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_promotion_usage_insert" ON public.promotion_usage FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "rls_product_bundles" ON public.product_bundles FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_bundle_items" ON public.bundle_items FOR ALL TO authenticated USING (bundle_id IN (SELECT id FROM public.product_bundles WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_product_templates" ON public.product_templates FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_product_return_policies" ON public.product_return_policies FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_return_policies" ON public.return_policies FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_variant_images_public" ON public.variant_images FOR SELECT USING (true);
CREATE POLICY "rls_variant_images_manage" ON public.variant_images FOR ALL TO authenticated USING (variant_id IN (SELECT id FROM public.physical_product_variants WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_inventory_items" ON public.inventory_items FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_auto_reorder_rules" ON public.auto_reorder_rules FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_lot_movements" ON public.lot_movements FOR ALL TO authenticated USING (lot_id IN (SELECT id FROM public.product_lots WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_lot_transfers" ON public.lot_transfers FOR ALL TO authenticated USING (lot_id IN (SELECT id FROM public.product_lots WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_serial_number_history" ON public.serial_number_history FOR ALL TO authenticated USING (serial_number_id IN (SELECT id FROM public.serial_numbers WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_demand_forecasts" ON public.demand_forecasts FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_reorder_suggestions" ON public.reorder_suggestions FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_stock_rotation_reports" ON public.stock_rotation_reports FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_warehouse_inventory" ON public.warehouse_inventory FOR ALL TO authenticated USING (warehouse_id IN (SELECT id FROM public.warehouses WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_warehouse_locations" ON public.warehouse_locations FOR ALL TO authenticated USING (warehouse_id IN (SELECT id FROM public.warehouses WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_warehouse_transfers" ON public.warehouse_transfers FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_warehouse_transfer_items" ON public.warehouse_transfer_items FOR ALL TO authenticated USING (transfer_id IN (SELECT id FROM public.warehouse_transfers WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_warehouse_allocations" ON public.warehouse_allocations FOR ALL TO authenticated USING (warehouse_id IN (SELECT id FROM public.warehouses WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_warehouse_performance" ON public.warehouse_performance FOR SELECT TO authenticated USING (warehouse_id IN (SELECT id FROM public.warehouses WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_supplier_orders" ON public.supplier_orders FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
CREATE POLICY "rls_supplier_order_items" ON public.supplier_order_items FOR ALL TO authenticated USING (supplier_order_id IN (SELECT id FROM public.supplier_orders WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
CREATE POLICY "rls_supplier_products" ON public.supplier_products FOR ALL TO authenticated USING (supplier_id IN (SELECT id FROM public.suppliers WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
