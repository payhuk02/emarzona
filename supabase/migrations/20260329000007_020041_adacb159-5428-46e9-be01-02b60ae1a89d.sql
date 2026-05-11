
-- Add updated_at triggers to all tables that have an updated_at column
-- The function update_updated_at_column() already exists

DROP TRIGGER IF EXISTS set_updated_at_abandoned_carts ON public.abandoned_carts;
CREATE OR REPLACE TRIGGER set_updated_at_abandoned_carts
  BEFORE UPDATE ON public.abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_affiliate_commissions ON public.affiliate_commissions;
CREATE OR REPLACE TRIGGER set_updated_at_affiliate_commissions
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_affiliate_links ON public.affiliate_links;
CREATE OR REPLACE TRIGGER set_updated_at_affiliate_links
  BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_affiliate_withdrawals ON public.affiliate_withdrawals;
CREATE OR REPLACE TRIGGER set_updated_at_affiliate_withdrawals
  BEFORE UPDATE ON public.affiliate_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_affiliates ON public.affiliates;
CREATE OR REPLACE TRIGGER set_updated_at_affiliates
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_bookings ON public.bookings;
CREATE OR REPLACE TRIGGER set_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_categories ON public.categories;
CREATE OR REPLACE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_cookie_preferences ON public.cookie_preferences;
CREATE OR REPLACE TRIGGER set_updated_at_cookie_preferences
  BEFORE UPDATE ON public.cookie_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_course_enrollments ON public.course_enrollments;
CREATE OR REPLACE TRIGGER set_updated_at_course_enrollments
  BEFORE UPDATE ON public.course_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_course_lesson_progress ON public.course_lesson_progress;
CREATE OR REPLACE TRIGGER set_updated_at_course_lesson_progress
  BEFORE UPDATE ON public.course_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_course_lessons ON public.course_lessons;
CREATE OR REPLACE TRIGGER set_updated_at_course_lessons
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_course_notes ON public.course_notes;
CREATE OR REPLACE TRIGGER set_updated_at_course_notes
  BEFORE UPDATE ON public.course_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_course_quizzes ON public.course_quizzes;
CREATE OR REPLACE TRIGGER set_updated_at_course_quizzes
  BEFORE UPDATE ON public.course_quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_course_sections ON public.course_sections;
CREATE OR REPLACE TRIGGER set_updated_at_course_sections
  BEFORE UPDATE ON public.course_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_courses ON public.courses;
CREATE OR REPLACE TRIGGER set_updated_at_courses
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_customers ON public.customers;
CREATE OR REPLACE TRIGGER set_updated_at_customers
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_digital_licenses ON public.digital_licenses;
CREATE OR REPLACE TRIGGER set_updated_at_digital_licenses
  BEFORE UPDATE ON public.digital_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_digital_product_files ON public.digital_product_files;
CREATE OR REPLACE TRIGGER set_updated_at_digital_product_files
  BEFORE UPDATE ON public.digital_product_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_digital_products ON public.digital_products;
CREATE OR REPLACE TRIGGER set_updated_at_digital_products
  BEFORE UPDATE ON public.digital_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_inventory ON public.inventory;
CREATE OR REPLACE TRIGGER set_updated_at_inventory
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_invoices ON public.invoices;
CREATE OR REPLACE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_notification_preferences ON public.notification_preferences;
CREATE OR REPLACE TRIGGER set_updated_at_notification_preferences
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_orders ON public.orders;
CREATE OR REPLACE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
CREATE OR REPLACE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_physical_products ON public.physical_products;
CREATE OR REPLACE TRIGGER set_updated_at_physical_products
  BEFORE UPDATE ON public.physical_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_product_affiliate_settings ON public.product_affiliate_settings;
CREATE OR REPLACE TRIGGER set_updated_at_product_affiliate_settings
  BEFORE UPDATE ON public.product_affiliate_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_product_variants ON public.product_variants;
CREATE OR REPLACE TRIGGER set_updated_at_product_variants
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_products ON public.products;
CREATE OR REPLACE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_promotions ON public.promotions;
CREATE OR REPLACE TRIGGER set_updated_at_promotions
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_reviews ON public.reviews;
CREATE OR REPLACE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
CREATE OR REPLACE TRIGGER set_updated_at_services
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shipments ON public.shipments;
CREATE OR REPLACE TRIGGER set_updated_at_shipments
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shipping_rates ON public.shipping_rates;
CREATE OR REPLACE TRIGGER set_updated_at_shipping_rates
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_shipping_zones ON public.shipping_zones;
CREATE OR REPLACE TRIGGER set_updated_at_shipping_zones
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_stores ON public.stores;
CREATE OR REPLACE TRIGGER set_updated_at_stores
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_transactions ON public.transactions;
CREATE OR REPLACE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Also add the handle_new_user trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
