
-- BATCH 1: Physical product system tables
CREATE TABLE IF NOT EXISTS public.physical_product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  variant_name text NOT NULL,
  sku text,
  barcode text,
  price numeric DEFAULT 0,
  compare_at_price numeric,
  cost_price numeric,
  weight numeric,
  weight_unit text DEFAULT 'kg',
  dimensions jsonb,
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  is_active boolean DEFAULT true,
  image_url text,
  options jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  variant_id uuid,
  alert_type text DEFAULT 'low_stock',
  threshold integer DEFAULT 5,
  current_stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  target_price numeric NOT NULL,
  alert_type text DEFAULT 'price_drop',
  is_active boolean DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  user_id uuid,
  session_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  event_types text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  secret text,
  headers jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES public.physical_product_webhooks(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  payload jsonb,
  response_status integer,
  response_body text,
  success boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  message text,
  severity text DEFAULT 'info',
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_shipment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  recipient_email text,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_return_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL,
  recipient_email text,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_promotion_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  promotion_type text NOT NULL,
  message text,
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  frequency text DEFAULT 'monthly',
  quantity integer DEFAULT 1,
  status text DEFAULT 'active',
  next_delivery_at timestamptz,
  last_delivery_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  zone_name text NOT NULL,
  countries text[] DEFAULT '{}',
  regions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.physical_product_shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id uuid REFERENCES public.physical_product_shipping_zones(id) ON DELETE CASCADE NOT NULL,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  rate_name text NOT NULL,
  rate_type text DEFAULT 'flat',
  price numeric DEFAULT 0,
  min_weight numeric,
  max_weight numeric,
  min_order_amount numeric,
  max_order_amount numeric,
  estimated_days_min integer,
  estimated_days_max integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Admin config
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb,
  description text,
  category text DEFAULT 'general',
  is_sensitive boolean DEFAULT false,
  updated_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Transaction logs
CREATE TABLE IF NOT EXISTS public.transaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text,
  event_type text NOT NULL,
  status text,
  request_data jsonb,
  response_data jsonb,
  error_data jsonb,
  user_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Shipping system
CREATE TABLE IF NOT EXISTS public.shipping_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid REFERENCES public.shipments(id) ON DELETE CASCADE,
  shipping_label_id uuid,
  tracking_number text,
  event_type text NOT NULL,
  event_description text,
  event_location text,
  event_timestamp timestamptz DEFAULT now(),
  raw_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  carrier_id uuid REFERENCES public.shipping_carriers(id),
  tracking_number text,
  label_url text,
  label_format text DEFAULT 'pdf',
  status text DEFAULT 'created',
  rate_amount numeric,
  rate_currency text DEFAULT 'XOF',
  weight numeric,
  dimensions jsonb,
  from_address jsonb,
  to_address jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_pickup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  carrier_id uuid REFERENCES public.shipping_carriers(id),
  pickup_date date NOT NULL,
  pickup_time_start text,
  pickup_time_end text,
  address jsonb,
  status text DEFAULT 'pending',
  confirmation_number text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.global_shipping_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  website_url text,
  api_endpoint text,
  supported_countries text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_service_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  shipping_service_id uuid REFERENCES public.global_shipping_services(id),
  store_user_id uuid NOT NULL,
  subject text,
  status text DEFAULT 'open',
  priority text DEFAULT 'normal',
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shipping_service_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.shipping_service_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid NOT NULL,
  sender_type text DEFAULT 'store',
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  attachments jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Notification system
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  notification_type text NOT NULL,
  channel text DEFAULT 'in_app',
  status text DEFAULT 'sent',
  title text,
  message text,
  metadata jsonb,
  error_message text,
  sent_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  event_type text NOT NULL,
  conditions jsonb,
  actions jsonb,
  channels text[] DEFAULT '{in_app}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  channel text DEFAULT 'in_app',
  count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  max_per_window integer DEFAULT 10,
  window_duration interval DEFAULT '1 hour',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_key text UNIQUE NOT NULL,
  subject text,
  body_template text,
  html_template text,
  channel text DEFAULT 'email',
  variables jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.notification_templates(id) ON DELETE CASCADE NOT NULL,
  locale text NOT NULL,
  subject text,
  body_template text,
  html_template text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.notifications(id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text DEFAULT 'pending',
  provider text,
  provider_id text,
  error_message text,
  retry_count integer DEFAULT 0,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_retries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid REFERENCES public.notification_deliveries(id) ON DELETE CASCADE,
  attempt_number integer DEFAULT 1,
  status text DEFAULT 'pending',
  error_message text,
  scheduled_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid,
  delivery_id uuid,
  channel text,
  error_message text,
  payload jsonb,
  max_retries_reached boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text,
  message text,
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'scheduled',
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  notification_type text DEFAULT 'info',
  action_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on all new tables
ALTER TABLE public.physical_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_shipment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_return_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_promotion_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_product_shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_shipping_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_service_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_retries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for all tables (store-owner pattern + public read where needed)
DROP POLICY IF EXISTS "Store owners manage physical_product_variants" ON public.physical_product_variants;
CREATE POLICY "Store owners manage physical_product_variants" ON public.physical_product_variants FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Public read physical_product_variants" ON public.physical_product_variants;
CREATE POLICY "Public read physical_product_variants" ON public.physical_product_variants FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Store owners manage physical_product_images" ON public.physical_product_images;
CREATE POLICY "Store owners manage physical_product_images" ON public.physical_product_images FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Public read physical_product_images" ON public.physical_product_images;
CREATE POLICY "Public read physical_product_images" ON public.physical_product_images FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Store owners manage physical_product_stock_alerts" ON public.physical_product_stock_alerts;
CREATE POLICY "Store owners manage physical_product_stock_alerts" ON public.physical_product_stock_alerts FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage physical_product_price_alerts" ON public.physical_product_price_alerts;
CREATE POLICY "Store owners manage physical_product_price_alerts" ON public.physical_product_price_alerts FOR ALL TO authenticated USING (user_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage physical_product_analytics" ON public.physical_product_analytics;
CREATE POLICY "Store owners manage physical_product_analytics" ON public.physical_product_analytics FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage physical_product_webhooks" ON public.physical_product_webhooks;
CREATE POLICY "Store owners manage physical_product_webhooks" ON public.physical_product_webhooks FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners read physical_product_webhook_logs" ON public.physical_product_webhook_logs;
CREATE POLICY "Store owners read physical_product_webhook_logs" ON public.physical_product_webhook_logs FOR SELECT TO authenticated USING (webhook_id IN (SELECT id FROM public.physical_product_webhooks WHERE store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid())));
DROP POLICY IF EXISTS "Store owners manage physical_product_alerts" ON public.physical_product_alerts;
CREATE POLICY "Store owners manage physical_product_alerts" ON public.physical_product_alerts FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage physical_product_shipment_notifications" ON public.physical_product_shipment_notifications;
CREATE POLICY "Store owners manage physical_product_shipment_notifications" ON public.physical_product_shipment_notifications FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage physical_product_return_notifications" ON public.physical_product_return_notifications;
CREATE POLICY "Store owners manage physical_product_return_notifications" ON public.physical_product_return_notifications FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage physical_product_promotion_alerts" ON public.physical_product_promotion_alerts;
CREATE POLICY "Store owners manage physical_product_promotion_alerts" ON public.physical_product_promotion_alerts FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users manage own physical_product_subscriptions" ON public.physical_product_subscriptions;
CREATE POLICY "Users manage own physical_product_subscriptions" ON public.physical_product_subscriptions FOR ALL TO authenticated USING (user_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage physical_product_shipping_zones" ON public.physical_product_shipping_zones;
CREATE POLICY "Store owners manage physical_product_shipping_zones" ON public.physical_product_shipping_zones FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Public read shipping zones" ON public.physical_product_shipping_zones;
CREATE POLICY "Public read shipping zones" ON public.physical_product_shipping_zones FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Store owners manage physical_product_shipping_rates" ON public.physical_product_shipping_rates;
CREATE POLICY "Store owners manage physical_product_shipping_rates" ON public.physical_product_shipping_rates FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Public read shipping rates" ON public.physical_product_shipping_rates;
CREATE POLICY "Public read shipping rates" ON public.physical_product_shipping_rates FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Admins manage admin_config" ON public.admin_config;
CREATE POLICY "Admins manage admin_config" ON public.admin_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated read admin_config" ON public.admin_config;
CREATE POLICY "Authenticated read admin_config" ON public.admin_config FOR SELECT TO authenticated USING (NOT is_sensitive);
DROP POLICY IF EXISTS "Users read own transaction_logs" ON public.transaction_logs;
CREATE POLICY "Users read own transaction_logs" ON public.transaction_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated insert transaction_logs" ON public.transaction_logs;
CREATE POLICY "Authenticated insert transaction_logs" ON public.transaction_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Store owners manage shipping_tracking_events" ON public.shipping_tracking_events;
CREATE POLICY "Store owners manage shipping_tracking_events" ON public.shipping_tracking_events FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Store owners manage shipping_labels" ON public.shipping_labels;
CREATE POLICY "Store owners manage shipping_labels" ON public.shipping_labels FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Store owners manage shipping_pickup_requests" ON public.shipping_pickup_requests;
CREATE POLICY "Store owners manage shipping_pickup_requests" ON public.shipping_pickup_requests FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Public read global_shipping_services" ON public.global_shipping_services;
CREATE POLICY "Public read global_shipping_services" ON public.global_shipping_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage global_shipping_services" ON public.global_shipping_services;
CREATE POLICY "Admins manage global_shipping_services" ON public.global_shipping_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Participants manage shipping_service_conversations" ON public.shipping_service_conversations;
CREATE POLICY "Participants manage shipping_service_conversations" ON public.shipping_service_conversations FOR ALL TO authenticated USING (store_user_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Participants manage shipping_service_messages" ON public.shipping_service_messages;
CREATE POLICY "Participants manage shipping_service_messages" ON public.shipping_service_messages FOR ALL TO authenticated USING (conversation_id IN (SELECT id FROM public.shipping_service_conversations WHERE store_user_id = auth.uid()));
DROP POLICY IF EXISTS "Users read own notification_logs" ON public.notification_logs;
CREATE POLICY "Users read own notification_logs" ON public.notification_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "System insert notification_logs" ON public.notification_logs;
CREATE POLICY "System insert notification_logs" ON public.notification_logs FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Store owners manage notification_rules" ON public.notification_rules;
CREATE POLICY "Store owners manage notification_rules" ON public.notification_rules FOR ALL TO authenticated USING (store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Users manage own notification_rate_limits" ON public.notification_rate_limits;
CREATE POLICY "Users manage own notification_rate_limits" ON public.notification_rate_limits FOR ALL TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage notification_templates" ON public.notification_templates;
CREATE POLICY "Admins manage notification_templates" ON public.notification_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated read notification_templates" ON public.notification_templates;
CREATE POLICY "Authenticated read notification_templates" ON public.notification_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins manage notification_translations" ON public.notification_translations;
CREATE POLICY "Admins manage notification_translations" ON public.notification_translations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Authenticated read notification_translations" ON public.notification_translations;
CREATE POLICY "Authenticated read notification_translations" ON public.notification_translations FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users read own notification_deliveries" ON public.notification_deliveries;
CREATE POLICY "Users read own notification_deliveries" ON public.notification_deliveries FOR SELECT TO authenticated USING (notification_id IN (SELECT id FROM public.notifications WHERE user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "System insert notification_deliveries" ON public.notification_deliveries;
CREATE POLICY "System insert notification_deliveries" ON public.notification_deliveries FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read notification_retries" ON public.notification_retries;
CREATE POLICY "Admins read notification_retries" ON public.notification_retries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "System insert notification_retries" ON public.notification_retries;
CREATE POLICY "System insert notification_retries" ON public.notification_retries FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read notification_dead_letters" ON public.notification_dead_letters;
CREATE POLICY "Admins read notification_dead_letters" ON public.notification_dead_letters FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "System insert notification_dead_letters" ON public.notification_dead_letters;
CREATE POLICY "System insert notification_dead_letters" ON public.notification_dead_letters FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Users manage own scheduled_notifications" ON public.scheduled_notifications;
CREATE POLICY "Users manage own scheduled_notifications" ON public.scheduled_notifications FOR ALL TO authenticated USING (user_id = auth.uid() OR store_id IN (SELECT id FROM public.stores WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users manage own in_app_notifications" ON public.in_app_notifications;
CREATE POLICY "Users manage own in_app_notifications" ON public.in_app_notifications FOR ALL TO authenticated USING (user_id = auth.uid());

-- updated_at triggers
DROP TRIGGER IF EXISTS update_physical_product_variants_updated_at ON public.physical_product_variants;
CREATE TRIGGER update_physical_product_variants_updated_at BEFORE UPDATE ON public.physical_product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_physical_product_stock_alerts_updated_at ON public.physical_product_stock_alerts;
CREATE TRIGGER update_physical_product_stock_alerts_updated_at BEFORE UPDATE ON public.physical_product_stock_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_physical_product_price_alerts_updated_at ON public.physical_product_price_alerts;
CREATE TRIGGER update_physical_product_price_alerts_updated_at BEFORE UPDATE ON public.physical_product_price_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_physical_product_webhooks_updated_at ON public.physical_product_webhooks;
CREATE TRIGGER update_physical_product_webhooks_updated_at BEFORE UPDATE ON public.physical_product_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_physical_product_promotion_alerts_updated_at ON public.physical_product_promotion_alerts;
CREATE TRIGGER update_physical_product_promotion_alerts_updated_at BEFORE UPDATE ON public.physical_product_promotion_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_physical_product_subscriptions_updated_at ON public.physical_product_subscriptions;
CREATE TRIGGER update_physical_product_subscriptions_updated_at BEFORE UPDATE ON public.physical_product_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_physical_product_shipping_zones_updated_at ON public.physical_product_shipping_zones;
CREATE TRIGGER update_physical_product_shipping_zones_updated_at BEFORE UPDATE ON public.physical_product_shipping_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_physical_product_shipping_rates_updated_at ON public.physical_product_shipping_rates;
CREATE TRIGGER update_physical_product_shipping_rates_updated_at BEFORE UPDATE ON public.physical_product_shipping_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_admin_config_updated_at ON public.admin_config;
CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON public.admin_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_shipping_labels_updated_at ON public.shipping_labels;
CREATE TRIGGER update_shipping_labels_updated_at BEFORE UPDATE ON public.shipping_labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_shipping_pickup_requests_updated_at ON public.shipping_pickup_requests;
CREATE TRIGGER update_shipping_pickup_requests_updated_at BEFORE UPDATE ON public.shipping_pickup_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_global_shipping_services_updated_at ON public.global_shipping_services;
CREATE TRIGGER update_global_shipping_services_updated_at BEFORE UPDATE ON public.global_shipping_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_shipping_service_conversations_updated_at ON public.shipping_service_conversations;
CREATE TRIGGER update_shipping_service_conversations_updated_at BEFORE UPDATE ON public.shipping_service_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON public.notification_rules;
CREATE TRIGGER update_notification_rules_updated_at BEFORE UPDATE ON public.notification_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER update_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notification_translations_updated_at ON public.notification_translations;
CREATE TRIGGER update_notification_translations_updated_at BEFORE UPDATE ON public.notification_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
