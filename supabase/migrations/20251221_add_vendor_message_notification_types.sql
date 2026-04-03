-- =========================================================
-- Migration : Ajout des types de notifications pour messages vendeur
-- Date : 21/12/2025
-- Description : Ajoute les types de notifications manquants pour le système de messagerie vendeur
-- =========================================================

-- Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Ajouter la nouvelle contrainte avec tous les types (existants + nouveaux pour messages vendeur)
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  -- Cours (existants)
  'course_enrollment',
  'lesson_complete',
  'course_complete',
  'certificate_ready',
  'new_course',
  'course_update',
  'quiz_passed',
  'quiz_failed',
  
  -- Produits digitaux
  'digital_product_purchased',
  'digital_product_download_ready',
  'digital_product_version_update',
  'digital_product_license_expiring',
  'digital_product_license_expired',
  
  -- Produits physiques
  'physical_product_order_placed',
  'physical_product_order_confirmed',
  'physical_product_order_shipped',
  'physical_product_order_delivered',
  'physical_product_order_cancelled',
  'physical_product_low_stock',
  'physical_product_out_of_stock',
  'physical_product_back_in_stock',
  
  -- Services
  'service_booking_confirmed',
  'service_booking_reminder',
  'service_booking_cancelled',
  'service_booking_completed',
  'service_payment_required',
  
  -- Cours (nouveaux)
  'course_new_content',
  
  -- Artistes
  'artist_product_purchased',
  'artist_product_certificate_ready',
  'artist_product_edition_sold_out',
  'artist_product_shipping_update',
  
  -- Affiliation
  'affiliate_sale',
  'affiliate_commission',
  'commission_created',
  'commission_approved',
  'commission_rejected',
  'commission_paid',
  'commission_threshold_reached',
  'payment_request_created',
  'payment_request_approved',
  'payment_request_rejected',
  'payment_request_processed',
  
  -- Général
  'order_payment_received',
  'order_payment_failed',
  'order_refund_processed',
  'product_review_received',
  
  -- Messages Vendeur (NOUVEAUX)
  'vendor_message_received',
  'customer_message_received',
  'vendor_conversation_started',
  'vendor_conversation_closed',
  
  -- Messages Commandes
  'order_message_received',
  
  -- Autres (existants)
  'comment_reply',
  'instructor_message',
  'system',
  'system_announcement',
  'weekly_report',
  'monthly_report'
));

-- Commentaire
COMMENT ON CONSTRAINT notifications_type_check ON public.notifications IS 
'Types de notifications supportés pour tous les types de produits (digital, physical, service, course, artist) et messages vendeur';

