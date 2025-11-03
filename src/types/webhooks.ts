// ============================================================================
// TYPES: Webhooks System
// ============================================================================

export type WebhookEventType =
  // Commandes
  | 'order.created'
  | 'order.updated'
  | 'order.completed'
  | 'order.cancelled'
  | 'order.refunded'
  // Paiements
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.pending'
  // Produits
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.published'
  // Produits Digitaux
  | 'digital_product.downloaded'
  | 'digital_product.license_activated'
  | 'digital_product.license_revoked'
  // Services
  | 'service.booking_created'
  | 'service.booking_confirmed'
  | 'service.booking_cancelled'
  | 'service.booking_completed'
  | 'service.booking_rescheduled'
  // Cours
  | 'course.enrolled'
  | 'course.unenrolled'
  | 'course.completed'
  | 'course.progress_updated'
  // Retours
  | 'return.created'
  | 'return.approved'
  | 'return.rejected'
  | 'return.completed'
  // Abonnements
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.cancelled'
  | 'subscription.expired'
  // Clients
  | 'customer.created'
  | 'customer.updated'
  // Custom
  | 'custom';

export type WebhookStatus = 'active' | 'inactive' | 'paused';

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying';

// ============================================================================
// Webhook (Configuration)
// ============================================================================

export interface Webhook {
  id: string;
  store_id: string;
  created_by: string | null;
  name: string;
  description: string | null;
  url: string;
  secret: string | null;
  events: WebhookEventType[];
  status: WebhookStatus;
  retry_count: number;
  timeout_seconds: number;
  rate_limit_per_minute: number;
  custom_headers: Record<string, string>;
  verify_ssl: boolean;
  include_payload: boolean;
  metadata: Record<string, any>;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  created_at: string;
  updated_at: string;
  last_triggered_at: string | null;
  last_successful_delivery_at: string | null;
  last_failed_delivery_at: string | null;
}

// ============================================================================
// WebhookDelivery (Historique des livraisons)
// ============================================================================

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: WebhookEventType;
  event_id: string;
  event_data: Record<string, any>;
  status: WebhookDeliveryStatus;
  url: string;
  request_headers: Record<string, string>;
  request_body: string | null;
  response_status_code: number | null;
  response_body: string | null;
  response_headers: Record<string, string>;
  attempt_number: number;
  max_attempts: number;
  next_retry_at: string | null;
  error_message: string | null;
  error_type: string | null;
  duration_ms: number | null;
  metadata: Record<string, any>;
  triggered_at: string;
  delivered_at: string | null;
  failed_at: string | null;
}

// ============================================================================
// Form Types
// ============================================================================

export interface CreateWebhookForm {
  name: string;
  description?: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  status?: WebhookStatus;
  retry_count?: number;
  timeout_seconds?: number;
  rate_limit_per_minute?: number;
  custom_headers?: Record<string, string>;
  verify_ssl?: boolean;
  include_payload?: boolean;
}

export interface UpdateWebhookForm extends Partial<CreateWebhookForm> {
  id: string;
}

// ============================================================================
// Stats & Filters
// ============================================================================

export interface WebhookStats {
  total_webhooks: number;
  active_webhooks: number;
  inactive_webhooks: number;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate: number;
  average_response_time_ms: number;
}

export interface WebhookFilters {
  store_id?: string;
  status?: WebhookStatus;
  event_type?: WebhookEventType;
  search?: string;
}

export interface WebhookDeliveryFilters {
  webhook_id?: string;
  event_type?: WebhookEventType;
  status?: WebhookDeliveryStatus;
  date_from?: string;
  date_to?: string;
}

// ============================================================================
// Event Data Types (Pour chaque type d'événement)
// ============================================================================

export interface OrderEventData {
  order: {
    id: string;
    store_id: string;
    customer_id: string;
    order_number: string;
    status: string;
    total_amount: number;
    currency: string;
    payment_status: string;
    created_at: string;
  };
  order_items?: Array<{
    id: string;
    product_id: string;
    product_type: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export interface PaymentEventData {
  payment: {
    id: string;
    order_id: string;
    transaction_id: string;
    amount: number;
    currency: string;
    status: string;
    payment_method: string;
    created_at: string;
  };
  order?: OrderEventData['order'];
}

export interface ProductEventData {
  product: {
    id: string;
    store_id: string;
    name: string;
    slug: string;
    product_type: string;
    price: number;
    currency: string;
    status: string;
    created_at: string;
  };
}

export interface DigitalProductEventData extends ProductEventData {
  download?: {
    id: string;
    license_key: string | null;
    download_url: string;
    expires_at: string;
  };
  license?: {
    id: string;
    license_key: string;
    license_type: string;
    status: string;
  };
}

export interface ServiceBookingEventData {
  booking: {
    id: string;
    product_id: string;
    user_id: string;
    scheduled_date: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    status: string;
    meeting_url?: string;
    created_at: string;
  };
  service?: ProductEventData['product'];
}

export interface CourseEventData {
  enrollment: {
    id: string;
    course_id: string;
    user_id: string;
    progress_percentage: number;
    status: string;
    enrolled_at: string;
  };
  course?: ProductEventData['product'];
}

export interface ReturnEventData {
  return: {
    id: string;
    order_item_id: string;
    customer_id: string;
    store_id: string;
    return_number: string;
    return_reason: string;
    status: string;
    refund_amount: number;
    created_at: string;
  };
  order_item?: OrderEventData['order_items'][0];
}

// ============================================================================
// Webhook Payload (Format envoyé aux endpoints)
// ============================================================================

export interface WebhookPayload {
  id: string; // delivery_id
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  metadata?: {
    store_id?: string;
    version?: string;
  };
}

